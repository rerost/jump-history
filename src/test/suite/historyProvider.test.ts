import * as assert from 'assert';
import * as vscode from 'vscode';
import { HistoryTreeProvider } from '../../historyProvider';
import { HistoryNode, HistoryData } from '../../types';

suite('HistoryTreeProvider Test Suite', () => {
    let provider: HistoryTreeProvider;
    let mockContext: vscode.ExtensionContext;
    let mockOutputChannel: vscode.OutputChannel;

    setup(() => {
        // Mock ExtensionContext and OutputChannel
        mockContext = {
            globalState: {
                get: (_key: string) => null,
                update: (_key: string, _value: any) => Promise.resolve()
            }
        } as any;

        mockOutputChannel = {
            appendLine: (_value: string) => {},
            append: (_value: string) => {},
            clear: () => {},
            show: () => {},
            hide: () => {},
            dispose: () => {}
        } as vscode.OutputChannel;

        provider = new HistoryTreeProvider(mockContext, mockOutputChannel);
    });

    test('Should handle initial file open', () => {
        const userFile = vscode.Uri.file('/workspace/src/user.ts');
        
        provider.addHistoryEntry(undefined, userFile);

        const userNode = provider.historyData.nodes.get(userFile.toString());
        
        assert.ok(userNode, 'User file should be added to nodes');
        assert.strictEqual(provider.historyData.root, userFile.toString(), 'User file should be root');
        assert.strictEqual(userNode?.parent, null, 'User file should have no parent');
        assert.strictEqual(userNode?.children.size, 0, 'User file should have no children');
    });

    test('Should handle navigation between related files', () => {
        const userFile = vscode.Uri.file('/workspace/src/user.ts');
        const settingsFile = vscode.Uri.file('/workspace/src/settings.ts');
        const profileFile = vscode.Uri.file('/workspace/src/profile.ts');
        
        // Initial file open
        provider.addHistoryEntry(undefined, userFile);
        // Navigate to settings
        provider.addHistoryEntry(userFile, settingsFile);
        // Navigate to profile
        provider.addHistoryEntry(settingsFile, profileFile);

        const userNode = provider.historyData.nodes.get(userFile.toString());
        const settingsNode = provider.historyData.nodes.get(settingsFile.toString());
        const profileNode = provider.historyData.nodes.get(profileFile.toString());
        
        assert.ok(userNode, 'User file should be added to nodes');
        assert.ok(settingsNode, 'Settings file should be added to nodes');
        assert.ok(profileNode, 'Profile file should be added to nodes');
        assert.strictEqual(userNode?.children.has(settingsFile.toString()), true, 'User file should have Settings as child');
        assert.strictEqual(settingsNode?.parent, userFile.toString(), 'Settings file should have User as parent');
        assert.strictEqual(profileNode?.parent, settingsFile.toString(), 'Profile file should have Settings as parent');
    });

    test('Should create parent-child relationship on first jump', () => {
        const fileA = vscode.Uri.file('/path/to/A');
        const fileB = vscode.Uri.file('/path/to/B');

        provider.addHistoryEntry(fileA, fileB);

        const nodeA = provider.historyData.nodes.get(fileA.toString());
        const nodeB = provider.historyData.nodes.get(fileB.toString());

        assert.ok(nodeA?.children.has(fileB.toString()), 'File A should have File B as child');
        assert.strictEqual(nodeB?.parent, fileA.toString(), 'File B should have File A as parent');
    });

    test('Should maintain tree structure on multiple jumps from same file', () => {
        const fileA = vscode.Uri.file('/path/to/A');
        const fileB = vscode.Uri.file('/path/to/B');
        const fileC = vscode.Uri.file('/path/to/C');

        // Jump from A to B
        provider.addHistoryEntry(fileA, fileB);
        // Return to A (simulate by making A current)
        provider['currentActiveFile'] = fileA.toString();
        // Jump from A to C
        provider.addHistoryEntry(fileA, fileC);

        const nodeA = provider.historyData.nodes.get(fileA.toString());
        const nodeB = provider.historyData.nodes.get(fileB.toString());
        const nodeC = provider.historyData.nodes.get(fileC.toString());

        assert.ok(nodeA?.children.has(fileB.toString()), 'File A should have File B as child');
        assert.ok(nodeA?.children.has(fileC.toString()), 'File A should have File C as child');
        assert.strictEqual(nodeB?.parent, fileA.toString(), 'File B should have File A as parent');
        assert.strictEqual(nodeC?.parent, fileA.toString(), 'File C should have File A as parent');
    });

    test('Should verify navigation logs with books.ts', () => {
        const fs = require('fs');
        const path = require('path');
        const logDir = path.join(__dirname, '../../../logs');
        const logFile = path.join(logDir, 'jump-history.log');

        // Ensure log directory exists
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        const userFile = vscode.Uri.file('/workspace/src/user.ts');
        const settingsFile = vscode.Uri.file('/workspace/src/settings.ts');
        const profileFile = vscode.Uri.file('/workspace/src/profile.ts');
        const booksFile = vscode.Uri.file('/workspace/src/books.ts');

        // Navigate through files
        provider.addHistoryEntry(undefined, userFile);
        provider.addHistoryEntry(userFile, settingsFile);
        provider.addHistoryEntry(settingsFile, profileFile);
        provider.addHistoryEntry(profileFile, booksFile);

        // Verify tree structure
        const userNode = provider.historyData.nodes.get(userFile.toString());
        const settingsNode = provider.historyData.nodes.get(settingsFile.toString());
        const profileNode = provider.historyData.nodes.get(profileFile.toString());
        const booksNode = provider.historyData.nodes.get(booksFile.toString());

        assert.ok(userNode?.children.has(settingsFile.toString()), 'User file should have Settings as child');
        assert.ok(settingsNode?.children.has(profileFile.toString()), 'Settings file should have Profile as child');
        assert.ok(profileNode?.children.has(booksFile.toString()), 'Profile file should have Books as child');

        // Verify logs
        const logContent = fs.readFileSync(logFile, 'utf8');
        
        // Check initial file open
        assert.ok(logContent.includes('Event: Initial file open user.ts'), 'Log should show initial file open');
        assert.ok(logContent.includes('• user.ts'), 'Log should contain user.ts');
        
        // Check navigation events
        assert.ok(logContent.includes('Event: Navigation from user.ts to settings.ts'), 'Log should show navigation to settings.ts');
        assert.ok(logContent.includes('  • settings.ts'), 'Log should contain settings.ts with correct indentation');
        
        assert.ok(logContent.includes('Event: Navigation from settings.ts to profile.ts'), 'Log should show navigation to profile.ts');
        assert.ok(logContent.includes('    • profile.ts'), 'Log should contain profile.ts with correct indentation');
        
        assert.ok(logContent.includes('Event: Navigation from profile.ts to books.ts'), 'Log should show navigation to books.ts');
        assert.ok(logContent.includes('      • books.ts'), 'Log should contain books.ts with correct indentation');
    });
});
