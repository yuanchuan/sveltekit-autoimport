import path from 'path';
import { fileURLToPath } from 'url';
import { createFilter } from '@rollup/pluginutils';
import { createMapping } from '../../src/lib.js';

function resolve(name) {
  let __dirname = path.dirname(fileURLToPath(import.meta.url));
  return path.join(__dirname, name);
}

let [mapping, paths] = createMapping({
  components: resolve('./components'),
  filter: createFilter(['**/*.svelte']),
});

test('create mapping', () => {
  expect(Object.keys(mapping)).toEqual(['A', 'B', 'LibC'])
  expect(paths).toEqual([resolve('./components')])
});
