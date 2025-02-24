import * as assert from 'assert';
import * as vscode from 'vscode';
import { suite, test } from 'mocha';

suite('Extension Test Suite', () => {
    test('Sample test', async () => {
        // 基本的なテスト
        assert.strictEqual(-1, [1, 2, 3].indexOf(5));
        assert.strictEqual(-1, [1, 2, 3].indexOf(0));
    });

    test('Tasks test', async () => {
        const tasks = await vscode.tasks.fetchTasks();
        assert.ok(tasks.some((task: vscode.Task) => task.name === 'Sample Task'));
    });
});  