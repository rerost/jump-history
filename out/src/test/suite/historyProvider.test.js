"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const vscode = require("vscode");
const historyProvider_1 = require("../../historyProvider");
suite('HistoryTreeProvider Test Suite', () => {
    let provider;
    let mockContext;
    let mockOutputChannel;
    setup(() => {
        // Mock ExtensionContext and OutputChannel
        mockContext = {
            globalState: {
                get: (_key) => null,
                update: (_key, _value) => Promise.resolve()
            }
        };
        mockOutputChannel = {
            appendLine: (_value) => { },
            append: (_value) => { },
            clear: () => { },
            show: () => { },
            hide: () => { },
            dispose: () => { }
        };
        provider = new historyProvider_1.HistoryTreeProvider(mockContext, mockOutputChannel);
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
    test('Should update parent-child relationships when jumping between files', () => {
        const fileA = vscode.Uri.file('/path/to/A');
        const fileB = vscode.Uri.file('/path/to/B');
        const fileC = vscode.Uri.file('/path/to/C');
        // Jump from A to B
        provider.addHistoryEntry(fileA, fileB);
        // Jump from B to C
        provider.addHistoryEntry(fileB, fileC);
        const nodeA = provider.historyData.nodes.get(fileA.toString());
        const nodeB = provider.historyData.nodes.get(fileB.toString());
        const nodeC = provider.historyData.nodes.get(fileC.toString());
        assert.ok(nodeA?.children.has(fileB.toString()), 'File A should have File B as child');
        assert.ok(nodeB?.children.has(fileC.toString()), 'File B should have File C as child');
        assert.strictEqual(nodeB?.parent, fileA.toString(), 'File B should have File A as parent');
        assert.strictEqual(nodeC?.parent, fileB.toString(), 'File C should have File B as parent');
    });
});
//# sourceMappingURL=historyProvider.test.js.map