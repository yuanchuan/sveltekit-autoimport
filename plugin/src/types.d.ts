import type { preprocess, parse } from 'svelte/compiler'
import type {Plugin} from 'vite'
 
type Config = Parameters<Plugin["configResolved"]>[0];
type Preprocessor = Parameters<typeof preprocess>[1];
type Ast = ReturnType<typeof parse>