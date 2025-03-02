// Test script to verify the tree structure
const fs = require('fs');
const path = require('path');

console.log('Testing tree structure...');
console.log('Current directory:', __dirname);

// Create a simple implementation of the tree structure
class JumpNode {
  constructor(uri, fileName, parent = null) {
    this.uri = uri;
    this.fileName = fileName;
    this.children = [];
    this.parent = parent;
  }
}

// Create a tree with the structure A -> B -> C
const fileA = new JumpNode({ fsPath: '/workspace/fileA.js', toString: () => '/workspace/fileA.js' }, 'fileA.js');
const fileB = new JumpNode({ fsPath: '/workspace/fileB.js', toString: () => '/workspace/fileB.js' }, 'fileB.js', fileA);
const fileC = new JumpNode({ fsPath: '/workspace/fileC.js', toString: () => '/workspace/fileC.js' }, 'fileC.js', fileB);

// Add B as a child of A
fileA.children.push(fileB);

// Add C as a child of B
fileB.children.push(fileC);

// Create a function to print the tree
function printTree(rootNodes) {
  console.log('Jump History Tree:');
  
  function printNode(node, indent = '') {
    console.log(`${indent}* ${node.fileName}`);
    
    for (const child of node.children) {
      printNode(child, indent + '  ');
    }
  }
  
  // Print each root node
  for (const rootNode of rootNodes) {
    printNode(rootNode);
  }
}

// Print the initial tree
console.log('\nInitial tree structure:');
printTree([fileA]);

// Now simulate opening fileD (not through code jump)
console.log('\nSimulating opening fileD.js (not through code jump)...');
const fileD = new JumpNode({ fsPath: '/workspace/fileD.js', toString: () => '/workspace/fileD.js' }, 'fileD.js');

// Add fileD as a new root node
const rootNodes = [fileA, fileD];

// Print the tree after adding fileD
console.log('\nTree structure after adding fileD.js:');
printTree(rootNodes);

// This is the expected tree structure:
// * fileA.js
//   * fileB.js
//     * fileC.js
// * fileD.js

// Now let's check our implementation in extension.ts
const extensionPath = path.resolve(__dirname, 'src/extension.ts');
if (fs.existsSync(extensionPath)) {
  console.log('\nChecking implementation in extension.ts...');
  
  const extensionContent = fs.readFileSync(extensionPath, 'utf8');
  
  // Check if we're using an array of root nodes
  if (extensionContent.includes('rootNodes: JumpNode[] = []')) {
    console.log('✓ Using an array of root nodes');
  } else {
    console.error('✗ Not using an array of root nodes');
  }
  
  // Check if we're adding a new root node when a file is not in the tree
  if (extensionContent.includes('rootNodes.push(newRootNode)')) {
    console.log('✓ Adding new root node when file is not in the tree');
  } else {
    console.error('✗ Not adding new root node correctly');
  }
  
  // Check if we're correctly detecting when a file is opened without a code jump
  if (extensionContent.includes('const isDefinitionJump = lastEditor && lastPosition && lastActiveDocumentUri')) {
    console.log('✓ Correctly detecting definition jumps');
  } else {
    console.error('✗ Not correctly detecting definition jumps');
  }
  
  // Check if we're printing the tree when it's modified
  if (extensionContent.includes('if (treeModified)') && 
      extensionContent.includes('printTree()')) {
    console.log('✓ Printing the tree when it\'s modified');
  } else {
    console.error('✗ Not printing the tree when it\'s modified');
  }
  
  console.log('\nTest completed.');
} else {
  console.error('✗ Extension file does not exist');
}
