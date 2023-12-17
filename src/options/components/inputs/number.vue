<template>
  <input
    :name="settings.name"
    type="number"
    min="1"
    :class="['rounded', validation.valid ? '' : 'invalid']"
    v-bind:value="value"
    v-on:input="$emit('input', Number($event.target.value))"
  />
</template>

<script>
export default {
  props: ['value', 'settings', 'validation'],
};
</script>
