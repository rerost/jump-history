import * as vscode from 'vscode';
import { HistoryData } from './types';

export function showHistoryQuickPick(historyData: HistoryData): void {
    const quickPick = vscode.window.createQuickPick();
    
    // Convert history nodes to quick pick items
    quickPick.items = Array.from(historyData.nodes.values()).map(node => ({
        label: vscode.workspace.asRelativePath(node.uri),
        description: new Date(node.timestamp).toLocaleString(),
        detail: node.uri.fsPath,
        // Store the full URI for use in onDidAccept
        uri: node.uri
    }));
    
    // Sort items by timestamp (most recent first)
    quickPick.items.sort((a, b) => {
        const aTime = new Date(a.description).getTime();
        const bTime = new Date(b.description).getTime();
        return bTime - aTime;
    });

    quickPick.placeholder = 'Select a file from jump history...';
    quickPick.matchOnDescription = true;
    quickPick.matchOnDetail = true;

    // Handle selection
    quickPick.onDidAccept(() => {
        const selected = quickPick.selectedItems[0] as { uri: vscode.Uri };
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
