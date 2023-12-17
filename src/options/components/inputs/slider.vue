<template>
  <input
    :name="settings.name"
    type="number"
    data-role="slider"
    :data-hint-mask="settings.options.hint"
    data-hint-always="true"
    :data-value="value"
    data-show-min-max="true"
    :data-min="settings.options.min"
    :data-max="settings.options.max"
    :class="['rounded', 'percent']"
    v-on:change="$emit('input', Number($event.target.value))"
  />
</template>

<script>
export default {
  props: ['value', 'settings', 'validation'],
};
</script>
