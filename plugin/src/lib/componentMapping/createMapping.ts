import { normalizePath } from "vite";
import { traverse } from "../moduleResolution/fsTraversal.js";
import { getModuleName } from "../moduleResolution/moduleNaming.js";
import path from 'path';
import { ComponentsConfig, ImportMapping, MappingConfig, ModuleConfig } from "../../types.js";

/**
 * Finds all the .svelte files that could be autoimported based on the configuration
 */
export function createMapping(components: ComponentsConfig, module: ModuleConfig, mapping: MappingConfig, filter): [ImportMapping, any[]] {

    /* Map keys that may need to be imported to import statements */
    const importMapping: ImportMapping = {};

    /* Base paths to start looking for svelte components. These may be used by the vite filesystem watcher */
    const componentPaths: any[] = [];

    // Read all components from given paths
    // and transform the import names into CamelCase
    components.forEach(component => {

        //Gets the absolute path to the specified directory
        let componentPath = path.resolve(component.directory);
        componentPaths.push(componentPath);

        /*
          This looks through the filesystem to find all .svelte files that could be imported,
          resolves the Names by which they are imported, 
          and returns functions, which generate the necessary import statements to import the components,
          relative to any modules they might be imported from.
        */
        traverse(componentPath, filter, filename => {
            let moduleName = getModuleName(componentPath, filename, component.flat, component.prefix);
            importMapping[moduleName] = target => {
                let moduleFrom = normalizePath(path.relative(target, filename));
                if (!moduleFrom.startsWith('.')) {
                    moduleFrom = './' + moduleFrom;
                }
                return `import ${moduleName} from '${moduleFrom}'`
            }
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

    return [
        importMapping,
        componentPaths,
    ];
}