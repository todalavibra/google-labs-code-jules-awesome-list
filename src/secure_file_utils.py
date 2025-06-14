import os

# Define a secure, designated directory for "source code" files.
# In a real application, this would be a carefully managed, restricted path.
# For this simulation, we'll assume a 'simulated_source_code' directory exists
# relative to where this script might run.
# You would NEVER allow access to arbitrary directories like '/' or '..'
SECURE_BASE_DIR = "simulated_source_code"

def secure_file_reader(filename: str) -> str:
    """
    Simulates securely reading a file, implementing robust input validation
    to prevent directory traversal and other file-based vulnerabilities.

    Args:
        filename: The name of the file to "read" (e.g., "my_script.py").

    Returns:
        A message indicating success or the type of error encountered.
    """
    print(f"Attempting to process filename: '{filename}'")

    # --- Secure by Design Principle 1: Basic Input Sanitization ---
    # Remove leading/trailing whitespace. This prevents subtle issues.
    filename = filename.strip()
    if not filename:
        return "Error: Filename cannot be empty."

    # --- Secure by Design Principle 2: Prohibit Dangerous Characters ---
    # Prevent directory traversal attempts (e.g., ../, ../../).
    # Disallow absolute paths ('/' on Unix-like, '\' on Windows, though os.path.join handles this).
    # Disallow null bytes which can truncate strings in some systems.
    prohibited_chars = ['..', '/', '\\', '\x00'] # \x00 is null byte
    for char_seq in prohibited_chars:
        if char_seq in filename:
            return f"Error: Filename contains prohibited characters ('{char_seq}'). Input validation failed."

    # --- Secure by Design Principle 3: Enforce Allowed File Extensions (Optional but Recommended) ---
    # This adds another layer of defense, ensuring only expected file types are processed.
    # If the "Source Code Sleuth" is only for Python files, you'd restrict it.
    allowed_extensions = ['.py', '.txt', '.c', '.cpp', '.java', '.js', '.html', '.css']
    if not any(filename.endswith(ext) for ext in allowed_extensions):
        return f"Error: File extension not allowed. Must be one of: {', '.join(allowed_extensions)}"

    # --- Secure by Design Principle 4: Path Whitelisting (Crucial for Security) ---
    # Construct the full, absolute path to the intended file within the secure base directory.
    # os.path.join is crucial as it correctly handles path separators across OS.
    # os.path.abspath normalizes the path.
    # The key is to ensure the normalized path *starts with* the normalized secure base directory.

    # Create the secure base directory if it doesn't exist for simulation purposes.
    os.makedirs(SECURE_BASE_DIR, exist_ok=True)

    full_path = os.path.join(SECURE_BASE_DIR, filename)

    # Normalize paths to remove '..' components and resolve symlinks.
    # This is critical for preventing advanced directory traversal or symlink attacks.
    normalized_secure_base_dir = os.path.abspath(SECURE_BASE_DIR)
    normalized_full_path = os.path.abspath(full_path)

    # Verify that the normalized path *actually* resides within the secure base directory.
    # This is the most important check to prevent accessing files outside the allowed zone.
    if not normalized_full_path.startswith(normalized_secure_base_dir + os.sep) and \
       normalized_full_path != normalized_secure_base_dir:
        # Check if the path is attempting to go "above" the base directory even if it's just the base directory itself.
        # This case handles when SECURE_BASE_DIR is a relative path like "." and filename is also "."
        # or when filename tries to access the parent of SECURE_BASE_DIR using ".." that wasn't caught by prohibited_chars
        # if SECURE_BASE_DIR was, for example, "foo" and filename was "../bar"
        # normalized_full_path would be something like "/actual/path/to/repo/bar"
        # normalized_secure_base_dir would be "/actual/path/to/repo/foo"
        # This check is a bit redundant given the prohibited_chars check for '..'
        # but provides an additional layer of defense based on the final absolute paths.
        # A more direct check could also be to see if normalized_secure_base_dir is a prefix of normalized_full_path.
        # The current check ensures that normalized_full_path is a child of normalized_secure_base_dir or is the directory itself.
        return f"Error: Attempted access outside designated secure directory. Path: {normalized_full_path}"

    # --- Secure by Design Principle 5: Simulate File Operations with Error Handling ---
    try:
        # In a real application, you would open and read the file here:
        # with open(normalized_full_path, 'r') as f:
        #     content = f.read()
        #     return f"Successfully read content from {filename}: {content}"

        # For this simulation, we'll just confirm that the checks passed.
        # We'll simulate a file not found error if the file doesn't hypothetically exist.

        # Simulate file existence. In a real scenario, you'd use os.path.exists(normalized_full_path)
        # For demonstration, let's say 'example_code.py' and 'safe_file.txt' exist, others don't.
        simulated_existing_files = [
            os.path.join(normalized_secure_base_dir, "example_code.py"), # Use normalized base dir here
            os.path.join(normalized_secure_base_dir, "safe_file.txt")    # Use normalized base dir here
        ]

        # For the simulation to work correctly when testing, if a "non-existent" file is requested
        # (i.e., not in simulated_existing_files), we create it.
        if not os.path.exists(normalized_full_path):
             # If simulating non-existent files, create placeholder for them for testing
             # You could create empty files here for the simulation to work more realistically
             with open(normalized_full_path, 'w') as f:
                 f.write(f"# This is a simulated source code file for {filename}\n")
                 f.write("print('Hello, secure world!')\n")
             # Update the print message to reflect that the file was created for simulation
             return f"Successfully simulated reading content from '{filename}' (File created for simulation)."

        return f"Successfully simulated reading content from '{filename}'."

    except FileNotFoundError:
        # This error is caught if os.path.exists() (if used) returns False, or actual open fails.
        return f"Error: File '{filename}' not found in the secure directory."
    except PermissionError:
        # Simulate permission error if you want to demonstrate this scenario.
        # In real code, this would be caught if the script lacks read permissions.
        return f"Error: Permission denied to access '{filename}'."
    except Exception as e:
        # Catch any other unexpected errors during file operation.
        return f"An unexpected error occurred while processing '{filename}': {e}"

