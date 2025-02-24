import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    // Tasks出力の例
    const taskProvider = vscode.tasks.registerTaskProvider('sample', {
        provideTasks: () => {
            const task = new vscode.Task(
                { type: 'sample' },
                vscode.TaskScope.Workspace,
                'Sample Task',
                'sample',
                new vscode.ShellExecution('echo "OK"')
            );
            return [task];
        },
        resolveTask(_task: vscode.Task): vscode.Task | undefined {
            return undefined;
        }
    });

    // Explorerへの出力例
    const treeDataProvider = new class implements vscode.TreeDataProvider<string> {
        getTreeItem(element: string): vscode.TreeItem {
            return new vscode.TreeItem(element);
        }

        getChildren(): string[] {
            return ['OK'];
        }
    };

    // ファイルモニタリングの例
    const fileOpenListener = vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
            console.log(`ファイルが開かれました: ${editor.document.fileName}`);
        }
    });

    context.subscriptions.push(taskProvider, fileOpenListener);
    vscode.window.registerTreeDataProvider('sampleExplorer', treeDataProvider);
} 