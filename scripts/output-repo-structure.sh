#!/bin/bash

# output-repo-structure.sh
#
# This script outputs repository structure and file contents to a specified output file.
#
# Usage:
#   ./scripts/output-repo-structure.sh <output_file> <input_file1> [input_file2 ...]
#
# Examples:
#   # Output structure and contents of specific files:
#   ./scripts/output-repo-structure.sh output.txt src/main.ts src/utils.ts
#
#   # Output structure and all TypeScript files in src:
#   ./scripts/output-repo-structure.sh output.txt $(find src -name "*.ts")
#
#   # Output structure and all files modified in last commit:
#   ./scripts/output-repo-structure.sh output.txt $(git diff --name-only HEAD^)
#
# Notes:
#   - First argument must be the output file path
#   - Subsequent arguments are input files to include
#   - Repository structure excludes: .git, node_modules, dist, build, coverage
#   - Requires 'tree' command (falls back to 'find' if not available)

# Check if at least 2 arguments are provided
if [ "$#" -lt 2 ]; then
    echo "Usage: $0 output_file input_file1 [input_file2 ...]"
    exit 1
fi

# Get output file from first argument
output_file="$1"
shift  # Remove first argument, leaving only input files

# Create or clear the output file
> "$output_file"

# Function to write section header
write_header() {
    echo -e "\n=== $1 ===\n" >> "$output_file"
}

# 1. Output repository structure
write_header "Repository Structure"
if command -v tree &> /dev/null; then
    tree -a -I '.git|node_modules|dist|build|coverage' . >> "$output_file"
else
    # Fallback if tree is not installed
    find . -not -path '*/\.*' -not -path '*/node_modules/*' -not -path '*/dist/*' -not -path '*/build/*' -not -path '*/coverage/*' | sed -e "s/[^-][^\/]*\// |/g" -e "s/|\([^ ]\)/|-\1/" >> "$output_file"
fi

# 2. Loop through input files and output contents
write_header "File Contents"

for file in "$@"; do
    if [ -f "$file" ]; then
        echo -e "\n--- $file ---\n" >> "$output_file"
        cat "$file" >> "$output_file"
    else
        echo -e "\nWarning: File not found - $file" >> "$output_file"
    fi
done

echo "Output written to $output_file"
