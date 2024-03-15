import { sveltekit } from '@sveltejs/kit/vite';
import autoImport from 'sveltekit-autoimport';

export default {
  plugins: [
    autoImport({
      components: [
        './src/components',

        /* custom prefix */
        { name: './src/_shared', prefix: 'Shared' },
      ],

      module: {
        svelte: ['onMount']
      },
    }),

    sveltekit()
  ]
}
