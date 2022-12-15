import { mdsvex } from 'mdsvex';
import preprocess from 'svelte-preprocess';

export default {
  extensions: ['.svelte', '.md'],
  preprocess: [
    mdsvex({ extensions: ['.md'] }),
  ],
  prerender: {
    default: true
  }
}
