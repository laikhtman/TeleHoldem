const fs = require('fs');

const content = fs.readFileSync('client/src/pages/poker-game.tsx', 'utf8');
const lines = content.split('\n');

let depth = 0;
let stack = [];

lines.forEach((line, index) => {
  const lineNum = index + 1;
  
  // Count opening divs
  const openMatches = line.match(/<div(?:\s|>)/g);
  if (openMatches) {
    openMatches.forEach(() => {
      depth++;
      stack.push({ type: 'open', line: lineNum, content: line.trim() });
    });
  }
  
  // Count closing divs
  const closeMatches = line.match(/<\/div>/g);
  if (closeMatches) {
    closeMatches.forEach(() => {
      depth--;
      if (stack.length > 0 && stack[stack.length - 1].type === 'open') {
        stack.pop();
      } else {
        stack.push({ type: 'close', line: lineNum, content: line.trim() });
      }
    });
  }
});

console.log('Final depth:', depth);
console.log('Stack size:', stack.length);

if (stack.length > 0) {
  console.log('\nUnmatched tags:');
  stack.slice(0, 20).forEach(item => {
    console.log(`Line ${item.line}: ${item.type} - ${item.content.substring(0, 80)}...`);
  });
}