import * as vscode from 'vscode';
import { HistoryNode, HistoryData, HistoryTreeItem, SerializedHistoryData, SerializedHistoryNode } from './types';

export class HistoryTreeProvider implements vscode.TreeDataProvider<string> {
    private _onDidChangeTreeData = new vscode.EventEmitter<string | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
    public historyData: HistoryData;
    private context: vscode.ExtensionContext;
    private outputChannel: vscode.OutputChannel;

    constructor(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
        this.context = context;
        const savedData = context.globalState.get<SerializedHistoryData>('jumpHistory');
        this.historyData = savedData ? {
            nodes: new Map(savedData.nodes.map(([key, node]: [string, SerializedHistoryNode]) => [key, {
                uri: vscode.Uri.parse(node.uri),
                children: new Set(node.children),
                parent: node.parent,
                timestamp: node.timestamp,
                label: node.label
            }])),
            root: savedData.root
        } : { nodes: new Map(), root: null };
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

    private lastActiveFile: string | null = null;
    private currentActiveFile: string | null = null;

    private logTreeStructure(): void {
        this.outputChannel.appendLine('\nCurrent Tree Structure:');
        const printNode = (uri: string, depth: number = 0) => {
            const node = this.historyData.nodes.get(uri);
            if (!node) return;
            
            const indent = '  '.repeat(depth);
            const label = vscode.workspace.asRelativePath(node.uri);
            this.outputChannel.appendLine(`${indent}• ${label}`);
            
            for (const childUri of node.children) {
                printNode(childUri, depth + 1);
            }
        };
        
        if (this.historyData.root) {
            printNode(this.historyData.root);
        } else {
            this.outputChannel.appendLine('(Empty tree)');
        }
    }

    addHistoryEntry(from: vscode.Uri, to: vscode.Uri): void {
        const fromStr = from.toString();
        const toStr = to.toString();
        const timestamp = Date.now();
        
        this.outputChannel.appendLine(`\nEvent: Navigation from ${vscode.workspace.asRelativePath(from)} to ${vscode.workspace.asRelativePath(to)}`);
        this.outputChannel.appendLine(`Time: ${new Date(timestamp).toISOString()}`);

        // Add or update nodes
        if (!this.historyData.nodes.has(fromStr)) {
            this.historyData.nodes.set(fromStr, {
                uri: from,
                children: new Set(),
                parent: null,
                timestamp
            });
        }
        if (!this.historyData.nodes.has(toStr)) {
            this.historyData.nodes.set(toStr, {
                uri: to,
                children: new Set(),
                parent: null,
                timestamp
            });
        }

        // Update relationships based on navigation
        const parentStr = this.currentActiveFile || fromStr;
        const toNode = this.historyData.nodes.get(toStr);
        const parentNode = this.historyData.nodes.get(parentStr);

        if (toNode && parentNode) {
            // Remove from previous parent if exists
            if (toNode.parent) {
                const oldParentNode = this.historyData.nodes.get(toNode.parent);
                oldParentNode?.children.delete(toStr);
            }
            
            // Update parent-child relationship
            toNode.parent = parentStr;
            parentNode.children.add(toStr);
        }
        
        // Set root if not exists
        if (!this.historyData.root) {
            this.historyData.root = fromStr;
        }

        // Update tracking
        this.lastActiveFile = this.currentActiveFile;
        this.currentActiveFile = toStr;

        // Log updated tree structure and notify tree view of changes
        this.logTreeStructure();
        this._onDidChangeTreeData.fire(undefined);
    }

    // Save history data to extension storage
    saveHistory(): void {
        // Convert Map to object for storage
        const serializedData: SerializedHistoryData = {
            nodes: Array.from(this.historyData.nodes.entries()).map(([key, node]) => [
                key,
                {
                    uri: node.uri.toString(),
                    children: Array.from(node.children),
                    parent: node.parent,
                    timestamp: node.timestamp,
                    label: node.label
                } as SerializedHistoryNode
            ]),
            root: this.historyData.root
        };
        this.context.globalState.update('jumpHistory', serializedData);
    }
}
