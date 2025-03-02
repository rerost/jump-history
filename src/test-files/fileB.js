// This is file B
function functionB() {
  console.log('Function B');
  // This function calls functionC from fileC.js
  functionC();
}

module.exports = {
  functionB
};
