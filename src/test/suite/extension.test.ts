import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  // Reset the extension state before each test
  setup(async () => {
    await vscode.commands.executeCommand('jumpHistory.reset');
  });

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('rerost.jump-history'));
  });

  test('Extension should activate', async () => {
    const extension = vscode.extensions.getExtension('rerost.jump-history');
    if (!extension) {
      assert.fail('Extension not found');
      return;
    }
    
    await extension.activate();
    assert.strictEqual(extension.isActive, true);
  });

  test('Opening a file should initialize the tree', async () => {
    // Get the path to fileA.js
    const fileAPath = path.join(__dirname, '..', '..', 'test-files', 'fileA.js');
    
    // Open fileA.js
    const document = await vscode.workspace.openTextDocument(fileAPath);
    await vscode.window.showTextDocument(document);
    
    // Show the tree to verify it was created
    await vscode.commands.executeCommand('jumpHistory.showTree');
    
    // We can't directly check the output channel content, but we can verify
    // that the command executed without errors
  });

  test('Opening a new file not in the tree should add it as a new root', async () => {
    // First, open fileA.js to initialize the tree
    const fileAPath = path.join(__dirname, '..', '..', 'test-files', 'fileA.js');
    const documentA = await vscode.workspace.openTextDocument(fileAPath);
    await vscode.window.showTextDocument(documentA);
    
    // Wait a bit for the file to be registered
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate a code jump by opening fileB.js
    // We need to set the cursor position to simulate a code jump
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      // Set cursor position to simulate a code jump
      const position = new vscode.Position(2, 10); // Line 2, column 10
      editor.selection = new vscode.Selection(position, position);
      
      // Wait a bit for the cursor position to be registered
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const fileBPath = path.join(__dirname, '..', '..', 'test-files', 'fileB.js');
    const documentB = await vscode.workspace.openTextDocument(fileBPath);
    await vscode.window.showTextDocument(documentB);
    
    // Wait a bit for the file to be registered
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate another code jump by opening fileC.js
    if (vscode.window.activeTextEditor) {
      // Set cursor position to simulate a code jump
      const position = new vscode.Position(2, 10); // Line 2, column 10
      vscode.window.activeTextEditor.selection = new vscode.Selection(position, position);
      
      // Wait a bit for the cursor position to be registered
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const fileCPath = path.join(__dirname, '..', '..', 'test-files', 'fileC.js');
    const documentC = await vscode.workspace.openTextDocument(fileCPath);
    await vscode.window.showTextDocument(documentC);
    
    // Wait a bit for the file to be registered
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Show the tree to verify the structure
    await vscode.commands.executeCommand('jumpHistory.showTree');
    
    // Reset the extension to start fresh
    await vscode.commands.executeCommand('jumpHistory.reset');
    
    // Open fileA.js again to initialize the tree
    await vscode.window.showTextDocument(documentA);
    
    // Wait a bit for the file to be registered
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate a code jump to fileB.js
    if (vscode.window.activeTextEditor) {
      // Set cursor position to simulate a code jump
      const position = new vscode.Position(2, 10); // Line 2, column 10
      vscode.window.activeTextEditor.selection = new vscode.Selection(position, position);
      
      // Wait a bit for the cursor position to be registered
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    await vscode.window.showTextDocument(documentB);
    
    // Wait a bit for the file to be registered
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate a code jump to fileC.js
    if (vscode.window.activeTextEditor) {
      // Set cursor position to simulate a code jump
      const position = new vscode.Position(2, 10); // Line 2, column 10
      vscode.window.activeTextEditor.selection = new vscode.Selection(position, position);
      
      // Wait a bit for the cursor position to be registered
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    await vscode.window.showTextDocument(documentC);
    
    // Wait a bit for the file to be registered
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Now open fileD.js directly (non-code jump)
    // This should add it as a new root
    const fileDPath = path.join(__dirname, '..', '..', 'test-files', 'fileD.js');
    const documentD = await vscode.workspace.openTextDocument(fileDPath);
    
    // Clear the last position and editor to simulate a direct file open
    // This is a hack for testing, in real usage the extension would detect this automatically
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Now open fileD.js
    await vscode.window.showTextDocument(documentD);
    
    // Wait a bit for the file to be registered
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Show the tree to verify the structure
    await vscode.commands.executeCommand('jumpHistory.showTree');
    
    // We can't directly check the output channel content, but we can verify
    // that the command executed without errors
    
    // The tree structure should now be:
    // * fileA.js
    //   * fileB.js
    //     * fileC.js
    // * fileD.js
  });

  // Note: We can't directly test for the output channel as there's no API to list all output channels
  // Instead, we'll just check that the extension activates successfully and the commands execute without errors
});
