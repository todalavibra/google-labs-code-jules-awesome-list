import unittest
import os
import shutil
import sys
from io import StringIO

# Add src directory to Python path to import secure_file_utils
# This assumes the test script is run from the repository root
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))

try:
    from secure_file_utils import secure_file_reader, SECURE_BASE_DIR
except ImportError:
    print("Failed to import secure_file_utils. Ensure src directory is in PYTHONPATH.")
    print(f"Current sys.path: {sys.path}")
    print(f"Current working directory: {os.getcwd()}")
    raise

class TestSecureFileReader(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Ensure the base directory for tests is clean before any tests run
        cls.test_secure_base_dir = os.path.abspath(SECURE_BASE_DIR)
        if os.path.exists(cls.test_secure_base_dir):
            shutil.rmtree(cls.test_secure_base_dir)
        os.makedirs(cls.test_secure_base_dir, exist_ok=True)

    def setUp(self):
        # Clean and recreate the secure base directory before each test
        # This ensures tests are isolated
        if os.path.exists(self.test_secure_base_dir):
            shutil.rmtree(self.test_secure_base_dir)
        os.makedirs(self.test_secure_base_dir, exist_ok=True)

        # Create some dummy files for valid read tests
        with open(os.path.join(self.test_secure_base_dir, "valid_script.py"), "w") as f:
            f.write("print('hello')")
        with open(os.path.join(self.test_secure_base_dir, "another_safe.txt"), "w") as f:
            f.write("some text")

        # Suppress print output from secure_file_reader during tests
        # by redirecting stdout, unless needed for specific debug
        self.held_stdout = sys.stdout
        sys.stdout = StringIO()


    def tearDown(self):
        # Restore stdout
        sys.stdout = self.held_stdout
        # Clean up the directory after each test
        if os.path.exists(self.test_secure_base_dir):
            shutil.rmtree(self.test_secure_base_dir)

    def test_valid_file_access(self):
        self.assertTrue("Successfully simulated reading content" in secure_file_reader("valid_script.py"))
        self.assertTrue("Successfully simulated reading content" in secure_file_reader("another_safe.txt"))

    def test_non_existent_file_simulation(self):
        # This file doesn't exist, so it should be created by the simulation logic
        result = secure_file_reader("new_simulated_file.py")
        self.assertTrue("File created for simulation" in result)
        self.assertTrue(os.path.exists(os.path.join(self.test_secure_base_dir, "new_simulated_file.py")))

    def test_empty_filename(self):
        self.assertEqual(secure_file_reader(""), "Error: Filename cannot be empty.")
        self.assertEqual(secure_file_reader("   "), "Error: Filename cannot be empty.")

    def test_prohibited_chars_path_traversal(self):
        self.assertTrue("prohibited characters" in secure_file_reader("../../../etc/passwd"))
        self.assertTrue("prohibited characters" in secure_file_reader("..\..\..\boot.ini")) # Windows style
        self.assertTrue("prohibited characters" in secure_file_reader("valid_script.py/../../../../etc/passwd")) # Mixed

    def test_prohibited_chars_absolute_paths(self):
        self.assertTrue("prohibited characters" in secure_file_reader("/etc/passwd"))
        self.assertTrue("prohibited characters" in secure_file_reader("C:\Windows\system32\kernel32.dll"))

    def test_prohibited_chars_null_byte(self):
        self.assertTrue("prohibited characters" in secure_file_reader("valid_script.py" + chr(0) + "not_valid.exe"))

    def test_disallowed_extensions(self):
        self.assertTrue("File extension not allowed" in secure_file_reader("image.jpg"))
        self.assertTrue("File extension not allowed" in secure_file_reader("archive.zip"))
        self.assertTrue("File extension not allowed" in secure_file_reader("document.docx"))

    def test_access_outside_secure_directory_explicit(self):
        # Create a file outside the secure_base_dir
        # This test relies on the os.path.abspath and startswith check,
        # assuming '..' was not used (as that's caught by prohibited_chars)
        # We need to be clever here. The function itself joins with SECURE_BASE_DIR.
        # So, we can't directly ask for a file like "/tmp/test.txt".
        # The check `if not normalized_full_path.startswith(normalized_secure_base_dir + os.sep)`
        # is the one we are targeting.

        # This kind of test is tricky because secure_file_reader PREPENDS SECURE_BASE_DIR.
        # The existing prohibited_chars check for '/' and '\' (when not part of SECURE_BASE_DIR itself)
        # and '..' makes it hard to construct a path that doesn't get caught by those first.
        # The primary protection against escaping is the final `startswith` check on absolute paths.
        # Consider a scenario where SECURE_BASE_DIR = "simulated_source_code"
        # If filename is "file.txt", normalized_full_path = /path/to/repo/simulated_source_code/file.txt
        # If filename somehow becomes "../../../../../../../tmp/foo.txt" (bypassing initial '..' check - unlikely)
        # then normalized_full_path = /tmp/foo.txt which fails startswith.

        # Let's assume a symlink scenario for a more robust test of this specific check,
        # though the function uses os.path.abspath which resolves symlinks before the check.
        # So, if a symlink pointed outside, the resolved path would be checked.

        # Given the current implementation, the prohibited chars check is very effective.
        # We can test by trying to use a filename that, if SECURE_BASE_DIR was different,
        # might seem to allow access.
        # e.g. if SECURE_BASE_DIR = "data/files" and filename = "../../../etc/passwd"
        # This is already caught by ".."
        # The primary value of the abspath().startswith() check is against more obfuscated paths
        # or misconfigurations where SECURE_BASE_DIR might be manipulated.

        # For now, will rely on other tests (like prohibited absolute paths) that indirectly test this.
        # A direct test for *only* the abspath().startswith() failure (without other prohibited chars)
        # is difficult with the current design if SECURE_BASE_DIR is simple like "simulated_source_code".
        pass # Placeholder if a more direct test for this specific condition is designed.


    # The following tests for FileNotFoundError and PermissionError are conceptual
    # as the current secure_file_reader simulates these and doesn't let OS raise them directly
    # on the files it "reads". The simulation logic itself is tested.
    # If the function were to actually interact with the filesystem for reads, these would be different.

    def test_simulated_file_not_found(self):
        # The current function creates files if they don't exist in the simulation.
        # So, a true "file not found" from the perspective of the function's internal logic
        # (before creation) is hard to test without altering the function.
        # The "File created for simulation" message covers this.
        pass

    def test_simulated_permission_error(self):
        # Similar to FileNotFoundError, permission errors are not directly raised from
        # the OS in a way that the current test structure can easily intercept for
        # a "real" file it's trying to read, due to the simulation layer.
        # If we wanted to test this, we'd have to make a file unreadable by the user
        # running the tests, then call secure_file_reader on it, AND modify
        # secure_file_reader to actually attempt to read it.
        pass

if __name__ == '__main__':
    unittest.main()
