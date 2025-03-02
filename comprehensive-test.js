const fs = require('fs');

// Write to a file
fs.writeFileSync('comprehensive-test-output.txt', 'Comprehensive Test Output\n');
fs.appendFileSync('comprehensive-test-output.txt', 'Current directory: ' + __dirname + '\n');

// Mock VSCode API
class Uri {
  constructor(path) {
    this.path = path;
    this.fsPath = path;
  }
  
  toString() {
    return this.path;
  }
  
  static file(path) {
    return new Uri(path);
  }
  
  static parse(uri) {
    return new Uri(uri);
  }
}

class Position {
  constructor(line, character) {
    this.line = line;
    this.character = character;
  }
}

class Selection {
  constructor(anchor, active) {
    this.anchor = anchor;
    this.active = active;
  }
}

class OutputChannel {
  constructor(name) {
    this.name = name;
    this.content = '';
  }
  
  appendLine(line) {
    this.content += line + '\n';
    fs.appendFileSync('comprehensive-test-output.txt', line + '\n');
  }
  
  clear() {
    this.content = '';
  }
  
  show() {
    // No-op
  }
}

// Create a mock VSCode environment
const vscode = {
  Uri,
  Position,
  Selection,
  window: {
    createOutputChannel: (name) => new OutputChannel(name),
    activeTextEditor: null,
    tabGroups: {
      all: []
    }
  },
  workspace: {
    workspaceFolders: [{ uri: Uri.file('/workspace') }]
  },
  commands: {
    registerCommand: (name, callback) => {
      vscode.commands[name] = callback;
      return { dispose: () => {} };
    }
  }
};

// Create a mock extension context
const context = {
  subscriptions: []
};

// Create a simple implementation of the JumpNode interface
class JumpNode {
  constructor(uri, fileName, parent = null) {
    this.uri = uri;
    this.fileName = fileName;
    this.children = [];
    this.parent = parent;
  }
}

