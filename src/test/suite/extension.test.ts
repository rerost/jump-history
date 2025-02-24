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


        // Wait for task provider registration with retries
        console.log('Waiting for task provider registration...');
        let foundTask = false;
        const maxAttempts = 10;
        const retryInterval = 1000;

        for (let attempt = 0; attempt < maxAttempts && !foundTask; attempt++) {
            console.log(`Attempt ${attempt + 1} of ${maxAttempts} to find task...`);
            
            // Force task refresh
            await vscode.commands.executeCommand('workbench.action.tasks.configureTaskRunner');
            
            // Get tasks and verify
            const tasks = await vscode.tasks.fetchTasks();
            console.log('Available tasks:', tasks.map(t => ({
                name: t.name,
                source: t.source,
                type: t.definition.type,
                scope: t.scope,
                definition: t.definition
            })));

            // Check if our task exists
            foundTask = tasks.some(t => {
                const isMatch = t.name === 'Sample Task' && t.definition.type === 'sample';
                console.log(`Task ${t.name} (type: ${t.definition.type}) matches? ${isMatch}`);
                return isMatch;
            });

            if (!foundTask && attempt < maxAttempts - 1) {
                console.log(`Task not found, waiting ${retryInterval}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, retryInterval));
            }
        }

        console.log('Final task search result:', foundTask);

        assert.ok(foundTask, 'Sample Task could not be found after multiple attempts');
    });
});              