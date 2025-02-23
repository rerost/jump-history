import * as vscode from 'vscode';
import { HistoryTreeProvider } from './historyProvider';
import { showHistoryQuickPick } from './quickPick';

export function activate(context: vscode.ExtensionContext): void {
    console.log('Activating jump-history extension');
    
    // Create and register the history provider
    const historyProvider = new HistoryTreeProvider(context);
    const treeView = vscode.window.createTreeView('jumpHistory', { 
        treeDataProvider: historyProvider,
        showCollapseAll: true
    });
    context.subscriptions.push(treeView);

    // Track file opens and navigation
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor?.document.uri) {
                const currentUri = editor.document.uri;
                const lastUri = context.workspaceState.get<vscode.Uri>('lastActiveFile');
                if (lastUri && lastUri.toString() !== currentUri.toString()) {
                    historyProvider.addHistoryEntry(lastUri, currentUri);
                }
                context.workspaceState.update('lastActiveFile', currentUri);
            }
        })
    );

    // Track definition jumps
    context.subscriptions.push(
        vscode.languages.registerDefinitionProvider('*', {
            provideDefinition(document: vscode.TextDocument): vscode.ProviderResult<vscode.Definition> {
                const currentUri = document.uri;
                const lastUri = context.workspaceState.get<vscode.Uri>('lastActiveFile');
                if (lastUri && lastUri.toString() !== currentUri.toString()) {
                    historyProvider.addHistoryEntry(lastUri, currentUri);
                }
                context.workspaceState.update('lastActiveFile', currentUri);
                return undefined; // Let VSCode handle the actual jump
            }
        })
    );

    // Register quick pick command
    context.subscriptions.push(
        vscode.commands.registerCommand('jumpHistory.showQuickPick', () => {
            showHistoryQuickPick(historyProvider.historyData);
        })
    );

    // Save history data when deactivating
    context.subscriptions.push(
        new vscode.Disposable(() => {
            historyProvider.saveHistory();
        })
    );
}

export function deactivate(): void {}
