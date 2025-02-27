# Jump History

A Visual Studio Code extension that tracks and visualizes your code navigation history when jumping between definitions.

## Features

This extension helps you keep track of your code reading path by:

- Creating a tree-like structure of your definition jumps
- Displaying the navigation tree in the OUTPUT panel
- Helping you understand the context of your code reading

For example, when you navigate through code:

1. Open file A
2. Jump to a definition in file B
3. Jump to another definition in file C
4. Switch to an already open tab D

The extension will display a tree like:

```
* A
  * B
    * C
* D
```

This helps you visualize your code reading path and maintain context.

## Usage

The extension automatically tracks your navigation between files. To view or manage your navigation tree:

- **Show Navigation Tree**: Run the command `Jump History: Show Navigation Tree` from the Command Palette
- **Reset Navigation Tree**: Run the command `Jump History: Reset Navigation Tree` from the Command Palette

## Requirements

- Visual Studio Code 1.60.0 or higher

## Extension Settings

This extension doesn't have any specific settings yet.

## Known Issues

- The extension uses a simplistic approach to detect definition jumps. It may not accurately capture all types of navigation.

## Release Notes

### 1.1.0

- Changed behavior when switching to already open tabs: now creates a new branch in the tree instead of continuing the current branch
- This provides clearer separation between definition jumps and tab switching

### 1.0.1

- Fixed issue where the Jump History OUTPUT tab would take focus after every editor operation
- The OUTPUT tab now only shows when explicitly requested via commands

### 1.0.0

Initial release of Jump History
