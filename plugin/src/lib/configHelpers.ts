import { Plugin } from "vite";

/**
 * Enforces the order in which the plugins are defined in the user's vite.config.js file
 * Autwoire must be defined before sveltekit (as to be executed before it)
 * 
 * @param plugins - An array of plugins loaded by vite
 * @throws If the plugins are in the wrong order
 */
export function enforcePluginOrdering(plugins: readonly Plugin[]){
    let indexPluginSvelte = plugins.findIndex(n => n.name === 'vite-plugin-svelte');
    let indexAutoImport = plugins.findIndex(n => n.name === 'sveltekit-autowire');
    if (indexPluginSvelte < indexAutoImport) {
      throw Error("The autowire plugin must come before SvelteKit plugin in your vite config")
    }
}


export function resolveSvelteConfig() {

}