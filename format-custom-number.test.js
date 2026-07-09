const assert = require('assert');
const fs = require('fs');

const source = fs.readFileSync('Extension/popup.js', 'utf8');

function extractFunction(name) {
    const start = source.indexOf(`function ${name}`);
    assert.notStrictEqual(start, -1, `${name} not found`);

    const braceStart = source.indexOf('{', start);
    let depth = 0;
    for (let i = braceStart; i < source.length; i++) {
        if (source[i] === '{') depth++;
        if (source[i] === '}') depth--;
        if (depth === 0) return source.slice(start, i + 1);
    }
    throw new Error(`${name} body not found`);
}

eval(extractFunction('normalizeDecimalPlaces'));
eval(extractFunction('formatCustomNumber'));

assert.strictEqual(source.includes('approx'), false, 'Approximation UI code should be removed');
assert.strictEqual(formatCustomNumber(12345.67, '.', ',', 2), '12,345.67');
assert.strictEqual(formatCustomNumber(12345.67, '.', ',', 1), '12,345.7');
assert.strictEqual(formatCustomNumber(12345.67, '.', ',', 0), '12,346');
assert.strictEqual(formatCustomNumber(12345.67, ',', '.', 1), '12.345,7');
assert.strictEqual(formatCustomNumber(0.516, '.', ',', 0), '0.52');
assert.strictEqual(formatCustomNumber(0.516, '.', ',', 1), '0.52');
assert.strictEqual(formatCustomNumber(0.234, '.', ',', 0), '0.23');
assert.strictEqual(formatCustomNumber(0.057, '.', ',', 0), '0.06');
assert.strictEqual(formatCustomNumber(0.057, '.', ',', 1), '0.06');
assert.strictEqual(formatCustomNumber(0.004, '.', ',', 2), '0.004');
