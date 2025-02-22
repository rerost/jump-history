import * as vscode from 'vscode';
import { HistoryNode, HistoryData, HistoryTreeItem } from './types';

export class HistoryTreeProvider implements vscode.TreeDataProvider<string> {
    private _onDidChangeTreeData = new vscode.EventEmitter<string | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
    public historyData: HistoryData;

    constructor(context: vscode.ExtensionContext) {
        this.historyData = context.globalState.get('jumpHistory') || { 
            nodes: new Map(), 
            root: null 
        };
    }

    getTreeItem(uri: string): vscode.TreeItem {
        const node = this.historyData.nodes.get(uri);
        if (!node) {
            throw new Error(`Node not found for URI: ${uri}`);
        }
        
        return {
            label: vscode.workspace.asRelativePath(node.uri),
            collapsibleState: node.children.size > 0 
                ? vscode.TreeItemCollapsibleState.Expanded 
                : vscode.TreeItemCollapsibleState.None,
            command: {
                command: 'vscode.open',
                title: 'Open File',
                arguments: [node.uri]
            }
        };
    }

    getChildren(uri?: string): string[] {
        if (!uri) {
            return this.historyData.root ? [this.historyData.root] : [];
        }
        const node = this.historyData.nodes.get(uri);
        return Array.from(node?.children || []);
    }

    addHistoryEntry(from: vscode.Uri, to: vscode.Uri): void {
        const fromStr = from.toString();
        const toStr = to.toString();

        // Add or update nodes
        if (!this.historyData.nodes.has(fromStr)) {
            this.historyData.nodes.set(fromStr, {
                uri: from,
                children: new Set(),
                timestamp: Date.now()
            });
        }
        if (!this.historyData.nodes.has(toStr)) {
            this.historyData.nodes.set(toStr, {
                uri: to,
                children: new Set(),
                timestamp: Date.now()
            });
        }

        // Update relationships
        this.historyData.nodes.get(fromStr)?.children.add(toStr);
        
        // Set root if not exists
        if (!this.historyData.root) {
            this.historyData.root = fromStr;
        }

        // Notify tree view of changes
        this._onDidChangeTreeData.fire(undefined);
    }

    // Save history data to extension storage
    saveHistory(): void {
        // Convert Map to object for storage
        const serializedData = {
            nodes: Array.from(this.historyData.nodes.entries()),
            root: this.historyData.root
        };
        vscode.commands.executeCommand('setContext', 'jumpHistory', serializedData);
    }
}
