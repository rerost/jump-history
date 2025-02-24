import * as vscode from 'vscode';

interface SampleTaskDefinition extends vscode.TaskDefinition {
    task: string;
}

export async function activate(context: vscode.ExtensionContext) {
    // Create simple task provider
    const taskProvider: vscode.TaskProvider = {
        provideTasks: async () => {
            const task = new vscode.Task(
                { type: 'sample', task: 'Sample Task' },
                vscode.TaskScope.Workspace,
                'Sample Task',
                'sample',
                new vscode.ShellExecution('echo "OK"')
            );
            return [task];
        },
        resolveTask: () => undefined
    };

    // Register task provider
    console.log('Registering task provider...');
    const registration = vscode.tasks.registerTaskProvider('sample', taskProvider);
    context.subscriptions.push(registration);

    // Wait for task system to be ready
    await vscode.commands.executeCommand('workbench.action.tasks.configureTaskRunner');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Initial wait

    // Force task refresh and verify
    const initialTasks = await vscode.tasks.fetchTasks();
    console.log('Available tasks:', initialTasks.map(t => ({ name: t.name, source: t.source, type: t.definition.type })));

    // Register tree data provider
    const treeDataProvider = new class implements vscode.TreeDataProvider<string> {
        getTreeItem(element: string): vscode.TreeItem {
            return new vscode.TreeItem(element);
        }

        getChildren(): string[] {
            return ['OK'];
        }
    };
    vscode.window.registerTreeDataProvider('sampleExplorer', treeDataProvider);

    // File monitoring example
    const fileOpenListener = vscode.window.onDidChangeActiveTextEditor((editor: vscode.TextEditor | undefined) => {
        if (editor) {
            console.log(`File opened: ${editor.document.fileName}`);
        }
    });
    context.subscriptions.push(fileOpenListener);

    // Verify task registration
    console.log('Verifying task registration...');
    const tasks = await vscode.tasks.fetchTasks();
    console.log('Available tasks:', tasks.map(t => ({ name: t.name, source: t.source, scope: t.scope, type: t.definition.type })));
}                                       