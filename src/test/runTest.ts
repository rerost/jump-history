import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
    try {
        // テストファイルのディレクトリ
        const extensionDevelopmentPath = path.resolve(__dirname, '../../');
        const extensionTestsPath = path.resolve(__dirname, './suite/index');

        // VSCodeのテストインスタンスを実行
        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
        });
    } catch (err) {
        console.error('テストの実行に失敗しました:', err);
        process.exit(1);
    }
}

main(); 