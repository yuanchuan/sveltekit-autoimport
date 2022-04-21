import { prependTo } from '../src/lib.js';

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

  test('with offset', () => {
    let result = prependTo('<p></p><script type="ts" x="x"></script>', 'code', 7);
    expect(result).toEqual('<p></p><script type="ts" x="x">\ncode\n</script>');
  });

});
