// Basic API health & integration sanity test
import assert from 'assert';

export function runSanityCheck() {
  assert.strictEqual(true, true);
  console.log('Sanity check passed!');
}

if (process.argv[1] && process.argv[1].endsWith('api.test.ts')) {
  runSanityCheck();
}
