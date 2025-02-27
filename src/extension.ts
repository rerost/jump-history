import * as vscode from 'vscode';

// Interface for a node in our jump history tree
interface JumpNode {
  uri: vscode.Uri;
  fileName: string;
  children: JumpNode[];
  parent: JumpNode | null;
}

export function activate(context: vscode.ExtensionContext) {
  console.log('Jump History extension is now active');

  // Create output channel for displaying the jump history tree
  const outputChannel = vscode.window.createOutputChannel('Jump History');

  // Initialize the root node with the first opened document
  let rootNode: JumpNode | null = null;
  let currentNode: JumpNode | null = null;

  // Track the last position before jump
  let lastPosition: vscode.Position | null = null;
  let lastEditor: vscode.TextEditor | null = null;

  // Function to create a new node
  function createNode(uri: vscode.Uri, parent: JumpNode | null): JumpNode {
    return {
      uri,
      fileName: getDisplayPath(uri),
      children: [],
      parent
    };
  }

  // Function to get the display path for a file
  function getDisplayPath(uri: vscode.Uri): string {
    // Get workspace folders
    const workspaceFolders = vscode.workspace.workspaceFolders;
    
    if (workspaceFolders && workspaceFolders.length > 0) {
      // Check if the file is within any workspace folder
      for (const folder of workspaceFolders) {
        const folderPath = folder.uri.fsPath;
        const filePath = uri.fsPath;
        
        if (filePath.startsWith(folderPath)) {
          // Return the path relative to the workspace folder
          const relativePath = filePath.substring(folderPath.length);
          // Remove leading slash if present
          return relativePath.startsWith('/') || relativePath.startsWith('\\') 
            ? relativePath.substring(1) 
            : relativePath;
        }
      }
    }
    
    // If not in workspace or no workspace is open, return the full path
    return uri.fsPath;
  }

  // Function to print the tree to the output channel
  function printTree(showOutput: boolean = false) {
    if (!rootNode) {
      outputChannel.appendLine('No jump history yet.');
      return;
    }

    outputChannel.clear();
    outputChannel.appendLine('Jump History Tree:');
    
    function printNode(node: JumpNode, indent: string = '') {
      outputChannel.appendLine(`${indent}* ${node.fileName}`);
      
      for (const child of node.children) {
        printNode(child, indent + '  ');
      }
    }

    printNode(rootNode);
    
    // Only show the output channel when explicitly requested
    if (showOutput) {
      outputChannel.show();
    }
  }

  // Event handler for when the active editor changes
  const onActiveEditorChanged = vscode.window.onDidChangeActiveTextEditor(editor => {
    if (!editor) {
      return;
    }

    const uri = editor.document.uri;
    
    // Initialize root node if it doesn't exist
    if (!rootNode) {
      rootNode = createNode(uri, null);
      currentNode = rootNode;
      printTree();
      return;
    }

    // Skip if it's the same document
    if (currentNode && uri.toString() === currentNode.uri.toString()) {
      return;
    }

    // Check if this is a definition jump
    if (lastEditor && lastPosition) {
      // This is a simplistic way to detect definition jumps
      // In a real extension, you might want to use the vscode.executeDefinitionProvider API
      // to determine if this was actually a definition jump
      
      // If we're returning to a parent node
      if (currentNode && currentNode.parent && 
          uri.toString() === currentNode.parent.uri.toString()) {
        // Move up to the parent
        currentNode = currentNode.parent;
      } 
      // Check if we're navigating to an existing child node
      else if (currentNode && currentNode.children.some(child => child.uri.toString() === uri.toString())) {
        // Find and navigate to the existing child node
        const existingChild = currentNode.children.find(child => child.uri.toString() === uri.toString());
        if (existingChild) {
          currentNode = existingChild;
        }
      } else {
        // Check if the file is already open in another tab
        const isAlreadyOpenInAnotherTab = vscode.window.tabGroups.all
          .flatMap(group => group.tabs)
          .some(tab => 
            tab.input instanceof vscode.TabInputText && 
            tab.input.uri.toString() === uri.toString() && 
            // Make sure it's not the current tab
            vscode.window.activeTextEditor && 
            vscode.window.activeTextEditor.document.uri.toString() !== uri.toString()
          );

        if (isAlreadyOpenInAnotherTab) {
          // If switching to an already open tab, create a new branch from the root
          const newNode = createNode(uri, null);
          if (rootNode) {
            rootNode.children.push(newNode);
            currentNode = newNode;
          }
        } else {
          // Create a new node as a child of the current node
          const newNode = createNode(uri, currentNode);
          if (currentNode) {
            currentNode.children.push(newNode);
            currentNode = newNode;
          }
        }
      }
      
      printTree();
    }

    // Update last position and editor
    lastPosition = editor.selection.active;
    lastEditor = editor;
  });

  // Event handler for cursor position changes
  const onCursorPositionChanged = vscode.window.onDidChangeTextEditorSelection(event => {
    if (event.textEditor) {
      lastPosition = event.textEditor.selection.active;
      lastEditor = event.textEditor;
    }
  });

  // Register a command to show the jump history tree
  const showJumpHistoryCommand = vscode.commands.registerCommand('jumpHistory.showTree', () => {
    printTree(true);
  });

  // Register a command to reset the jump history tree
  const resetJumpHistoryCommand = vscode.commands.registerCommand('jumpHistory.reset', () => {
    rootNode = null;
    currentNode = null;
    lastPosition = null;
    lastEditor = null;
    outputChannel.clear();
    outputChannel.appendLine('Jump history has been reset.');
    // Always show the output channel for reset command since it's explicitly requested
    outputChannel.show();
  });

  // Add all disposables to the context
  context.subscriptions.push(
    onActiveEditorChanged,
    onCursorPositionChanged,
    showJumpHistoryCommand,
    resetJumpHistoryCommand
  );
}

export function deactivate() {
  // Clean up resources
}
