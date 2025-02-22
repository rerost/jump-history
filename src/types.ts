import * as vscode from 'vscode';

export interface HistoryNode {
    uri: vscode.Uri;
    children: Set<string>;
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
