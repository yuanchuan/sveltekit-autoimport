import { FSWatcher, Plugin } from "vite";
import { readFileSync, existsSync, writeFileSync } from 'fs'
import path from 'path'

const TS_CONFIG_PAH = path.resolve("./.svelte-kit/tsconfig.json")

export function overrideTsConfig(): Plugin {

    function createTsConfig() {
        console.log("TODO: createTsConfig")
    }

    function fixTsConfig() {
        try {
            if(!existsSync(TS_CONFIG_PAH)) {
                createTsConfig();
                return;
            }

            const content = readFileSync(TS_CONFIG_PAH, { encoding: "utf-8" });
            const config: any = JSON.parse(content);

            if (!Array.isArray(config.include)) throw Error("No valid include field specified in tsconfig")
            if (config.include.includes("components.d.ts")) return //Already set up
            config.include.push("components.d.ts");

            const tsConfig = JSON.stringify(config);
            writeFileSync(TS_CONFIG_PAH, tsConfig, {encoding: "utf-8"})

        } catch (e) {
            console.error(e);
        }
    }

    return {
        name: "autowire-tsconfig",
        configureServer(server) {
            server.watcher
                .add(TS_CONFIG_PAH)
                .on("change", fixTsConfig)
                .on('add', fixTsConfig)
                .on("ready", fixTsConfig)

        }
    }
}