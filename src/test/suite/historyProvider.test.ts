import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
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

        let outputLog = '';
        mockOutputChannel = {
            name: 'Jump History',
            appendLine: (value: string) => { outputLog += value + '\n'; },
            append: (value: string) => { outputLog += value; },
            replace: (value: string) => { outputLog = value; },
            clear: () => { outputLog = ''; },
            show: () => {},
            hide: () => {},
            dispose: () => {}
        } as vscode.OutputChannel;

        // Add getter to access log content in tests
        Object.defineProperty(mockOutputChannel, 'content', {
            get: () => outputLog
        });

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

    test('Should handle navigation between related files and verify logs', () => {
        const fs = require('fs');
        const path = require('path');
        const logDir = path.join(__dirname, '../../../logs');
        const logFile = path.join(logDir, 'jump-history.log');

        // Clear existing log file
        if (fs.existsSync(logDir)) {
            if (fs.existsSync(logFile)) {
                fs.unlinkSync(logFile);
            }
        } else {
            fs.mkdirSync(logDir, { recursive: true });
        }

        const fixturesPath = path.join(__dirname, '../../fixtures');
        const userFile = vscode.Uri.file(path.join(fixturesPath, 'user.ts'));
        const settingsFile = vscode.Uri.file(path.join(fixturesPath, 'settings.ts'));
        const profileFile = vscode.Uri.file(path.join(fixturesPath, 'profile.ts'));
        
        // Initial file open
        provider.addHistoryEntry(undefined, userFile);
        // Navigate to settings
        provider.addHistoryEntry(userFile, settingsFile);
        // Navigate to profile
        provider.addHistoryEntry(settingsFile, profileFile);

        const userNode = provider.historyData.nodes.get(userFile.toString());
        const settingsNode = provider.historyData.nodes.get(settingsFile.toString());
        const profileNode = provider.historyData.nodes.get(profileFile.toString());
        
        // Verify tree structure
        assert.ok(userNode, 'User file should be added to nodes');
        assert.ok(settingsNode, 'Settings file should be added to nodes');
        assert.ok(profileNode, 'Profile file should be added to nodes');
        assert.strictEqual(userNode?.children.has(settingsFile.toString()), true, 'User file should have Settings as child');
        assert.strictEqual(settingsNode?.parent, userFile.toString(), 'Settings file should have User as parent');
        assert.strictEqual(profileNode?.parent, settingsFile.toString(), 'Profile file should have Settings as parent');

        // Get output channel content
        const outputContent = (mockOutputChannel as any).content;
        console.log('Output channel content:', outputContent);

        // Verify initial file open
        assert.ok(outputContent.includes('Event: Initial file open user.ts'), 'Log should show initial file open');
        assert.ok(outputContent.includes('• user.ts'), 'Log should contain user.ts');

        // Verify navigation events
        assert.ok(outputContent.includes('Event: Navigation from user.ts to settings.ts'), 'Log should show navigation to settings.ts');
        assert.ok(outputContent.includes('  • settings.ts'), 'Log should contain settings.ts with correct indentation');

        assert.ok(outputContent.includes('Event: Navigation from settings.ts to profile.ts'), 'Log should show navigation to profile.ts');
        assert.ok(outputContent.includes('    • profile.ts'), 'Log should contain profile.ts with correct indentation');
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

    test('Should verify navigation logs', () => {
        const fixturesPath = path.join(__dirname, '../../fixtures');
        const userFile = vscode.Uri.file(path.join(fixturesPath, 'user.ts'));
        const settingsFile = vscode.Uri.file(path.join(fixturesPath, 'settings.ts'));
        const profileFile = vscode.Uri.file(path.join(fixturesPath, 'profile.ts'));

        // Navigate through files
        provider.addHistoryEntry(undefined, userFile);
        provider.addHistoryEntry(userFile, settingsFile);
        provider.addHistoryEntry(settingsFile, profileFile);

        // Get output channel content
        const outputContent = (mockOutputChannel as any).content;
        console.log('\nActual Output Channel Content:');
        console.log('----------------------------------------');
        console.log(outputContent);
        console.log('----------------------------------------');

        // Verify initial file open
        assert.ok(outputContent.includes('Event: Initial file open user.ts'), 'Log should show initial file open');
        assert.ok(outputContent.includes('• user.ts'), 'Log should contain user.ts');

        // Verify navigation events
        assert.ok(outputContent.includes('Event: Navigation from user.ts to settings.ts'), 'Log should show navigation to settings.ts');
        assert.ok(outputContent.includes('  • settings.ts'), 'Log should contain settings.ts with correct indentation');

        assert.ok(outputContent.includes('Event: Navigation from settings.ts to profile.ts'), 'Log should show navigation to profile.ts');
        assert.ok(outputContent.includes('    • profile.ts'), 'Log should contain profile.ts with correct indentation');
    });
});
