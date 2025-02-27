import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

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

  // Note: We can't directly test for the output channel as there's no API to list all output channels
  // Instead, we'll just check that the extension activates successfully
});
