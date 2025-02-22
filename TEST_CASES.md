# Jump History Extension Test Cases

## File Navigation History
### Test Case 1: Basic File Navigation
1. Open file A
2. Open file B
Expected:
- Tree view shows:
  ```
  ▪︎ A
      • B
  ```
- Quick pick panel shows both files with timestamps

### Test Case 2: Multiple Navigation Paths
1. Open file A
2. Open file B
3. Return to A
4. Open file C
Expected:
- Tree view shows:
  ```
  ▪︎ A
      • B
      • C
  ```
- Quick pick panel shows all files sorted by timestamp

## Definition Jumps
### Test Case 1: Basic Definition Jump
1. Open source file
2. Use F12 on a symbol
Expected:
- Tree view updates to show the navigation
- Both files appear in quick pick panel

### Test Case 2: Multiple Definition Jumps
1. Open source file A
2. Jump to definition in file B
3. Jump to another definition in file C
Expected:
- Tree view shows the navigation chain
- All files appear in quick pick panel sorted by timestamp

## Persistence
### Test Case 1: Session Persistence
1. Navigate through multiple files
2. Close VSCode
3. Reopen VSCode
Expected:
- Tree view restores previous navigation history
- Quick pick panel shows all previous entries

## Quick Pick Panel
### Test Case 1: Basic Functionality
1. Open command palette
2. Run "Show Jump History"
Expected:
- Panel shows all navigated files
- Files are sorted by timestamp (most recent first)
- Each entry shows:
  - File name
  - Relative path
  - Timestamp

### Test Case 2: File Selection
1. Open quick pick panel
2. Select a file
Expected:
- Selected file opens in editor
- Panel closes automatically

## Error Cases
### Test Case 1: Deleted Files
1. Navigate through multiple files
2. Delete one of the files
Expected:
- Tree view and quick pick handle missing file gracefully
- No crashes or error messages to user

### Test Case 2: Invalid Navigation
1. Try to navigate to non-existent file
Expected:
- Extension handles error gracefully
- No crashes or error messages to user
