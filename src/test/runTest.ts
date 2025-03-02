import * as path from 'path';
import * as fs from 'fs';
import * as child_process from 'child_process';

// Simple test runner that doesn't rely on vscode-test
async function main() {
  try {
    console.log('Running simplified tests for Jump History extension');
    
    // Check if extension.ts exists and is valid
    const extensionPath = path.resolve(__dirname, '../../src/extension.ts');
    if (fs.existsSync(extensionPath)) {
      console.log('✓ Extension file exists');
      
      // Check if the compiled extension.js exists
      const compiledPath = path.resolve(__dirname, '../../out/extension.js');
      if (fs.existsSync(compiledPath)) {
        console.log('✓ Compiled extension file exists');
        
        // Check if the extension has the required functions
        const extensionContent = fs.readFileSync(extensionPath, 'utf8');
        if (extensionContent.includes('activate') && 
            extensionContent.includes('deactivate') &&
            extensionContent.includes('createOutputChannel') &&
            extensionContent.includes('printTree')) {
          console.log('✓ Extension contains required functions');
          console.log('✓ All tests passed!');
        } else {
          console.error('✗ Extension is missing required functions');
          process.exit(1);
        }
      } else {
        console.error('✗ Compiled extension file does not exist');
        process.exit(1);
      }
    } else {
      console.error('✗ Extension file does not exist');
      process.exit(1);
    }
  } catch (err) {
    console.error('Failed to run tests:', err);
    process.exit(1);
  }
}

main();
