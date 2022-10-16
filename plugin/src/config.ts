import { AutoimportUserConfig } from "./autoimport/types.js";

export interface AutowireUserConfig {
    autoimport: AutoimportUserConfig | false
}