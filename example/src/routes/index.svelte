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
