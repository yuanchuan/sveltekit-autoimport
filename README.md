# sveltekit-autoimport

![Build Status](https://github.com/yuanchuan/sveltekit-autoimport/actions/workflows/ci.yml/badge.svg)

Automatically detect and import components/modules for <a href="https://kit.svelte.dev/">SvelteKit</a> projects.

### Before

<img src="screenshots/before.png" alt="Code without sveltekit-autoimport" />

### After

<img src="screenshots/after.png" alt="Code with sveltekit-autoimport"/>


## Installation

```bash
npm i -D sveltekit-autoimport
```

## Basic configuration

Inside `svelte.config.js`.

```js
/* As vite plugin (recommended) */

import autoImport from 'sveltekit-autoimport';

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

```js
/* Or as a svelte preprocessor for some special modules */

import autoImport from 'sveltekit-autoimport';
import { mdsvex } from 'mdsvex';

export default {
  kit: {},
  preprocess: [
    autoImport({
      components: ['./src/components'],
      include: ['**/*.(svelte|md)'],
    }),
    /* order matters */
    mdsvex()
  ]
}
```

## How it works?

This tool will **NOT** add global components blindly into your files,
instead, it searches for **undefined** components or modules,
and then try to fix them by auto importing.

#### You need to guide it where to import the components from:

```js
autoImport({
  components: ['./src/components']
})
```

#### Or tell it how to import for some specific variables:

```js
autoImport({
  mapping: {
    API: `import API from '~/api/api.js'`,
    MY_FUNCTION: `import MY_FUNCTION from 'lib/my-function'`
  }
})
```

#### Or explictly list the components being used from a third party module:

```js
autoImport({
  module: {
    'carbon-components-svelte': [
      'Button',
      'Accordion',
      'AccordionItem',
      'Grid as CarbonGrid', /* rename */
    ]
  }
})
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

Components can be prefixed with a given name.

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
import autoImport from 'sveltekit-autoimport';

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
