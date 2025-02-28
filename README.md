# Project Groot

## Overview

## Code in groot.mjs

The `groot.mjs` file contains the main logic for the Groot project. It includes the following key components:

- **Initialization**: Sets up the necessary configurations and dependencies.
  - Loads environment variables.
  - Configures logging and error handling.
- **Exported Modules**: Exports the main functions and classes for use in other parts of the project.
  - `init()`: Initializes the project.
  - `add(file)`: Adds a file to the staging area.
  - `commit(message)`: Commits the staged changes with a message.
  - `log()`: Displays the commit history.
  - `show(commitHash)`: Shows the differences for a specific commit.

## Usage

To run the project, use the following command:

```bash
node groot.mjs
```

Ensure that all dependencies are installed and the environment variables are properly configured before running the project.

### Commands

- **Initialize the repository**:

  ```bash
  node groot.mjs init
  ```

- **Add a file to the staging area**:

  ```bash
  node groot.mjs add <file>
  ```

- **Commit the staged changes**:

  ```bash
  node groot.mjs commit <message>
  ```

- **View the commit history**:

  ```bash
  node groot.mjs log
  ```

- **Show the differences for a specific commit**:
  ```bash
  node groot.mjs show <commitHash>
  ```
