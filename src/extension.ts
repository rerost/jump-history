import * as vscode from 'vscode';

interface SampleTaskDefinition extends vscode.TaskDefinition {
    task: string;
}

export async function activate(context: vscode.ExtensionContext) {
    // Create task provider with proper type handling
    const taskProvider: vscode.TaskProvider = {
        provideTasks: async () => {
            try {
                // Create task definition that matches package.json
                const definition: SampleTaskDefinition = {
                    type: 'sample',
                    task: 'Sample Task'
                };

                // Create task with ShellExecution
                const task = new vscode.Task(
                    definition,
                    vscode.TaskScope.Workspace,
                    'Sample Task',
                    'jump-history',  // Use extension name as source
                    new vscode.ShellExecution('echo "Sample Task executed"')
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
                    // Create task with ShellExecution
                    return new vscode.Task(
                        definition,
                        vscode.TaskScope.Workspace,
                        definition.task,
                        'jump-history',  // Use extension name as source
                        new vscode.ShellExecution(`echo "${definition.task} executed"`)
                    );
                }
            } catch (error) {
                console.error('Error resolving task:', error);
            }
            return undefined;
        }
    };

    // Register task provider
    console.log('Registering task provider...');
    try {
        const registration = vscode.tasks.registerTaskProvider('sample', taskProvider);
        context.subscriptions.push(registration);
        console.log('Task provider registered successfully');
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
}                                                                               