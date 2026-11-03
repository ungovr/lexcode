<template>
  <button @click="record">Record</button>
</template>

<script setup lang="ts">
async function record() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  return stream;
}
</script>

<style>
button { color: red; }
</style>
