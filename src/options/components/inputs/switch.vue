<template>
  <div class="w-100">
    <label class="switch transition-on">
      <input
        :name="settings.name"
        type="checkbox"
        :class="[validation.valid ? '' : 'invalid']"
        data-role="switch"
        data-role-switch="true"
        :data-caption="settings.caption"
        v-bind:checked="value"
        v-on:change="$emit('input', $event.target.checked)"
      />
      <span class="check"></span>
      <span class="caption">{{ settings.caption }}</span>
    </label>
  </div>
</template>

<script>
export default {
  props: ['value', 'settings', 'validation'],
};
</script>
