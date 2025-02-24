import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
    test('Extension should be present', function(done) {
        const extension = vscode.extensions.getExtension('rerost.jump-history');
        assert.ok(extension, 'jump-history extension should be installed');
        done();
    });

    test('Tasks test', function(done) {
        vscode.tasks.fetchTasks().then((tasks: vscode.Task[]) => {
            console.log('Available tasks:', tasks.map(t => ({
                name: t.name,
                source: t.source,
                definition: t.definition
            })));
            
            const hasJumpHistoryTask = tasks.some(task => 
                task.name === 'Jump History' && 
                task.source === 'jump-history'
            );
            assert.ok(hasJumpHistoryTask, 'Jump History task should be available');
            done();
        });
    });
}); 