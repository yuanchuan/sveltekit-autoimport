import * as svelte from 'svelte/compiler';
import { walkAST } from '../src/lib.js';

describe('walk ast', () => {

  test('used components', () => {
    let { maybeUsed } = walkAST(svelte.parse(`
      <A />
      <A />
      <B />
    `));
    expect(Array.from(maybeUsed)).toEqual(['A', 'B']);
  });

  test('used identifiers', () => {
    let { maybeUsed } = walkAST(svelte.parse(`
      <script>
        fn();
        let v = variable;
      </script>
    `));
    expect(Array.from(maybeUsed)).toEqual(['fn', 'variable']);
  });

  test('imports', () => {
    let { imported } = walkAST(svelte.parse(`
      <script>
        import a from 'a';
        import { b }  from 'b';
        import { c as d }  from 'c';
      </script>
    `));
    expect(Array.from(imported)).toEqual(['a', 'b', 'd']);
  });

  test('declared variable', () => {
    let { declared } = walkAST(svelte.parse(`
      <script>
        let s = abc;
      </script>
    `));
    expect(Array.from(declared)).toEqual(['s']);
  });

  test('declared variable with destructed array', () => {
    let { declared } = walkAST(svelte.parse(`
      <script>
        let [ s ] = ['hello'];
      </script>
    `));
    expect(Array.from(declared)).toEqual(['s']);
  });

  test('declared variable with array spread', () => {
    let { declared } = walkAST(svelte.parse(`
      <script>
        let [ ...s ] = ['hello'];
      </script>
    `));
    expect(Array.from(declared)).toEqual(['s']);
  });

  test('declared variable with destructed object', () => {
    let { declared } = walkAST(svelte.parse(`
      <script>
        let { s } = {};
      </script>
    `));
    expect(Array.from(declared)).toEqual(['s']);
  });

  test('declared variable with object spread', () => {
    let { declared } = walkAST(svelte.parse(`
      <script>
        let { ...s } = {};
      </script>
    `));
    expect(Array.from(declared)).toEqual(['s']);
  });

  test('object component', () => {
    let { maybeUsed } = walkAST(svelte.parse(`
      <A.Button />
    `));
    expect(Array.from(maybeUsed)).toEqual(['A']);
  });

  test('action name', () => {
    let { maybeUsed } = walkAST(svelte.parse(`
      <Button use:action />
    `));
    expect(Array.from(maybeUsed)).toEqual(['Button', 'action']);
  });

  test('action name and arguments', () => {
    let { maybeUsed } = walkAST(svelte.parse(`
      <Button use:action={{ key: unique }} />
    `));
    expect(Array.from(maybeUsed)).toEqual(['Button', 'action', 'unique']);
  });

  test('action name and arguments', () => {
    let { maybeUsed } = walkAST(svelte.parse(`
      <Button use:action={{ key: unique }} />
    `));
    expect(Array.from(maybeUsed)).toEqual(['Button', 'action', 'unique']);
  });

  test('transtition type', () => {
    let { maybeUsed } = walkAST(svelte.parse(`
      <Button in:action={{ key: unique }} out:action2 />
    `));
    expect(Array.from(maybeUsed)).toEqual(['Button', 'action', 'unique', 'action2']);
  });

  test('animation type', () => {
    let { maybeUsed } = walkAST(svelte.parse(`
      <Button animate:flip={{ key: unique }} />
    `));
    expect(Array.from(maybeUsed)).toEqual(['Button', 'flip', 'unique']);
  });

});
