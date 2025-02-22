"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const path = require("path");
const Mocha = require('mocha');
const glob_1 = require("glob");
function run() {
    const mocha = new Mocha({
        ui: 'tdd',
        color: true,
        reporter: 'spec'
    });
    const testsRoot = path.resolve(__dirname, '.');
    return new Promise(async (resolve, reject) => {
        try {
            const files = await new Promise((resolve, reject) => {
                (0, glob_1.glob)('**/**.test.js', { cwd: testsRoot }, (err, matches) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(matches);
                    }
                });
            });
            files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));
            mocha.run((failures) => {
                if (failures > 0) {
                    reject(new Error(`${failures} tests failed.`));
                }
                else {
                    resolve();
                }
            });
        }
        catch (err) {
            reject(err);
        }
    });
}
//# sourceMappingURL=index.js.map