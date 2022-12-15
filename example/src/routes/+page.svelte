<p>
  <a href="/mdx">MDX page</a>
</p>

<main>

  <h1>Welcome to SvelteKit</h1>

  <p>
    <FormButton>button</FormButton>
  </p>

  <Test />

  <SharedFragment />

</main>


<script>
  onMount(() => {
    console.log('mounted');
  });
</script>

<style>
  main {
    padding: 50px;
  }
</style>
