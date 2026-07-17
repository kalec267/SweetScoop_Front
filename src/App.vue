<template>
    <div id="app-container">
        <RouterView />
    </div>
</template>

<script setup>
import { RouterView } from "vue-router";
</script>

<style>
#app-container {
    width: 100%;
    min-height: 100vh;
    margin: 0;
    padding: 0;
}
</style>