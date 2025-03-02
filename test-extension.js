// This is a simple script to test the extension manually
// You can run this script with: node test-extension.js

console.log('Testing Jump History Extension');
console.log('------------------------------');
console.log('To test the extension:');
console.log('1. Open VSCode with this extension installed');
console.log('2. Open the test files in src/test-files in the following order:');
console.log('   - fileA.js');
console.log('   - fileB.js (simulating a jump from fileA.js)');
console.log('   - fileC.js (simulating a jump from fileB.js)');
console.log('   - fileB.js (simulating a return to fileB.js)');
console.log('   - fileD.js (simulating a jump from fileB.js)');
console.log('3. Open the OUTPUT panel and select "Jump History" from the dropdown');
console.log('4. You should see a tree structure like:');
console.log('   * fileA.js');
console.log('     * fileB.js');
console.log('       * fileC.js');
console.log('     * fileD.js');
console.log('5. You can also use the commands:');
console.log('   - "Jump History: Show Navigation Tree" to display the tree');
console.log('   - "Jump History: Reset Navigation Tree" to reset the tree');
