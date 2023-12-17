<template>
  <table>
    <thead>
      <tr>
        <th v-if="fullSettings.searchengines.searchOrder == 'sequential'"></th>
        <th style="text-align: center; min-width: 54px">
          <div>
            {{ settings.options.active.title }}
            <helptext :helptext="settings.options.active.helptext"></helptext>
          </div>
        </th>
        <th>
          {{ settings.options.name.title }}
          <helptext :helptext="settings.options.name.helptext"></helptext>
        </th>
        <th>
          <div></div>
        </th>
        <th>
          <div></div>
        </th>
      </tr>
    </thead>
    <draggable v-model="inputValue" tag="tbody" id="engines">
      <tr v-for="(item, index) in value" v-bind:key="'engine-' + index">
        <td v-if="fullSettings.searchengines.searchOrder == 'sequential'">
          <div
            class="mif-unfold-more bold dragger border rounded outline primary"
            :title="draggerHelptext"
          ></div>
        </td>
        <td style="text-align: center">
          <input
            :name="'engine-' + index + '-active'"
            type="checkbox"
            data-role="switch"
            v-model="value[index].active"
          />
        </td>
        <td>
          <input
            :name="'engine-' + index + '-name'"
            type="text"
            class="rounded"
            :readonly="value[index].isDefault"
            v-on:focus="$emit('blur')"
            v-model="value[index].name"
          />
        </td>
        <td style="text-align: center">
          <button
            :hidden="popup"
            v-if="!value[index].isDefault"
            v-on:click="$emit('editEngine', index)"
            class="button primary bd-cobalt outline cycle"
          >
            <span class="mif-pencil"></span>
          </button>
        </td>
        <td style="text-align: center">
          <button
            :hidden="popup"
            v-if="!value[index].isDefault"
            v-on:click="$emit('deleteEngine', index)"
            class="button alert bd-red outline cycle"
          >
            <span class="mif-bin"></span>
          </button>
        </td>
      </tr>
    </draggable>
  </table>
</template>

<script>
import draggable from 'vuedraggable';
import helptext from './helptext.vue';

export default {
  props: ['value', 'settings', 'validation', 'fullSettings'],
  data: function () {
    return {
      engine: false,
      draggerHelptext: 'Gedrückt halten zum Verschieben.',
      popup: window.NZBDONKEY_SCRIPT == 'action' ? true : false,
    };
  },
  computed: {
    inputValue: {
      get: function () {
        return this.value;
      },
      set: function (value) {
        this.$emit('input', value);
      },
    },
  },
  created: function () {},
  components: {
    helptext: helptext,
    draggable: draggable,
  },
  methods: {},
};
</script>

<style scoped>
table {
  border-spacing: 0.5em;
  border-collapse: separate;
}
.dragger {
  cursor: pointer;
  padding: 5px 10px;
}
</style>
