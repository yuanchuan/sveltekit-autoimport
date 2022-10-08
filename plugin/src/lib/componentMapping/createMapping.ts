import { normalizePath } from "vite";
import { traverse } from "../moduleResolution/fsTraversal.js";
import { getModuleName } from "../moduleResolution/moduleNaming.js";
import path from 'path';
import { ComponentsConfig, ImportMapping, MappingConfig, ModuleConfig } from "../../types.js";

/**
 * Finds all the .svelte files that could be autoimported based on the configuration
 */
export function createMapping(components: ComponentsConfig, module: ModuleConfig, mapping: MappingConfig, filter): [ImportMapping, string[]] {

    /* Map keys that may need to be imported to import statements */
    const importMapping: ImportMapping = {};

    let componentTypeDeclarations: string[] = [];

    // Read all components from given paths
    // and transform the import names into CamelCase
    components.forEach(component => {

        /*
          This looks through the filesystem to find all .svelte files that could be imported,
          resolves the Names by which they are imported, 
          and returns functions, which generate the necessary import statements to import the components,
          relative to any modules they might be imported from.
        */
        traverse(component.directory, filter, filePath => {
            let moduleName = getModuleName(component.directory, filePath, component.flat, component.prefix);
            importMapping[moduleName] = target => {
                let moduleFrom = normalizePath(path.relative(target, filePath));
                if (!moduleFrom.startsWith('.')) {
                    moduleFrom = './' + moduleFrom;
                }
                return `import ${moduleName} from '${moduleFrom}'`
            }

            const typeDeclaration = `declare const ${moduleName}: typeof import("${"./" + path.relative("./src", filePath)}")["default"];`
            componentTypeDeclarations.push(typeDeclaration);
        });
    });


    Object.entries(module).forEach(([moduleFrom, moduleImports]) => {
        for (const moduleImport of moduleImports) {
            const importStatement = () => `import { ${moduleImport} } from '${moduleFrom}'`;

            //If an key is imported with "import x as y", we need to trigger an import on the alias y, not on the originx
            const [origin, alias] = moduleImport.split(/\s+as\s+/);
            importMapping[alias ?? origin] = importStatement
        }
    })

    Object.entries(mapping).forEach(([name, value]) => {
        importMapping[name] = () => value;
    });

    return [importMapping, componentTypeDeclarations];
}