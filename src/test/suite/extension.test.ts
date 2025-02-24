import * as assert from 'assert';
import * as vscode from 'vscode';
import { suite, test } from 'mocha';

suite('Extension Test Suite', () => {
    test('Tasks test', async function() {
        this.timeout(30000);


        console.log('Starting Tasks test...');
        console.log('Available extensions:', vscode.extensions.all.map(e => e.id));


        // Wait for extension to activate
        const ext = vscode.extensions.getExtension('rerost.jump-history');
        if (!ext) {
            throw new Error('Extension not found. Available extensions: ' + vscode.extensions.all.map(e => e.id).join(', '));
        }
        if (!ext.isActive) {
            console.log('Activating extension...');
            await ext.activate();
        }
        console.log('Extension activated');


        // Wait for task provider registration
        console.log('Waiting for task provider registration...');
        await new Promise(resolve => setTimeout(resolve, 5000)); // Longer initial wait

        // Force task refresh
        await vscode.commands.executeCommand('workbench.action.tasks.configureTaskRunner');

        // Get tasks and verify
        const tasks = await vscode.tasks.fetchTasks();
        console.log('Available tasks:', tasks.map(t => ({ name: t.name, source: t.source, type: t.definition.type })));
        
        // Check if our task exists
        const foundTask = tasks.some(t => t.name === 'Sample Task' && t.definition.type === 'sample');
        console.log('Task found:', foundTask);

        assert.ok(foundTask, 'Sample Task could not be found after multiple attempts');
    });
});            