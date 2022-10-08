import type { preprocess, parse } from 'svelte/compiler'
import type { Plugin } from 'vite'

//@ts-ignore
export type Config = Parameters<Plugin["configResolved"]>[0];
export type Preprocessor = Parameters<typeof preprocess>[1];
export type Ast = ReturnType<typeof parse>
export type ImportMapping = Record<string, ((target: string) => string)>;

export type ComponentsUserConfig = string | {
    directory: string,
    flat?: boolean,
    prefix?: string
}[]

export type ComponentsConfig = {
    /* ABSOLUTE path to the directory */
    directory: string,
    flat: boolean,
    prefix: string
}[]

export type MappingUserConfig =  Record<string, string>;
export type MappingConfig = MappingUserConfig;

export type ModuleConfig = Record<string, string[]>;
export type ModuleUserConfig = Record<string, string[] | string>;

export interface PluginUserConfig {
    components?: ComponentsUserConfig;
    mapping?: MappingUserConfig,
    module?: ModuleUserConfig,
    include?: string[],
    exclude?: string[]
}

export interface PluginConfig {
    components: ComponentsConfig,
    mapping: MappingConfig,
    module: ModuleConfig
    include: string[]
    exclude: string[]
}