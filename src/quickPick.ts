import * as vscode from 'vscode';
import { HistoryData, HistoryQuickPickItem } from './types';

export function showHistoryQuickPick(historyData: HistoryData): void {
    const quickPick = vscode.window.createQuickPick();
    
    // Convert history nodes to quick pick items
    const items: HistoryQuickPickItem[] = Array.from(historyData.nodes.values())
        .sort((a, b) => b.timestamp - a.timestamp)
        .map(node => ({
            label: vscode.workspace.asRelativePath(node.uri),
            description: new Date(node.timestamp).toLocaleString(),
            detail: node.uri.fsPath,
            uri: node.uri
        }));
    
    quickPick.items = items;

    quickPick.placeholder = 'Select a file from jump history...';
    quickPick.matchOnDescription = true;
    quickPick.matchOnDetail = true;

    // Handle selection
    quickPick.onDidAccept(() => {
        const selected = quickPick.selectedItems[0] as HistoryQuickPickItem;
        if (selected?.uri) {
            vscode.workspace.openTextDocument(selected.uri)
                .then(doc => vscode.window.showTextDocument(doc));
        }
        quickPick.hide();
    });

    // Clean up on hide
    quickPick.onDidHide(() => quickPick.dispose());
    
    quickPick.show();
}
