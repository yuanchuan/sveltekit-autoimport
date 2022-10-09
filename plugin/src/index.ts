import autoimport from "./autoimport/index.js";
import type { Plugin } from "vite";
import { PluginUserConfig } from "./autoimport/types.js";
import { overrideTsConfig } from "./overrideTsConfig/index.js";


export function autowire(config: PluginUserConfig): Plugin[] {
    return [autoimport(config), overrideTsConfig()];
}
