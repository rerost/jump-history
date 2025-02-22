import * as path from 'path';
import Mocha = require('mocha');
import { glob } from 'glob';

export function run(): Promise<void> {
    const mocha = new Mocha({
        ui: 'tdd',
        color: true,
        reporter: 'spec'
    });

    const testsRoot = path.resolve(__dirname, '.');
    return new Promise(async (resolve, reject) => {
        try {
            const files = await new Promise<string[]>((resolve, reject) => {
                glob('**/*.test.js', { cwd: testsRoot }, (err, matches) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(matches);
                    }
                });
            });
            files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));

            mocha.run((failures: number) => {
                if (failures > 0) {
                    reject(new Error(`${failures} tests failed.`));
                } else {
                    resolve();
                }
            });
        } catch (err) {
            reject(err);
        }
    });
}
