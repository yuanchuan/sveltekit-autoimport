import autoImport from '../index.js';

export default {
  kit: {
    target: '#svelte',
    vite: {
      plugins: [

        autoImport({
          include: ['**/*.svelte'],
          components: ['./src/components'],
          module: {
            svelte: ['onMount']
          },
        })

      ]
    }
  }
};
