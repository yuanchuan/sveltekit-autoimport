
import { createFilter } from '@rollup/pluginutils';
import { createMapping, makeArray } from './lib.js';
import type { Plugin } from 'vite'
import { enforcePluginOrdering, resolveSveltePreprocessor } from './lib/configHelpers.js';
import { ImportMapping, Preprocessor } from './types.js';
import { genrateAST } from './lib/transformHelpers.js';
import { transformCode } from './lib/transformCode.js';

interface PluginOptions {
  components?: string[],
  mapping?: Record<string, string>,
  module?: Record<string, string[]>,
  include?: string[],
  exclude?: string[]
}


export default function autowire({ components, module, mapping, include, exclude }: PluginOptions = {}): Plugin {
  if (!include) {
    include = ['**/*.svelte'];
  }
  const filter = createFilter(include, [
    ...makeArray(exclude),
    '**/node_modules/**',
    '**/.git/**',
    '**/.svelte-kit/**',
    '**/.svelte/**'
  ]);

  let importMapping : ImportMapping= {};
  let componentPaths = [];
  let sveltePreprocessor: Preprocessor | undefined;

  function updateMapping() {
    [importMapping, componentPaths] =
      createMapping({ components, module, mapping, filter });
  }

  
  updateMapping();

  return {
    name: 'sveltekit-autowire',

    enforce: 'pre',

    // Must be processed before vite-plugin-svelte
    async configResolved(config) {
      enforcePluginOrdering(config.plugins);
      sveltePreprocessor = await resolveSveltePreprocessor(config);
    },

    async transform(code, filename) {
      if (!filter(filename)) return;
      const ast = await genrateAST(code, sveltePreprocessor, filename)
      return transformCode(code, ast, filename, importMapping);
    },

    configureServer(server) {
      if (componentPaths.length) {
        server.watcher
          .add(componentPaths)
          .on('add', updateMapping)
          .on('unlink', updateMapping);
      }
    }
  }
}
