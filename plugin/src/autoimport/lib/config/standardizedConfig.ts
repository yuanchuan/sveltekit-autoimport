import { PluginConfig, PluginUserConfig } from "../../types.js";
import path from 'path'


export function standardizeConfing(userConfig : PluginUserConfig) : PluginConfig {
    const config : PluginConfig = {
        include: userConfig.include ?? ['**/*.svelte'],
        exclude: userConfig.exclude ?? [],
        module: {},
        mapping: userConfig.mapping ?? {},
        components: []
    }

    if(userConfig.components) {
        for(const component of userConfig.components) {
            if(typeof component !== "string") config.components.push({
                directory: path.resolve(component.directory),
                flat: component.flat ?? false,
                prefix: component.prefix ?? ""
            });
            else config.components.push({directory: path.resolve(component), flat: false, prefix: ""});
        }
    }

    if(userConfig.module) {
        Object.entries(userConfig.module).forEach(([moduleName, moduleImport]) => {
            if(typeof moduleImport === "string") moduleImport = [moduleImport];
            config.module[moduleName] = moduleImport;
        })
    }

    return config;
}