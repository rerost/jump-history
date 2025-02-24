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
        await new Promise(resolve => setTimeout(resolve, 2000)); // Initial wait

        // Wait for task provider registration with retries
        let foundTask = false;
        const maxAttempts = 20; // More attempts with shorter interval
        const retryInterval = 1000; // Shorter interval

        console.log('Attempting to verify task...');
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            console.log(`Attempt ${attempt + 1} of ${maxAttempts}`);
            const tasks = await vscode.tasks.fetchTasks();
            console.log('Available tasks:', tasks.map(t => ({ name: t.name, source: t.source, type: t.definition.type })));
            
            if (tasks.some(t => t.name === 'Sample Task' && t.definition.type === 'sample')) {
                foundTask = true;
                console.log('Task found!');
                break;
            }

            if (attempt < maxAttempts - 1) {
                console.log(`Task not found, waiting ${retryInterval}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, retryInterval));
            }
        }

        assert.ok(foundTask, 'Sample Task could not be found after multiple attempts');
    });
});          