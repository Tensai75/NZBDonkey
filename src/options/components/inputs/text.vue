<template>
  <input
    :name="settings.name"
    type="text"
    :class="['rounded', validation.valid ? '' : 'invalid']"
    v-bind:value="value"
    v-on:input="$emit('input', $event.target.value)"
  />
</template>

<script>
export default {
  props: ['value', 'settings', 'validation'],
};
</script>
