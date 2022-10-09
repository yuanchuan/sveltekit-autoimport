import { existsSync, statSync, readdirSync } from 'fs';
import path from 'path';

/**
 * Recursively walkt through the filesystem from the given root path, and call the callback on all files that match the given filter function
 * @param root - The filesystem path from which to start
 * @param filter - A function to determine if a file should be matched or not
 * @param callback - The callback to be called with all files that match the filter
 * @returns 
 */
 export function traverse(root: string, filter: (arg0: string) => boolean, callback: (filename: string) => any): false | string {
    if (!existsSync(root)) {
      return false; //The given root path does not exist
    }
  
    if (statSync(root).isFile()) {
      return root; // The root path is the component
    }
    if (!statSync(root).isDirectory()) {
      return false; //The root is not a directory and can't be traversed any further
    }
  
    //Recursively call travesrse, and call the callback on all files that match the filter
    for (let dir of readdirSync(root)) {
      dir = path.join(root, dir);
      let stat = statSync(dir);
      if (stat.isDirectory()) {
        traverse(dir, filter, callback);
      } else if (stat.isFile() && filter(dir)) {
        callback(dir);
      }
    }
  }