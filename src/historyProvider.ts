import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
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

    private logTreeStructure(event?: string): void {
        const logLines: string[] = [];
        
        const printNode = (uri: string, depth: number = 0) => {
            const node = this.historyData.nodes.get(uri);
            if (!node) return;
            
            const indent = '  '.repeat(depth);
            const label = vscode.workspace.asRelativePath(node.uri);
            const line = `${indent}• ${label}`;
            logLines.push(line);
            
            for (const childUri of node.children) {
                printNode(childUri, depth + 1);
            }
        };
        
        if (this.historyData.root) {
            printNode(this.historyData.root);
        } else {
            logLines.push('(Empty tree)');
        }

        const timestamp = new Date().toISOString();
        const logEntry = `
[${timestamp}]
${event || 'Current Tree Structure:'}
${logLines.join('\n')}
----------------------------------------\n`;

        // Write to output channel and file
        this.outputChannel.appendLine(logEntry);
        
        const logDir = path.join(__dirname, '../../logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        fs.appendFileSync(
            path.join(logDir, 'jump-history.log'),
            logEntry
        );
    }

    addHistoryEntry(from: vscode.Uri | undefined, to: vscode.Uri): void {
        const timestamp = Date.now();
        const toStr = to.toString();
        const currentFile = vscode.workspace.asRelativePath(to);
        const previousFile = from ? vscode.workspace.asRelativePath(from) : null;
        const isoTimestamp = new Date(timestamp).toISOString();

        // Handle initial file open
        if (!from) {
            const eventMessage = `Event: Initial file open ${currentFile}`;
            this.outputChannel.appendLine(`\n[${isoTimestamp}]\n${eventMessage}`);

            // Add initial node if not exists
            if (!this.historyData.nodes.has(toStr)) {
                this.historyData.nodes.set(toStr, {
                    uri: to,
                    children: new Set(),
                    parent: null,
                    timestamp
                });
                // Set as root if no root exists
                if (!this.historyData.root) {
                    this.historyData.root = toStr;
                }
            }

            // Update tracking and notify
            this.currentActiveFile = toStr;
            this.logTreeStructure(`Event: Initial file open ${vscode.workspace.asRelativePath(to)}`);
            this._onDidChangeTreeData.fire(undefined);
            return;
        }

        const fromStr = from.toString();
        
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
        this.logTreeStructure(`Event: Navigation from ${vscode.workspace.asRelativePath(from)} to ${vscode.workspace.asRelativePath(to)}`);
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
