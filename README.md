# Sveltekit Autoimport

Did you ever have a Svelte component with a massive wall of imports at the start? This plugin solves that, by automatically detecting which Components you use, and adding imports for them.

**Before**
```html
<script lang="ts">
  import MyButton from '$lib/ui/inputs/MyButton.svelte'
</script>

<MyButton text="Hello World"/>
```

**After**
```html
<MyButton text="Hello World"/>
```

## Features
- 🔎 Automatically import components
- ☑️ Typescript support
- 🧠 Intellisense
- 📦 Zero-config defaults for SvelteKit out of the box.

## Installation
### Via Npm
This is not yet ready to be installed

### VsCode setup

Sadly, it does not seem to be possible to tell the svelte language tools about the auto-imported components. This means that by default you will get squiggly lines under Components that are auto-imported. 

You can address this, by adding `"missing-declaration" : "ignore"` to the `svelte.plugin.svelte.compilerWarnings` setting. This is an imperfect solution, as it will also ignore errors when Components really aren't defined anywhere, but this is the best we can do at the moment


## What about `sveltekit-autoimport`?
This plugin is actually a fork of the excellent [sveltekit-autoimport](https://github.com/yuanchuan/sveltekit-autoimport). I wanted to change the default configuration/import resolution, add typescript support and add intellisense support. These seemed like quite intrusive changes to someone else's project, so a fork it is.