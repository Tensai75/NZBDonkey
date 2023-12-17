<template>
  <span>
    <div
      v-for="option in settings.options"
      v-bind:key="settings.name + '-' + option.value"
    >
      <label class="radio transition-on">
        <input
          :name="settings.name"
          type="radio"
          data-role="radio"
          :data-caption="option.text"
          data-role-radio="true"
          :class="[validation.valid ? '' : 'invalid']"
          :value="option.value"
          :checked="option.value == value"
          v-on:change="
            $emit(
              'input',
              $event.target.value == 'true'
                ? true
                : $event.target.value == 'false'
                ? false
                : $event.target.value
            )
          "
        />
        <span class="check"></span>
        <span class="caption">
          {{ option.text }}
          <span
            v-if="option.helptext"
            class="mif-question p-1"
            data-role="popover"
            data-cls-popover="rounded drop-shadow"
            :data-popover-text="option.helptext"
            data-popover-hide="0"
            data-close-button="false"
            data-hide-on-leave="true"
            style="cursor: pointer"
          ></span>
        </span>
      </label>
    </div>
  </span>
</template>

<script>
export default {
  props: ['value', 'settings', 'validation'],
  created: function () {},
};
</script>
