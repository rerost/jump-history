const fs = require('fs');

// Write to a file
fs.writeFileSync('simple-tree-test-output.txt', 'Simple Tree Test Output\n');

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
const fileA = new JumpNode('/workspace/fileA.js', 'fileA.js');
const fileB = new JumpNode('/workspace/fileB.js', 'fileB.js', fileA);
const fileC = new JumpNode('/workspace/fileC.js', 'fileC.js', fileB);

// Add B as a child of A
fileA.children.push(fileB);

// Add C as a child of B
fileB.children.push(fileC);

// Create a function to print the tree
function printTree(rootNodes) {
  let output = 'Jump History Tree:\n';
  
  function printNode(node, indent = '') {
    output += `${indent}* ${node.fileName}\n`;
    
    for (const child of node.children) {
      printNode(child, indent + '  ');
    }
  }
  
  // Print each root node
  for (const rootNode of rootNodes) {
    printNode(rootNode);
  }
  
  return output;
}

// Print the initial tree
fs.appendFileSync('simple-tree-test-output.txt', '\nInitial tree structure:\n');
fs.appendFileSync('simple-tree-test-output.txt', printTree([fileA]));

// Now simulate opening fileD (not through code jump)
fs.appendFileSync('simple-tree-test-output.txt', '\nSimulating opening fileD.js (not through code jump)...\n');
const fileD = new JumpNode('/workspace/fileD.js', 'fileD.js');

// Add fileD as a new root node
const rootNodes = [fileA, fileD];

// Print the tree after adding fileD
fs.appendFileSync('simple-tree-test-output.txt', '\nTree structure after adding fileD.js:\n');
fs.appendFileSync('simple-tree-test-output.txt', printTree(rootNodes));

// This is the expected tree structure:
// * fileA.js
//   * fileB.js
//     * fileC.js
// * fileD.js

fs.appendFileSync('simple-tree-test-output.txt', '\nExpected tree structure:\n');
fs.appendFileSync('simple-tree-test-output.txt', '* fileA.js\n');
fs.appendFileSync('simple-tree-test-output.txt', '  * fileB.js\n');
fs.appendFileSync('simple-tree-test-output.txt', '    * fileC.js\n');
fs.appendFileSync('simple-tree-test-output.txt', '* fileD.js\n');

// Now let's check our implementation in extension.ts
const path = require('path');
const extensionPath = path.resolve(__dirname, 'src/extension.ts');
if (fs.existsSync(extensionPath)) {
  fs.appendFileSync('simple-tree-test-output.txt', '\nChecking implementation in extension.ts...\n');
  
  const extensionContent = fs.readFileSync(extensionPath, 'utf8');
  
  // Check if we're using an array of root nodes
  if (extensionContent.includes('rootNodes: JumpNode[] = []') || 
      extensionContent.includes('let rootNodes: JumpNode[] = []') ||
      extensionContent.includes('let rootNodes = []')) {
    fs.appendFileSync('simple-tree-test-output.txt', '✓ Using an array of root nodes\n');
  } else {
    fs.appendFileSync('simple-tree-test-output.txt', '✗ Not using an array of root nodes\n');
  }
  
  // Check if we're adding a new root node when a file is not in the tree
  if (extensionContent.includes('rootNodes.push(newRootNode)')) {
    fs.appendFileSync('simple-tree-test-output.txt', '✓ Adding new root node when file is not in the tree\n');
  } else {
    fs.appendFileSync('simple-tree-test-output.txt', '✗ Not adding new root node correctly\n');
  }
  
  // Check if we're correctly detecting when a file is opened without a code jump
  if (extensionContent.includes('const isDefinitionJump = lastEditor && lastPosition && lastActiveDocumentUri')) {
    fs.appendFileSync('simple-tree-test-output.txt', '✓ Correctly detecting definition jumps\n');
  } else {
    fs.appendFileSync('simple-tree-test-output.txt', '✗ Not correctly detecting definition jumps\n');
  }
  
  // Check if we're printing the tree when it's modified
  if (extensionContent.includes('if (treeModified)') && 
      extensionContent.includes('printTree()')) {
    fs.appendFileSync('simple-tree-test-output.txt', '✓ Printing the tree when it\'s modified\n');
  } else {
    fs.appendFileSync('simple-tree-test-output.txt', '✗ Not printing the tree when it\'s modified\n');
  }
  
  fs.appendFileSync('simple-tree-test-output.txt', '\nTest completed.\n');
} else {
  fs.appendFileSync('simple-tree-test-output.txt', '✗ Extension file does not exist\n');
}
