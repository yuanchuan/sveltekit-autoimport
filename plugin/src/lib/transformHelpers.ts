import { Ast, PreprocessorGroup } from "../types.js";
import { preprocess, parse } from 'svelte/compiler'

/**
 * Generate an estree AST from a *.svelte* file
 * 
 * @param code The raw svelte code to be transformed
 * @param sveltePreprocessor - optional - A svelte preprocessor that needs to be run before generating the AST (example: typescript)
 * @param filename The name of the current *.svelte* file
 * @returns The AST. If parsing fails: undefined
 */
export async function genrateAST(code: string, sveltePreprocessor: PreprocessorGroup | undefined, filename: string): Promise<Ast | undefined> {
    let ast = undefined;
    try {
        if (sveltePreprocessor) {
            let result = await preprocess(code, sveltePreprocessor, { filename });
            code = result.code;
        }
        ast = parse(code);
    } catch (e) {
        console.warn('Error on preprocess:', e.message);
    }
    return ast;
}