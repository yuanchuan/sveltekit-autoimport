import autoImport from '../src/index.js';

export default {
  kit: {
    vite: {
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
        })

      ]
    }
  }
}
