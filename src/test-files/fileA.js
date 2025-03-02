// This is file A
function functionA() {
  console.log('Function A');
  // This function calls functionB from fileB.js
  functionB();
}

module.exports = {
  functionA
};
