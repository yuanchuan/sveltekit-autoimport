import { getLastDir } from '../src/lib.js';

test('get last dir', () => {
  expect(getLastDir('a/b/c')).toEqual('c')
  expect(getLastDir('a/b/index')).toEqual('b')
});
