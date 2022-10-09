import { normalizePath, Plugin } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url';
import { Config, Preprocessor } from '../types.js';

/**
 * Enforces the order in which the plugins are definesd in the user's vite.config.js file
 * Autwoire must be defined before sveltekit (as to be executed before it)
 * 
 * @param plugins - An array of plugins loaded by vite
 * @throws If the plugins are in the wrong order
 */
export function enforcePluginOrdering(plugins: readonly Plugin[]) {
  let indexPluginSvelte = plugins.findIndex(n => n.name === 'vite-plugin-svelte');
  let indexAutoImport = plugins.findIndex(n => n.name === 'sveltekit-autowire');
  if (indexPluginSvelte < indexAutoImport) {
    throw Error("The autowire plugin must come before SvelteKit plugin in your vite config")
  }
}

/**
 * Returns the preprocessor defined in the user's `svelte.config.js` file, if it exists
 * @param config - The config obtained from configResolved 
 */
export async function resolveSveltePreprocessor(config: Config): Promise<Preprocessor | undefined> {
  try {
    let dirname = path.dirname(fileURLToPath(import.meta.url));
    let relative = path.relative(dirname, config.inlineConfig.root || config.root);
    let configFile = path.join(relative, './svelte.config.js');
    let pkg = await import(normalizePath('./' + configFile));
    return pkg.default.preprocess || [];
  } catch (e) {
    console.warn('Error reading svelte.config.js');
    return undefined;
  }
}