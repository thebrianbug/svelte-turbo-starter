# Utility Scripts

This directory contains utility scripts to help with development and maintenance of the project.

## Available Scripts

### output-repo-structure.sh

Generates documentation of repository structure and file contents. Useful for:

- Creating documentation snapshots
- Sharing code context with team members
- Preparing code reviews
- Documenting changes across multiple files

**Usage:**

```sh
./scripts/output-repo-structure.sh <output_file> <input_file1> [input_file2 ...]
```

**Examples:**

```sh
# Output structure and specific files
./scripts/output-repo-structure.sh output.txt src/main.ts src/utils.ts

# Output structure and all TypeScript files in src
./scripts/output-repo-structure.sh output.txt $(find src -name "*.ts")

# Output structure and all files modified in last commit
./scripts/output-repo-structure.sh output.txt $(git diff --name-only HEAD^)
```

**Output Format:**

```
=== Repository Structure ===
[Directory tree structure, excluding .git, node_modules, etc.]

=== File Contents ===

--- src/file1.ts ---
[Contents of file1.ts]

--- src/file2.ts ---
[Contents of file2.ts]
```

**Notes:**

- First argument must be the output file path
- Subsequent arguments are input files to include
- Only includes files tracked by git and `.env` files
- Requires 'tree' command (falls back to 'find' if not available)
