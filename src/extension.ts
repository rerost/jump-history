import * as vscode from 'vscode';

interface SampleTaskDefinition extends vscode.TaskDefinition {
    task: string;
}

export async function activate(context: vscode.ExtensionContext) {
    // Create task provider with proper type handling
    const taskProvider: vscode.TaskProvider = {
        provideTasks: async () => {
            try {
                const definition: SampleTaskDefinition = {
                    type: 'sample',
                    task: 'Sample Task'
                };
                const task = new vscode.Task(
                    definition,
                    vscode.TaskScope.Workspace,  // Changed to Workspace scope
                    'Sample Task',
                    'sample',
                    new vscode.ShellExecution('echo "OK"')
                );
                console.log('Created task:', { 
                    name: task.name, 
                    source: task.source, 
                    scope: task.scope, 
                    definition: task.definition 
                });
                return [task];
            } catch (error) {
                console.error('Error creating task:', error);
                return [];
            }
        },
        resolveTask: (task: vscode.Task) => {
            try {
                const definition = task.definition as SampleTaskDefinition;
                if (definition.type === 'sample') {
                    const resolvedTask = new vscode.Task(
                        definition,
                        vscode.TaskScope.Workspace,
                        definition.task,
                        'sample',
                        new vscode.ShellExecution(`echo "${definition.task}"`)
                    );
                    return resolvedTask;
                }
            } catch (error) {
                console.error('Error resolving task:', error);
            }
            return undefined;
        }
    };

    // Register task provider and wait for registration
    console.log('Registering task provider...');
    try {
        const registration = vscode.tasks.registerTaskProvider('sample', taskProvider);
        context.subscriptions.push(registration);
        console.log('Task provider registered successfully');

        // Wait for task system to be ready
        await vscode.commands.executeCommand('workbench.action.tasks.configureTaskRunner');
        
        // Force task refresh and verify
        const tasks = await vscode.tasks.fetchTasks();
        console.log('Available tasks after registration:', tasks.map(t => ({ 
            name: t.name, 
            source: t.source, 
            type: t.definition.type,
            scope: t.scope,
            definition: t.definition
        })));
    } catch (error) {
        console.error('Error registering task provider:', error);
    }

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