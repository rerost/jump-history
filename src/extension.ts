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

  // Initialize with an array of root nodes
  let rootNodes: JumpNode[] = [];
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

  // Function to check if a URI exists anywhere in the tree
  function isUriInTree(uri: vscode.Uri): boolean {
    // Check all root nodes
    for (const rootNode of rootNodes) {
      if (isUriInSubtree(uri, rootNode)) {
        return true;
      }
    }
    return false;
  }

  // Helper function to check if a URI exists in a subtree
  function isUriInSubtree(uri: vscode.Uri, node: JumpNode): boolean {
    // Check if the current node matches the URI
    if (node.uri.toString() === uri.toString()) {
      return true;
    }
    
    // Check all children recursively
    for (const child of node.children) {
      if (isUriInSubtree(uri, child)) {
        return true;
      }
    }
    
    return false;
  }

  // Function to print the tree to the output channel
  function printTree(showOutput: boolean = false) {
    if (rootNodes.length === 0) {
      outputChannel.appendLine('No Jump History Navigation data yet.');
      if (showOutput) {
        outputChannel.show();
      }
      return;
    }

    outputChannel.clear();
    outputChannel.appendLine('Jump History Navigation Tree:');
    
    function printNode(node: JumpNode, indent: string = '') {
      outputChannel.appendLine(`${indent}* ${node.fileName}`);
      
      for (const child of node.children) {
        printNode(child, indent + '  ');
      }
    }

    // Print each root node
    for (const rootNode of rootNodes) {
      printNode(rootNode);
    }
    
    // Only show the output channel when explicitly requested
    if (showOutput) {
      outputChannel.show();
    }
  }

  // Track the last active document URI
  let lastActiveDocumentUri: vscode.Uri | null = null;

  // Event handler for when the active editor changes
  const onActiveEditorChanged = vscode.window.onDidChangeActiveTextEditor(editor => {
    if (!editor) {
      return;
    }

    const uri = editor.document.uri;
    
    // Initialize root nodes if empty
    if (rootNodes.length === 0) {
      const newNode = createNode(uri, null);
      rootNodes.push(newNode);
      currentNode = newNode;
      lastActiveDocumentUri = uri;
      printTree(false);
      return;
    }

    // Skip if it's the same document
    if (currentNode && uri.toString() === currentNode.uri.toString()) {
      return;
    }

    // Check if this is a definition jump or a direct file open
    const isDefinitionJump = lastEditor && lastPosition && lastActiveDocumentUri;
    
    // Track if the tree was modified
    let treeModified = false;
    
    if (isDefinitionJump) {
      // If we're returning to a parent node
      if (currentNode && currentNode.parent && 
          uri.toString() === currentNode.parent.uri.toString()) {
        // Move up to the parent
        currentNode = currentNode.parent;
        treeModified = true;
      } 
      // Check if we're navigating to an existing child node
      else if (currentNode && currentNode.children.some(child => child.uri.toString() === uri.toString())) {
        // Find and navigate to the existing child node
        const existingChild = currentNode.children.find(child => child.uri.toString() === uri.toString());
        if (existingChild) {
          currentNode = existingChild;
          treeModified = true;
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
          if (currentNode && currentNode.parent === null) {
            // If current node is a root, add the new node as a child
            currentNode.children.push(newNode);
            newNode.parent = currentNode;
          } else if (rootNodes.length > 0) {
            // Otherwise, add as a child of the first root
            rootNodes[0].children.push(newNode);
            newNode.parent = rootNodes[0];
          }
          currentNode = newNode;
          treeModified = true;
        } else {
          // Create a new node as a child of the current node
          const newNode = createNode(uri, currentNode);
          if (currentNode) {
            currentNode.children.push(newNode);
            currentNode = newNode;
            treeModified = true;
          }
        }
      }
    } else {
      // This is not a definition jump (e.g., manually opening a file)
      // Check if the URI is already in the tree
      if (!isUriInTree(uri)) {
        // If not in the tree, add it as a new root node
        const newRootNode = createNode(uri, null);
        rootNodes.push(newRootNode);
        currentNode = newRootNode;
        treeModified = true;
      }
    }
    
    // Print the tree if it was modified
    if (treeModified) {
      printTree(false);
    }

    // Update last position, editor, and active document URI
    lastPosition = editor.selection.active;
    lastEditor = editor;
    lastActiveDocumentUri = uri;
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
    rootNodes = [];
    currentNode = null;
    lastPosition = null;
    lastEditor = null;
    outputChannel.clear();
    outputChannel.appendLine('Jump History Navigation Tree has been reset.');
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
