import { camelize } from '../src/lib.js';

function compare(a, b) {
  expect(camelize(a)).toEqual(b);
}

test('camelize', () => {
  compare('a', 'A');
  compare('a_b', 'AB');
  compare('a-b', 'AB');
  compare('a\\b', 'AB');
});
