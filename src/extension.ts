import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    const outputChannel = vscode.window.createOutputChannel('Jump History');
    outputChannel.appendLine('Activating jump-history extension');
    // Tasks出力の例
    const taskProvider = vscode.tasks.registerTaskProvider('jump-history', {
        provideTasks: () => {
            const task = new vscode.Task(
                { type: 'jump-history' },
                vscode.TaskScope.Workspace,
                'Jump History',
                'jump-history',
                new vscode.ShellExecution('echo "Jump History is ready"')
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
            return ['Jump History'];
        }
    };
    vscode.window.createTreeView('jumpHistoryExplorer', {
        treeDataProvider: treeDataProvider
    });

    // ファイルモニタリングの例
    const fileOpenListener = vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
            console.log(`ファイルが開かれました: ${editor.document.fileName}`);
        }
    });
    context.subscriptions.push(taskProvider, fileOpenListener);

    vscode.window.registerTreeDataProvider('jumpHistoryExplorer', treeDataProvider);
} 

export function deactivate() {
    console.log("deactivate")
}