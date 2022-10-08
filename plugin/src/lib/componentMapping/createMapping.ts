import { normalizePath } from "vite";
import { traverse } from "../moduleResolution/fsTraversal.js";
import { getModuleName } from "../moduleResolution/moduleNaming.js";
import path from 'path';
import { ComponentsConfig, ImportMapping, MappingConfig, ModuleConfig } from "../../types.js";

/**
 * Finds all the .svelte files that could be autoimported based on the configuration
 */
export function createMapping(components: ComponentsConfig, module: ModuleConfig, mapping: MappingConfig, filter): [ImportMapping, any[]] {

    /* Map Module names to import statements */
    const importMapping: ImportMapping = {};

    /* Base paths to start looking for svelte components. These may be used by the vite filesystem watcher */
    const componentPaths: any[] = [];

    // Read all components from given paths
    // and transform the import names into CamelCase
    makeArray(components).forEach(comp => {
        let thisComp = comp;
        let flat = false;
        let prefix = '';
        if (comp && typeof comp !== 'string') {
            thisComp = comp.value || comp.name || comp.component || comp.directory;
            if (comp.flat !== undefined) {
                flat = !!comp.flat;
            }
            if (comp.prefix !== undefined) {
                prefix = String(comp.prefix);
            }
        }

        if (!thisComp) {
            return false;
        }
        let componentPath = path.resolve(String(thisComp));
        console.log(thisComp, componentPath)
        componentPaths.push(componentPath);

        /*
          This looks through the filesystem to find all .svelte files that could be imported,
          resolves the Names by which they are imported, 
          and returns functions, which generate the necessary import statements to import the components,
          relative to any modules they might be imported from.
        */
        traverse(componentPath, filter, filename => {
            let moduleName = getModuleName(componentPath, filename, flat, prefix);
            importMapping[moduleName] = target => {
                let moduleFrom = normalizePath(path.relative(target, filename));
                if (!moduleFrom.startsWith('.')) {
                    moduleFrom = './' + moduleFrom;
                }
                return `import ${moduleName} from '${moduleFrom}'`
            }
        });
    });

    // Select methods or properties from a given module
    Object.entries(makeLiteral(module)).forEach(([moduleFrom, names]) => {
        makeArray(names).forEach(name => {
            let importValue = () => `import { ${name} } from '${moduleFrom}'`;
            let [origin, alias] = name.split(/\s+as\s+/);
            let key = (alias === undefined) ? origin : alias;
            importMapping[String(key).trim()] = importValue;
        });
    });

    // Custom mapping is useful for overwriting and
    // import things other than components
    Object.entries(makeLiteral(mapping)).forEach(([name, value]) => {
        if (typeof value === 'string') {
            importMapping[name] = () => value;
        }
        if (typeof value === 'function') {
            importMapping[name] = () => `;let ${name} = () => { ${value()} };`;
        }
    });

    return [
        importMapping,
        componentPaths,
    ];
}

function makeLiteral(obj) {
    if (obj && obj.constructor === Object) {
        return obj;
    }
    return {};
}

function makeArray(arr) {
    if (Array.isArray(arr)) {
        return arr;
    }
    if (arr === undefined || arr === null) {
        return [];
    }
    return [arr];
}
