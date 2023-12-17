<template>
  <table>
    <thead>
      <tr>
        <th :hidden="fullSettings.target.allowMultipleTargets">
          {{ settings.options.defaultTarget.title }}
          <helptext
            :helptext="settings.options.defaultTarget.helptext"
          ></helptext>
        </th>
        <th
          :hidden="
            (!fullSettings.target.allowMultipleTargets &&
              !fullSettings.target.showTargetsInContextMenu) ||
            (!fullSettings.target.allowMultipleTargets && popup)
          "
          style="text-align: center; min-width: 54px"
        >
          <div>
            {{ settings.options.active.title }}
            <helptext :helptext="settings.options.active.helptext"></helptext>
          </div>
        </th>
        <th>
          <div style="text-align: center; width: 45px">
            {{ settings.options.type.title }}
            <helptext :helptext="settings.options.type.helptext"></helptext>
          </div>
        </th>
        <th style="text-align: left">
          <div>
            {{ settings.options.name.title }}
            <helptext :helptext="settings.options.name.helptext"></helptext>
          </div>
        </th>
        <th>
          <div></div>
        </th>
        <th>
          <div></div>
        </th>
      </tr>
    </thead>
    <tbody id="targets">
      <tr v-for="(item, index) in value" v-bind:key="'target-' + index">
        <td
          :hidden="fullSettings.target.allowMultipleTargets"
          style="text-align: center"
        >
          <input
            name="target-default"
            type="radio"
            data-role="radio"
            :value="index"
            v-model="fullSettings.target.defaultTarget"
          />
        </td>
        <td
          :hidden="
            (!fullSettings.target.allowMultipleTargets &&
              !fullSettings.target.showTargetsInContextMenu) ||
            (!fullSettings.target.allowMultipleTargets && popup)
          "
          style="text-align: center"
        >
          <input
            :name="'target-' + index + '-active'"
            type="checkbox"
            data-role="switch"
            v-model="value[index].active"
          />
        </td>
        <td style="text-align: center">
          <img
            :src="['/img/' + item.type + '.png']"
            data-role="hint"
            :data-hint-text="item.type"
            :alt="item.type"
            style="width: 35px !important; height: 35px !important"
          />
        </td>
        <td>
          <input
            :name="'target-' + index + '-name'"
            type="text"
            class="rounded"
            v-model="value[index].name"
            :readonly="popup"
          />
        </td>
        <td style="text-align: center">
          <button
            :hidden="popup"
            v-on:click="$emit('editTarget', index)"
            class="button primary bd-cobalt outline cycle"
          >
            <span class="mif-pencil"></span>
          </button>
        </td>
        <td style="text-align: center">
          <button
            :hidden="popup"
            v-on:click="$emit('deleteTarget', index)"
            :disabled="fullSettings.target.defaultTarget == index"
            class="button alert bd-red outline cycle"
          >
            <span class="mif-bin"></span>
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script>
import helptext from './helptext.vue';

export default {
  props: ['value', 'settings', 'validation', 'fullSettings'],
  data: function () {
    return {
      target: false,
      popup: window.NZBDONKEY_SCRIPT == 'action' ? true : false,
    };
  },
  created: function () {},
  components: {
    helptext: helptext,
  },
  methods: {},
};
</script>

<style scoped>
table {
  border-spacing: 0.5em;
  border-collapse: separate;
}
</style>
