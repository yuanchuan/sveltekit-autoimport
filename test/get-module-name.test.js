import { getModuleName } from '../src/lib.js';

describe('get module name', () => {

  test('by default', () => {
    let result = getModuleName('', 'a/b/c');
    expect(result).toEqual('ABC')
  });

  test('with `flat`', () => {
    let result = getModuleName('', 'a/b/c', true);
    expect(result).toEqual('C')
  });

  test('with `prefix`', () => {
    let result = getModuleName('', 'a/b/c', false, 'lib');
    expect(result).toEqual('LibABC')
  });

  test('with `flat` and `prefix`', () => {
    let result = getModuleName('', 'a/b/c', true, 'lib');
    expect(result).toEqual('LibC')
  });

});
