# Sveltekit Autowire

> ⚠️ THIS IS STILL IN EARLY DEVELOPMENT. HERE BE DRAGONS

Despite it's "write less, do more" approach to design, sveltekit actually features a lot of boilerplate. `sveltekit-autowire` is a plugin that helps reduce that.

## Features

- 🔎 Automatically import svelte components, while keeping typescript running
- 🎁 Invisibly import stuff from modules

**Before**

```html
<script lang="ts">
  import MyButton from "$lib/ui/MyButton.svelte";
  import { onMount } from "svelte";

  onMount(() => {
    console.log("Mounted my very special Button");
  });
</script>

<MyButton text="Hello World" />
```

**After**

```html
<script lang="ts">
  onMount(()=>{
    console.log("Mounted my very special Button")
  }) 
</script>

<MyButton text="Hello World"/>

<!-- Typescript still works! -->
```

## Installation

### Adding the Plugin

First, install the package

```bash
npm i -D sveltekit-autowire
```

Then, add it to your `vite.config.js`. Make sure to add it _before_ the `sveltekit` plugin.

```javascript
import { sveltekit } from "@sveltejs/kit/vite";
import { autowire } from "sveltekit-autowire";

const config = {
  plugins: [autowire(), sveltekit()],
};
export default config;
```
The API for configuring the plugin is currently identical to `sveltekit-autoimport`. You can read the documentatiom [here](https://github.com/yuanchuan/sveltekit-autoimport). **This will change in future**


### VsCode setup

Sadly, it does not seem to be possible to tell the svelte language tools about the auto-imported components. This means that by default you will get squiggly lines under Components that are auto-imported.

You can address this, by adding `"missing-declaration" : "ignore"` to the `svelte.plugin.svelte.compilerWarnings` setting. This is an imperfect solution, as it will also ignore errors when Components really aren't defined anywhere, but this is the best we can do at the moment

## What about `sveltekit-autoimport`?

This plugin is actually a fork of the excellent [sveltekit-autoimport](https://github.com/yuanchuan/sveltekit-autoimport). I wanted to change the default configuration/import resolution, add typescript support and add intellisense support. These seemed like quite intrusive changes to someone else's project, so a fork it is.
