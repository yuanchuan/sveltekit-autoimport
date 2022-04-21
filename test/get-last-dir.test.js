import path from 'path';
import { getLastDir } from '../src/lib.js';

function join(...args) {
  return args.join(path.sep);
}

test('get last dir', () => {
  expect(getLastDir(join('a', 'b', 'c'))).toEqual('c')
  expect(getLastDir(join('a', 'b', 'index'))).toEqual('b')
});
