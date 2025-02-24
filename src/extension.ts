import * as vscode from 'vscode';

interface SampleTaskDefinition extends vscode.TaskDefinition {
    task: string;
}

export async function activate(context: vscode.ExtensionContext) {
    // Create and register task provider
    const taskProvider = new class implements vscode.TaskProvider, vscode.Disposable {
        private _tasks: vscode.Task[] | undefined;
        private _disposables: vscode.Disposable[] = [];

        constructor() {
            // Initialize tasks immediately
            this.provideTasks().then(tasks => {
                console.log('Tasks initialized:', tasks);
            }).catch(err => {
                console.error('Error initializing tasks:', err);
            });
        }

        dispose() {
            while (this._disposables.length) {
                const disposable = this._disposables.pop();
                if (disposable) {
                    disposable.dispose();
                }
            }
            this._tasks = undefined;
        }

        async provideTasks(): Promise<vscode.Task[]> {
            console.log('provideTasks called');
            if (this._tasks) {
                console.log('Returning cached tasks:', this._tasks);
                return this._tasks;
            }

            try {
                const definition: SampleTaskDefinition = {
                    type: 'jump-history',
                    task: 'Sample Task'
                };
                console.log('Creating task with definition:', definition);
                const task = new vscode.Task(
                    definition,
                    vscode.TaskScope.Workspace,
                    'Sample Task',
                    'jump-history', // Match the type in package.json
                    new vscode.ShellExecution('echo "OK"')
                );
                task.isBackground = false;
                task.presentationOptions = {
                    reveal: vscode.TaskRevealKind.Always,
                    echo: true,
                    focus: false,
                    panel: vscode.TaskPanelKind.Shared
                };
                this._tasks = [task];
                console.log('Task created and cached:', task);
                return this._tasks;
            } catch (error) {
                console.error('Error creating task:', error);
                return [];
            }
        }

        resolveTask(task: vscode.Task): vscode.Task | undefined {
            console.log('resolveTask called with:', task);
            try {
                const definition = task.definition as SampleTaskDefinition;
                if (definition.task) {
                    const resolvedTask = new vscode.Task(
                        definition,
                        vscode.TaskScope.Workspace,
                        definition.task,
                        'jump-history', // Match the type in package.json
                        new vscode.ShellExecution(`echo "${definition.task}"`)
                    );
                    console.log('Task resolved successfully:', resolvedTask);
                    return resolvedTask;
                }
                return undefined;
            } catch (error) {
                console.error('Error resolving task:', error);
                return undefined;
            }
        }
    };

    console.log('Registering task provider...');
    // Register task provider and store both the provider and registration
    const registration = await vscode.tasks.registerTaskProvider('jump-history', taskProvider);
    context.subscriptions.push(registration, taskProvider);

    // Initialize task system
    console.log('Initializing task system...');
    // Force task system initialization and wait for it to be ready
    await vscode.commands.executeCommand('workbench.action.tasks.configureTaskRunner');
    await new Promise(resolve => setTimeout(resolve, 20000)); // Increase wait time further for CI environment
    await vscode.commands.executeCommand('workbench.action.tasks.reRunTask'); // Try to force task refresh
    await vscode.commands.executeCommand('workbench.action.tasks.showTasks'); // Show tasks to ensure they're loaded
    await vscode.commands.executeCommand('workbench.action.tasks.runTask', 'Sample Task'); // Try to run the task directly
    // Initialize tasks explicitly
    console.log('Initializing tasks...');
    const initialTasks = await taskProvider.provideTasks();
    console.log('Initial tasks created:', initialTasks);

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