// Implement the extension's activate function
function activate(context) {
  fs.appendFileSync('comprehensive-test-output.txt', 'Activating extension...\n');
  
  // Create output channel for displaying the jump history tree
  const outputChannel = vscode.window.createOutputChannel('Jump History');
  
  // Initialize with an array of root nodes
  let rootNodes = [];
  let currentNode = null;
  
  // Track the last position before jump
  let lastPosition = null;
  let lastEditor = null;
  
  // Track the last active document URI
  let lastActiveDocumentUri = null;
  
  // Function to create a new node
  function createNode(uri, parent) {
    return {
      uri,
      fileName: getDisplayPath(uri),
      children: [],
      parent
    };
  }
  
  // Function to get the display path for a file
  function getDisplayPath(uri) {
    return uri.path.split('/').pop();
  }
  
  // Function to check if a URI exists anywhere in the tree
  function isUriInTree(uri) {
    // Check all root nodes
    for (const rootNode of rootNodes) {
      if (isUriInSubtree(uri, rootNode)) {
        return true;
      }
    }
    return false;
  }
  
  // Helper function to check if a URI exists in a subtree
  function isUriInSubtree(uri, node) {
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
  function printTree(showOutput = false) {
    if (rootNodes.length === 0) {
      outputChannel.appendLine('No jump history yet.');
      return;
    }
    
    outputChannel.clear();
    outputChannel.appendLine('Jump History Tree:');
    
    function printNode(node, indent = '') {
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
  
  // Function to handle when the active editor changes
  function onActiveEditorChanged(editor) {
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
      printTree();
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
        // Create a new node as a child of the current node
        const newNode = createNode(uri, currentNode);
        if (currentNode) {
          currentNode.children.push(newNode);
          currentNode = newNode;
          treeModified = true;
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
      printTree();
    }
    
    // Update last position, editor, and active document URI
    lastPosition = editor.selection.active;
    lastEditor = editor;
    lastActiveDocumentUri = uri;
  }
  
  // Register the showTree command
  vscode.commands.registerCommand('jumpHistory.showTree', () => {
    printTree(true);
  });
  
  // Register the reset command
  vscode.commands.registerCommand('jumpHistory.reset', () => {
    rootNodes = [];
    currentNode = null;
    lastPosition = null;
    lastEditor = null;
    lastActiveDocumentUri = null;
    outputChannel.clear();
    outputChannel.appendLine('Jump history has been reset.');
    outputChannel.show();
  });
  
  // Export the onActiveEditorChanged function for testing
  return {
    onActiveEditorChanged,
    printTree
  };
}

// Run the test
function runTest() {
  fs.appendFileSync('comprehensive-test-output.txt', 'Running test...\n');
  
  // Activate the extension
  const extension = activate(context);
  
  // Create mock editors for fileA, fileB, fileC, and fileD
  const fileA = {
    document: { uri: Uri.file('/workspace/fileA.js') },
    selection: new Selection(
      new Position(0, 0),
      new Position(0, 0)
    )
  };
  
  const fileB = {
    document: { uri: Uri.file('/workspace/fileB.js') },
    selection: new Selection(
      new Position(0, 0),
      new Position(0, 0)
    )
  };
  
  const fileC = {
    document: { uri: Uri.file('/workspace/fileC.js') },
    selection: new Selection(
      new Position(0, 0),
      new Position(0, 0)
    )
  };
  
  const fileD = {
    document: { uri: Uri.file('/workspace/fileD.js') },
    selection: new Selection(
      new Position(0, 0),
      new Position(0, 0)
    )
  };
  
  // Simulate opening fileA
  fs.appendFileSync('comprehensive-test-output.txt', '\nOpening fileA.js...\n');
  extension.onActiveEditorChanged(fileA);
  
  // Show the tree
  fs.appendFileSync('comprehensive-test-output.txt', '\nTree after opening fileA.js:\n');
  extension.printTree(true);
  
  // Simulate a code jump from fileA to fileB
  fs.appendFileSync('comprehensive-test-output.txt', '\nSimulating code jump from fileA.js to fileB.js...\n');
  extension.onActiveEditorChanged(fileB);
  
  // Show the tree
  fs.appendFileSync('comprehensive-test-output.txt', '\nTree after code jump to fileB.js:\n');
  extension.printTree(true);
  
  // Simulate a code jump from fileB to fileC
  fs.appendFileSync('comprehensive-test-output.txt', '\nSimulating code jump from fileB.js to fileC.js...\n');
  extension.onActiveEditorChanged(fileC);
  
  // Show the tree
  fs.appendFileSync('comprehensive-test-output.txt', '\nTree after code jump to fileC.js:\n');
  extension.printTree(true);
  
  // Reset the extension to clear the tree
  fs.appendFileSync('comprehensive-test-output.txt', '\nResetting the extension...\n');
  vscode.commands.jumpHistory.reset();
  
  // Simulate opening fileA again
  fs.appendFileSync('comprehensive-test-output.txt', '\nOpening fileA.js again...\n');
  extension.onActiveEditorChanged(fileA);
  
  // Show the tree
  fs.appendFileSync('comprehensive-test-output.txt', '\nTree after opening fileA.js again:\n');
  extension.printTree(true);
  
  // Simulate a code jump from fileA to fileB
  fs.appendFileSync('comprehensive-test-output.txt', '\nSimulating code jump from fileA.js to fileB.js again...\n');
  extension.onActiveEditorChanged(fileB);
  
  // Show the tree
  fs.appendFileSync('comprehensive-test-output.txt', '\nTree after code jump to fileB.js again:\n');
  extension.printTree(true);
  
  // Simulate a code jump from fileB to fileC
  fs.appendFileSync('comprehensive-test-output.txt', '\nSimulating code jump from fileB.js to fileC.js again...\n');
  extension.onActiveEditorChanged(fileC);
  
  // Show the tree
  fs.appendFileSync('comprehensive-test-output.txt', '\nTree after code jump to fileC.js again:\n');
  extension.printTree(true);
  
  // Now simulate opening fileD directly (not through code jump)
  fs.appendFileSync('comprehensive-test-output.txt', '\nSimulating opening fileD.js directly (not through code jump)...\n');
  
  // Reset the last position and editor to simulate a direct file open
  extension.onActiveEditorChanged = function(editor) {
    if (!editor) {
      return;
    }
    
    const uri = editor.document.uri;
    
    // This is not a definition jump (e.g., manually opening a file)
    // Check if the URI is already in the tree
    if (!isUriInTree(uri)) {
      // If not in the tree, add it as a new root node
      const newRootNode = createNode(uri, null);
      rootNodes.push(newRootNode);
      currentNode = newRootNode;
      printTree();
    }
  };
  
  extension.onActiveEditorChanged(fileD);
  
  // Show the tree
  fs.appendFileSync('comprehensive-test-output.txt', '\nTree after opening fileD.js directly:\n');
  extension.printTree(true);
  
  fs.appendFileSync('comprehensive-test-output.txt', '\nTest completed.\n');
}

// Run the test
try {
  runTest();
} catch (error) {
  fs.appendFileSync('comprehensive-test-output.txt', `\nError: ${error.message}\n${error.stack}\n`);
}
