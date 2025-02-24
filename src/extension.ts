import * as vscode from 'vscode';

interface SampleTaskDefinition extends vscode.TaskDefinition {
    task: string;
}

export async function activate(context: vscode.ExtensionContext) {
    // Create task provider with proper type handling
    const taskProvider: vscode.TaskProvider = {
        provideTasks: async () => {
            const definition: SampleTaskDefinition = {
                type: 'sample',
                task: 'Sample Task'
            };
            const task = new vscode.Task(
                definition,
                vscode.TaskScope.Global, // Use Global scope for better visibility
                'Sample Task',
                'sample',
                new vscode.ShellExecution('echo "OK"')
            );
            task.definition = definition; // Ensure definition is properly set
            return [task];
        },
        resolveTask: (task: vscode.Task) => {
            const definition = task.definition as SampleTaskDefinition;
            if (definition.type === 'sample') {
                const resolvedTask = new vscode.Task(
                    definition,
                    vscode.TaskScope.Global,
                    definition.task,
                    'sample',
                    new vscode.ShellExecution(`echo "${definition.task}"`)
                );
                return resolvedTask;
            }
            return undefined;
        }
    };

    // Register task provider and wait for registration
    console.log('Registering task provider...');
    const registration = vscode.tasks.registerTaskProvider('sample', taskProvider);
    context.subscriptions.push(registration);

    // Wait for task system to be ready and verify
    await vscode.commands.executeCommand('workbench.action.tasks.configureTaskRunner');
    const initialTasks = await vscode.tasks.fetchTasks();
    console.log('Initial tasks:', initialTasks.map((t: vscode.Task) => ({ 
        name: t.name, 
        source: t.source, 
        type: t.definition.type,
        scope: t.scope,
        definition: t.definition
    })));

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
    const finalTasks = await vscode.tasks.fetchTasks();
    console.log('Available tasks:', finalTasks.map((t: vscode.Task) => ({ name: t.name, source: t.source, scope: t.scope, type: t.definition.type })));
}                                                   