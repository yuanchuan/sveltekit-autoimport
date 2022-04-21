import { prependTo, camelize, getModuleName } from '../src/lib.js';

describe('prependTo', () => {

  test('by default', () => {
    let result = prependTo('<script></script>', 'code', 0);
    expect(result).toEqual('<script>\ncode\n</script>');
  });

  test('with space', () => {
    let result = prependTo('<script ></script>', 'code', 0);
    expect(result).toEqual('<script >\ncode\n</script>');
  });


  test('with attributes', () => {
    let result = prependTo('<script type="ts" x="x"></script>', 'code', 0);
    expect(result).toEqual('<script type="ts" x="x">\ncode\n</script>');
  });

});


test('camelize', () => {
  function compare(a, b) {
    expect(camelize(a)).toEqual(b);
  }
  compare('a', 'A');
  compare('a_b', 'AB');
  compare('a-b', 'AB');
  compare('a\\b', 'AB');
});


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
