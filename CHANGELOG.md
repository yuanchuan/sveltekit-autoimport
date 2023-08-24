## 1.7.1

* Add sveltekit as peer dependency (#35)


## 1.7.0

* Support reading transition, animation, and action names.
* Print parse error in detail.


## 1.6.10

* Add extra line for injected script tag.

## 1.6.9

* Update docs and example.
* Remove jsDoc comments.

## 1.6.8

* Fix reading root path for SK >= next.347

## 1.6.7

* Pass `filename` to preprocess function. (#20)

## 1.6.6

* Fix preprocess detection. It might not always be array. (#18)


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
