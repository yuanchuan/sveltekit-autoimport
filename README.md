# Sveltekit Autowire

> ⚠️ THIS IS NOT YET READY TO USE

Despite it's "write less, do more" approach to design, sveltekit actually features a lot of boilerplate. `sveltekit-autowire` is a plugin that helps reduce that.

## Features

- 🔎 Automatically import unambiguous components (with intellisense and types)
- 🔮 Automatically add common sveltekit types
- ☑️ `data` and `form` available by default
- 📦 Zero-config defaults for SvelteKit out of the box.

**Before**

```html
<script lang="ts">
  import MyInput from "$lib/ui/inputs/MyInput.svelte";
  import type { FormData } from "./$types";

  export let form: FormData;
</script>

<MyInput text="Hello World" showHelpertext="{form.missingValue}" />
```

**After**

```html
<MyInput text="Hello World" showHelpertext="{form.missingValue}" />
```

## Installation

### Adding the Plugin

First, install the package

```bash
npm i -D sveltekit-autowire
```

Then, add it to your `vite.config.js`. Make sure to add it _before_ the `sveltekit` plugin.

```javascript
import { sveltekit } from '@sveltejs/kit'
import { autowire } from 'sveltekit-autowire'

const config = {
	plugins: [autowire(), sveltekit()]
};
export const config
```

### VsCode setup

Sadly, it does not seem to be possible to tell the svelte language tools about the auto-imported components. This means that by default you will get squiggly lines under Components that are auto-imported.

You can address this, by adding `"missing-declaration" : "ignore"` to the `svelte.plugin.svelte.compilerWarnings` setting. This is an imperfect solution, as it will also ignore errors when Components really aren't defined anywhere, but this is the best we can do at the moment

## What about `sveltekit-autoimport`?

This plugin is actually a fork of the excellent [sveltekit-autoimport](https://github.com/yuanchuan/sveltekit-autoimport). I wanted to change the default configuration/import resolution, add typescript support and add intellisense support. These seemed like quite intrusive changes to someone else's project, so a fork it is.
