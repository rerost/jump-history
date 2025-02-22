"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryTreeProvider = void 0;
const vscode = require("vscode");
class HistoryTreeProvider {
    constructor(context) {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.lastActiveFile = null;
        this.currentActiveFile = null;
        this.context = context;
        this.historyData = context.globalState.get('jumpHistory') || {
            nodes: new Map(),
            root: null
        };
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
    addHistoryEntry(from, to) {
        const fromStr = from.toString();
        const toStr = to.toString();
        const timestamp = Date.now();
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
        // Notify tree view of changes
        this._onDidChangeTreeData.fire(undefined);
    }
    // Save history data to extension storage
    saveHistory() {
        // Convert Map to object for storage
        const serializedData = {
            nodes: Array.from(this.historyData.nodes.entries()),
            root: this.historyData.root
        };
        this.context.globalState.update('jumpHistory', serializedData);
    }
}
exports.HistoryTreeProvider = HistoryTreeProvider;
//# sourceMappingURL=historyProvider.js.map