const fs = require('fs');

// Write to a file
fs.writeFileSync('display-test-output.txt', 'Display Test Output\n');

// Create a simple implementation of the tree structure
class JumpNode {
  constructor(uri, fileName, parent = null) {
    this.uri = uri;
    this.fileName = fileName;
    this.children = [];
    this.parent = parent;
  }
}

// Create a mock output channel
class OutputChannel {
  constructor(name) {
    this.name = name;
    this.content = '';
    this.visible = false;
  }
  
  appendLine(line) {
    this.content += line + '\n';
    fs.appendFileSync('display-test-output.txt', `[Output Channel] ${line}\n`);
  }
  
  clear() {
    this.content = '';
    fs.appendFileSync('display-test-output.txt', '[Output Channel] Cleared\n');
  }
  
  show() {
    this.visible = true;
    fs.appendFileSync('display-test-output.txt', '[Output Channel] Shown\n');
  }
}

// Create a tree with the structure A -> B -> C
const fileA = new JumpNode('/workspace/fileA.js', 'fileA.js');
const fileB = new JumpNode('/workspace/fileB.js', 'fileB.js', fileA);
const fileC = new JumpNode('/workspace/fileC.js', 'fileC.js', fileB);

// Add B as a child of A
fileA.children.push(fileB);

// Add C as a child of B
fileB.children.push(fileC);

// Create an array of root nodes
const rootNodes = [fileA];

// Create an output channel
const outputChannel = new OutputChannel('Jump History');

// Create a function to print the tree
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

// Test the printTree function
fs.appendFileSync('display-test-output.txt', '\nTesting printTree function...\n');

// Print the tree
fs.appendFileSync('display-test-output.txt', '\nPrinting tree for the first time:\n');
printTree();

// Add fileD as a new root node
const fileD = new JumpNode('/workspace/fileD.js', 'fileD.js');
rootNodes.push(fileD);

// Print the tree again
fs.appendFileSync('display-test-output.txt', '\nPrinting tree after adding fileD.js:\n');
printTree();

// Add fileE as a child of fileD
const fileE = new JumpNode('/workspace/fileE.js', 'fileE.js', fileD);
fileD.children.push(fileE);

// Print the tree again
fs.appendFileSync('display-test-output.txt', '\nPrinting tree after adding fileE.js as a child of fileD.js:\n');
printTree();

// Show the tree
fs.appendFileSync('display-test-output.txt', '\nShowing the tree:\n');
printTree(true);

fs.appendFileSync('display-test-output.txt', '\nTest completed.\n');
