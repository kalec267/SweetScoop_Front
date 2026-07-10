<template>
  <div id="app">
    <nav style="padding: 15px; background: #1f2028; border-bottom: 1px solid var(--border); text-align: left;">
      <router-link to="/inventory" style="color: var(--accent); text-decoration: none; font-weight: bold;">
        Store Inventory Management
      </router-link>
    </nav>

    <main style="flex-grow: 1;">
      <RouterView />
    </main>
  </div>
</template>

<script setup>

</script>

<style scoped>
main {
  background: var(--bg);
}
</style>