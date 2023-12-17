<template>
  <select
    :name="settings.name"
    :class="['rounded', validation.valid ? '' : 'invalid']"
    v-bind:value="value"
    v-on:input="
      $emit(
        'input',
        $event.target.value == 'true'
          ? true
          : $event.target.value == 'false'
          ? false
          : $event.target.value
      )
    "
  >
    <option
      v-for="option in settings.options"
      :value="option.value"
      :key="settings.name + '-' + option.value"
    >
      {{ option.text }}
    </option>
  </select>
</template>

<script>
export default {
  props: ['value', 'settings', 'validation'],
};
</script>
