## 1.6.5

* Impove docs. (#15)
* Rename to sveltekit-autoimport. (#14)
* Support alias for modules. [028f0e](https://github.com/yuanchuan/sveltekit-autoimport/commit/028f0e948307aa8db3547f5fd47b7b49ff849fb1)
  ```js
  module: {
    svelte: ['onMount as mount']
  }
  ```

## 1.6.4

* Skip for declared variables.
* Ignore `.svelte-kit` and other directories.

## 1.6.3

* Inject script at newline.
* Add the missing generated source map.
