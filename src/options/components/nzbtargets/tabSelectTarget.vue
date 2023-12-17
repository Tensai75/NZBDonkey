<template>
  <div style="display: contents">
    <div
      class="dialog-content"
      style="min-height: 60vh; max-height: 60vh; overflow: auto"
    >
      <div
        class="row border bd-cobalt rounded mt-2 mb-2 c-pointer"
        v-for="(item, name) in targets"
        v-on:click="$emit('input', name)"
        v-bind:key="name"
      >
        <div class="cell-1">
          <input
            name="nzbTargetType"
            type="radio"
            data-role="radio"
            :checked="name == value"
            v-bind:value="name"
            v-on:input="$emit('input', $event.target.value)"
          />
        </div>
        <div class="cell-2 text-center">
          <img
            :src="['/img/' + name + '.png']"
            style="width: 35px !important; height: 35px !important"
            :title="item.name"
          />
        </div>
        <div class="cell mt-auto mb-auto">
          {{ item.description }}
        </div>
      </div>
    </div>
    <div class="dialog-actions d-flex flex-justify-between">
      <button
        v-on:click="$emit('close')"
        class="button secondary outline rounded"
      >
        Abbrechen
      </button>
      <button
        v-on:click="$emit('next')"
        v-bind:disabled="value === ''"
        class="button primary rounded"
      >
        Weiter
      </button>
    </div>
  </div>
</template>

<script>
import { targets } from '../../../targets/index.js';

export default {
  props: ['value'],
  data: function () {
    return {
      targets: targets,
    };
  },
  created: function () {},
  components: {},
};
</script>
