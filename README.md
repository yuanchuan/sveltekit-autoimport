# vite-plugin-autoimport

![Build Status](https://github.com/yuanchuan/vite-plugin-autoimport/actions/workflows/ci.yml/badge.svg)

Automatically detect and import components/modules for <a href="https://kit.svelte.dev/">SvelteKit</a> projects.

### Before

<img src="screenshots/before.png" alt="Code without vite-plugin-autoimport" />

### After

<img src="screenshots/after.png" alt="Code with vite-plugin-autoimport"/>


## Installation

```bash
npm i -D vite-plugin-autoimport
```

## Basic configuration

```js
// svelte.config.js

import autoImport from 'vite-plugin-autoimport';

export default {
  kit: {
    vite: {
      plugins: [
        autoImport({
          components: ['./src/components'],
        })
      ]
    }
  }
}
```

It can be used as a preprocessor to transform code before other modules like `mdsvex`.

```js
import autoImport from 'vite-plugin-autoimport';
import { mdsvex } from 'mdsvex';

export default {
  preprocess: [
    autoImport({
      components: ['./src/components'],
      include: ['**/*.(svelte|md)'],
    }),
    mdsvex()
  ],
  kit: {}
}
```

## Name strategy

By default the component names will be **namespaced** with their directory names and
then normalized to **upper camel case** format. For example:

```html
<MyComponent />
<!-- my-component.svelte -->

<MyAnotherComponent />
<!-- my_another_component.svelte -->

<FormInput />
<!-- form/input.svelte -->

<Modal />
<!-- modal/index.svelte -->
```

## Prefix

All components can be prefixed with a given name.

```js
autoImport({
  components: [{ name: './src/components', prefix: 'shared' } ],
})
```

So that

```html
<SharedComponent />
<!-- component.svelte -->

<SharedFormInput />
<!-- form/input.svelte -->
```

## Flat

If the `flat` option is set to be true, no namespace will be added.

```js
autoImport({
  components: [{ name: './src/components', flat: true } ],
})
```

So that

```html
<Input />
<!-- form/input.svelte -->

<Popup />
<!-- modal/inline/popup.svelte -->

```

## Full options

```js
// svelte.config.js
import autoImport from 'vite-plugin-autoimport';

export default {
  kit: {
    vite: {
      plugins: [
        autoImport({

          // where to search for the components
          components: [
            './src/components',
            './src/routes/_fragments',
            { name: './src/lib', flat: true, prefix: 'lib' },
          ],

          // some frequently used modules
          module: {
            svelte: ['onMount', 'createEventDispatcher']
          },

          // manually import
          mapping: {
            API:  `import API from '~/src/api'`,
            Icon: `import * as Icon from '$components/icon'`,
          },

          // autoimport only for .svelte files
          // and only search for .svelte files inside components
          include: ['**/*.svelte'],

          // node_modules is ignored by default
          exclude: ['**/node_modules/**'],

        })
      ]
    }
  }
}
```
