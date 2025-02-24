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

                // Create task with CustomExecution for better control
                const task = new vscode.Task(
                    definition,
                    vscode.TaskScope.Workspace,
                    'Sample Task',
                    'sample',
                    new vscode.CustomExecution(async (): Promise<vscode.Pseudoterminal> => {
                        // Create write/close event emitters
                        const writeEmitter = new vscode.EventEmitter<string>();
                        const closeEmitter = new vscode.EventEmitter<number>();
                        
                        return {
                            onDidWrite: writeEmitter.event,
                            onDidClose: closeEmitter.event,
                            open: () => {
                                writeEmitter.fire('Sample Task is running...\r\n');
                                writeEmitter.fire('Task completed successfully\r\n');
                                closeEmitter.fire(0);
                            },
                            close: () => { /* Terminal closed */ },
                            handleInput: () => { /* No input handling needed */ }
                        };
                    })
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
                    // Create task with CustomExecution for better control
                    return new vscode.Task(
                        definition,
                        vscode.TaskScope.Workspace,
                        definition.task,
                        'sample',
                        new vscode.CustomExecution(async (): Promise<vscode.Pseudoterminal> => {
                            // Create write/close event emitters
                            const writeEmitter = new vscode.EventEmitter<string>();
                            const closeEmitter = new vscode.EventEmitter<number>();
                            
                            return {
                                onDidWrite: writeEmitter.event,
                                onDidClose: closeEmitter.event,
                                open: () => {
                                    writeEmitter.fire('Sample Task is running...\r\n');
                                    writeEmitter.fire('Task completed successfully\r\n');
                                    closeEmitter.fire(0);
                                },
                                close: () => { /* Terminal closed */ },
                                handleInput: () => { /* No input handling needed */ }
                            };
                        })
                    );
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
        // Register task provider
        const registration = vscode.tasks.registerTaskProvider('sample', taskProvider);
        context.subscriptions.push(registration);
        console.log('Task provider registered successfully');

        // Wait for task system to be ready
        await vscode.commands.executeCommand('workbench.action.tasks.configureTaskRunner');
        
        // Verify tasks are available
        const tasks = await vscode.tasks.fetchTasks();
        console.log('All available tasks:', tasks.map(t => ({
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
}                                                                       