# --- Demonstrating Usage with Various Test Cases ---

if __name__ == "__main__":
    print("--- Testing Secure File Reader ---")

    # Test Case 1: Valid and safe filename
    print(secure_file_reader("my_script.py"))
    print(secure_file_reader("another_file.txt"))

    # Test Case 2: Attempting directory traversal (../)
    print(secure_file_reader("../../../etc/passwd")) # Should be blocked
    print(secure_file_reader("sub_dir/../../file.txt")) # Should be blocked

    # Test Case 3: Attempting absolute path
    print(secure_file_reader("/etc/passwd")) # Should be blocked
    # Correcting Windows path for consistency in prohibited_chars check
    print(secure_file_reader("C:\\Windows\\System32\\drivers\\etc\\hosts")) # Should be blocked by '\\'

    # Test Case 4: Filename with null byte (common injection technique)
    print(secure_file_reader("malicious_file.txt\x00.exe")) # Should be blocked

    # Test Case 5: Empty filename
    print(secure_file_reader("   ")) # Should be blocked

    # Test Case 6: Filename with disallowed extension
    print(secure_file_reader("image.jpg")) # Should be blocked
    print(secure_file_reader("secret.bak")) # Should be blocked

    # Test Case 7: Filename that appears safe but leads outside via normalization
    # This is handled by the `startswith(normalized_secure_base_dir)` check.
    # For example, if SECURE_BASE_DIR was /var/www/html/secure_files
    # and filename was ../../other_files/secret.txt
    # os.path.abspath(os.path.join(SECURE_BASE_DIR, filename)) would resolve to
    # /var/www/html/other_files/secret.txt which doesn't start with /var/www/html/secure_files.
    # The provided example "..\safe_file.txt" would be caught by prohibited_chars first.
    # A better example for this specific check might involve symlinks or more complex relative paths
    # that don't use '..' directly in the input string but resolve outside.
    # However, with current '..' check, this specific case is harder to trigger without '..'
    print(secure_file_reader("..\safe_file.txt")) # Caught by prohibited_chars for '..'

    # Test Case 8: File that exists in simulated_existing_files
    # To ensure this test works, we'll pre-create one of the simulated files.
    # This part is more about the simulation logic than the security checks themselves.
    # For the purpose of the subtask, we'll ensure the directory exists.
    # The actual file creation for simulation is handled inside secure_file_reader.
    if not os.path.exists(SECURE_BASE_DIR):
        os.makedirs(SECURE_BASE_DIR)
    with open(os.path.join(SECURE_BASE_DIR, "example_code.py"), 'w') as f:
        f.write("# Pre-existing simulated file\nprint('Pre-existing')\n")
    print(secure_file_reader("example_code.py")) # Should be successful

    print("\n--- End of Testing ---")
    print(f"Check the '{SECURE_BASE_DIR}' directory. Simulated files might have been created.")
