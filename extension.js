// The module 'vscode' contains the VS Code extensibility API
const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Activating jump-history extension');
    // Create output channel for debugging
    const outputChannel = vscode.window.createOutputChannel('Jump History');

    // Track file opens
    const fileOpenDisposable = vscode.workspace.onDidOpenTextDocument(document => {
        const message = `File opened: ${document.uri.fsPath}`;
        console.log(message);
        outputChannel.appendLine(message);
    });

    // Track definition jumps
    const definitionProviderDisposable = vscode.languages.registerDefinitionProvider('*', {
        provideDefinition(document, position, _token) {
            const message = `Definition jump requested at ${document.uri.fsPath}:${position.line + 1}:${position.character + 1}`;
            console.log(message);
            outputChannel.appendLine(message);
            return undefined; // Let VSCode handle the actual jump
        }
    });

    // Register disposables
    context.subscriptions.push(fileOpenDisposable);
    context.subscriptions.push(definitionProviderDisposable);
    context.subscriptions.push(outputChannel);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
    activate,
    deactivate
}
