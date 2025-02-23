import * as vscode from 'vscode';

export interface HistoryNode {
    uri: vscode.Uri;
    children: Set<string>;
    parent: string | null;
    timestamp: number;
    label?: string;
}

export interface HistoryData {
    nodes: Map<string, HistoryNode>;
    root: string | null;
}

export interface HistoryTreeItem extends vscode.TreeItem {
    uri: string;
}

export interface HistoryQuickPickItem extends vscode.QuickPickItem {
    uri: vscode.Uri;
}

export interface SerializedHistoryData {
    nodes: [string, HistoryNode][];
    root: string | null;
}
