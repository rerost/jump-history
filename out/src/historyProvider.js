"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryTreeProvider = void 0;
const vscode = require("vscode");
class HistoryTreeProvider {
    constructor(context, outputChannel) {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.lastActiveFile = null;
        this.currentActiveFile = null;
        this.outputChannel = outputChannel;
        this.context = context;
        const savedData = context.globalState.get('jumpHistory');
        this.historyData = savedData ? {
            nodes: new Map(savedData.nodes.map(([key, node]) => [key, {
                    uri: vscode.Uri.parse(node.uri),
                    children: new Set(node.children),
                    parent: node.parent,
                    timestamp: node.timestamp,
                    label: node.label
                }])),
            root: savedData.root
        } : { nodes: new Map(), root: null };
    }
    getTreeItem(uri) {
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
    getChildren(uri) {
        if (!uri) {
            return this.historyData.root ? [this.historyData.root] : [];
        }
        const node = this.historyData.nodes.get(uri);
        return Array.from(node?.children || []);
    }
    logTreeStructure() {
        this.outputChannel.appendLine('\nCurrent Tree Structure:');
        const logLines = [];
        const printNode = (uri, depth = 0) => {
            const node = this.historyData.nodes.get(uri);
            if (!node)
                return;
            const indent = '  '.repeat(depth);
            const label = vscode.workspace.asRelativePath(node.uri);
            const line = `${indent}• ${label}`;
            this.outputChannel.appendLine(line);
            logLines.push(line);
            for (const childUri of node.children) {
                printNode(childUri, depth + 1);
            }
        };
        if (this.historyData.root) {
            printNode(this.historyData.root);
        }
        else {
            const emptyMessage = '(Empty tree)';
            this.outputChannel.appendLine(emptyMessage);
            logLines.push(emptyMessage);
        }
        // Also write to file for verification
        const fs = require('fs');
        const path = require('path');
        const logDir = path.join(__dirname, '../../logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        fs.appendFileSync(path.join(logDir, 'jump-history.log'), `\n[${new Date().toISOString()}]\n${logLines.join('\n')}\n`);
    }
    addHistoryEntry(from, to) {
        const timestamp = Date.now();
        const toStr = to.toString();
        // Handle initial file open
        if (!from) {
            this.outputChannel.appendLine(`\nEvent: Initial file open ${vscode.workspace.asRelativePath(to)}`);
            this.outputChannel.appendLine(`Time: ${new Date(timestamp).toISOString()}`);
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
            this.logTreeStructure();
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
        this.logTreeStructure();
        this._onDidChangeTreeData.fire(undefined);
    }
    // Save history data to extension storage
    saveHistory() {
        // Convert Map to object for storage
        const serializedData = {
            nodes: Array.from(this.historyData.nodes.entries()).map(([key, node]) => [
                key,
                {
                    uri: node.uri.toString(),
                    children: Array.from(node.children),
                    parent: node.parent,
                    timestamp: node.timestamp,
                    label: node.label
                }
            ]),
            root: this.historyData.root
        };
        this.context.globalState.update('jumpHistory', serializedData);
    }
}
exports.HistoryTreeProvider = HistoryTreeProvider;
//# sourceMappingURL=historyProvider.js.map