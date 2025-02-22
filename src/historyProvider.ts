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

    private currentActiveFile: string | null = null;

    addHistoryEntry(from: vscode.Uri, to: vscode.Uri): void {
        const fromStr = from.toString();
        const toStr = to.toString();
        const timestamp = Date.now();

        // Add or update nodes
        if (!this.historyData.nodes.has(fromStr)) {
            this.historyData.nodes.set(fromStr, {
                uri: from,
                children: new Set(),
                timestamp
            });
        }
        if (!this.historyData.nodes.has(toStr)) {
            this.historyData.nodes.set(toStr, {
                uri: to,
                children: new Set(),
                timestamp
            });
        }

        // Update relationships based on current active file
        const parentStr = this.currentActiveFile || fromStr;
        if (this.historyData.nodes.has(parentStr)) {
            this.historyData.nodes.get(parentStr)?.children.add(toStr);
        }
        
        // Set root if not exists
        if (!this.historyData.root) {
            this.historyData.root = fromStr;
        }

        // Update current active file
        this.currentActiveFile = toStr;

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
