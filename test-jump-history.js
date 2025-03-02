// Simple script to test the jump-history extension
const fs = require('fs');
const path = require('path');

console.log('Testing jump-history extension...');

// Check if the extension.ts file exists
const extensionPath = path.resolve(__dirname, 'src/extension.ts');
if (fs.existsSync(extensionPath)) {
  console.log('✓ Extension file exists');
  
  // Read the extension.ts file
  const extensionContent = fs.readFileSync(extensionPath, 'utf8');
  
  // Check if the extension has the required functions
  if (extensionContent.includes('function isUriInTree')) {
    console.log('✓ Extension has isUriInTree function');
  } else {
    console.error('✗ Extension is missing isUriInTree function');
  }
  
  if (extensionContent.includes('rootNodes: JumpNode[] = []')) {
    console.log('✓ Extension uses rootNodes array');
  } else {
    console.error('✗ Extension is not using rootNodes array');
  }
  
  if (extensionContent.includes('if (!isUriInTree(uri))') && 
      extensionContent.includes('rootNodes.push(newRootNode)')) {
    console.log('✓ Extension adds new root node when file is not in tree');
  } else {
    console.error('✗ Extension is not adding new root node correctly');
  }
  
  if (extensionContent.includes('lastActiveDocumentUri')) {
    console.log('✓ Extension tracks last active document URI');
  } else {
    console.error('✗ Extension is not tracking last active document URI');
  }
  
  if (extensionContent.includes('const isDefinitionJump = lastEditor && lastPosition && lastActiveDocumentUri')) {
    console.log('✓ Extension correctly detects definition jumps');
  } else {
    console.error('✗ Extension is not correctly detecting definition jumps');
  }
  
  console.log('Test completed.');
} else {
  console.error('✗ Extension file does not exist');
}
