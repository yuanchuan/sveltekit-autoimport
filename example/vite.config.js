import { sveltekit } from '@sveltejs/kit/vite';
import autoImport from '../src/index.js';

export default {
  plugins: [
    autoImport({
      components: [
        './src/components',

        /* custom prefix */
        { name: './src/routes/_shared', prefix: 'Shared' },
      ],

      module: {
        svelte: ['onMount']
      },
    }),

    sveltekit()
  ]
}
