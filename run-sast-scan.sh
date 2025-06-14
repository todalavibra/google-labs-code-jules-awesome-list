#!/bin/bash
#
# This script runs Semgrep for static analysis.
# It's intended to be used in CI/CD pipelines.

echo "Starting Semgrep SAST scan..."

# Install Semgrep if not available (common in CI environments)
# This is just an example; actual installation might vary based on CI runner setup.
if ! command -v semgrep &> /dev/null
then
    echo "Semgrep not found. Attempting to install via pip..."
    python3 -m pip install semgrep
    # Ensure the semgrep binary is in the PATH if installed this way
    # This might require export PATH="$HOME/.local/bin:$PATH" depending on the system
fi

# Run Semgrep CI. It will use configurations from .semgrep.yml or other discovered rule files.
# The `semgrep ci` command is suitable for CI environments and will exit with a non-zero code
# if issues are found, which can fail the build.
semgrep ci

echo "Semgrep scan complete."
