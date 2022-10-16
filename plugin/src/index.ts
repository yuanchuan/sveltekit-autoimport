import autoimport from "./autoimport/index.js";
import type { Plugin } from "vite";
import { overrideTsConfig } from "./overrideTsConfig/index.js";
import type { AutowireUserConfig } from "./config.js";


export function autowire(config: AutowireUserConfig): Plugin[] {
    const plugins: Plugin[] = [];
    if (config.autoimport !== false) {
        plugins.push(autoimport(config.autoimport))
    }
    plugins.push(overrideTsConfig())
    return plugins;
}
