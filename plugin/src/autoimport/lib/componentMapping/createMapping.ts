import { normalizePath } from "vite";
import { traverse } from "../moduleResolution/fsTraversal.js";
import { getModuleName } from "../moduleResolution/moduleNaming.js";
import path from 'path';
import { ComponentsConfig, ImportMapping, MappingConfig, ModuleConfig, TypeDeclarationMapping } from "../../types.js";

/**
 * Finds all the .svelte files that could be autoimported based on the configuration
 */
export function createMapping(components: ComponentsConfig, module: ModuleConfig, mapping: MappingConfig, filter): [ImportMapping, TypeDeclarationMapping] {

    /* Map keys that may need to be imported to import statements */
    const importMapping: ImportMapping = {};

    let componentTypeDeclarations: TypeDeclarationMapping = {};

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
            componentTypeDeclarations[moduleName] = target => {
                let moduleFrom = normalizePath(path.relative(target, filePath));
                if (!moduleFrom.startsWith('.')) {
                    moduleFrom = './' + moduleFrom;
                }
                return `declare const ${moduleName}: typeof import("${moduleFrom}")["default"];`
            }
        });
    });


    Object.entries(module).forEach(([moduleFrom, moduleImports]) => {
        for (const moduleImport of moduleImports) {
            let typeDeclaration: () => string;
            let importStatement: () => string;

            //If an key is imported with "import x as y", we need to trigger an import on the alias y, not on the originx
            const [origin, alias] = moduleImport.split(/\s+as\s+/);

            //If the origin is "*", we need to import as a namespace.
            if (origin.trim().startsWith("*")) {
                importStatement = () => `import ${moduleImport} from '${moduleFrom}'`;
                typeDeclaration = () => `declare const ${alias ?? origin}: typeof import("${moduleFrom}");`
            }
            else {
                importStatement = () => `import { ${moduleImport} } from '${moduleFrom}'`;
                typeDeclaration = () => `declare const ${alias ?? origin}: typeof import("${moduleFrom}")["${origin}"];`
            }

            importMapping[alias ?? origin] = importStatement
            componentTypeDeclarations[alias ?? origin] = typeDeclaration;
        }
    })

    Object.entries(mapping).forEach(([name, value]) => {
        importMapping[name] = () => value;
    });

    return [importMapping, componentTypeDeclarations];
}