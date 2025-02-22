import * as assert from 'assert';
import * as vscode from 'vscode';
import { HistoryTreeProvider } from '../../historyProvider';
import { HistoryNode, HistoryData } from '../../types';

suite('HistoryTreeProvider Test Suite', () => {
    let provider: HistoryTreeProvider;
    let mockContext: vscode.ExtensionContext;

    setup(() => {
        // Mock ExtensionContext
        mockContext = {
            globalState: {
                get: (_key: string) => null,
                update: (_key: string, _value: any) => Promise.resolve()
            }
        } as any;

        provider = new HistoryTreeProvider(mockContext);
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
