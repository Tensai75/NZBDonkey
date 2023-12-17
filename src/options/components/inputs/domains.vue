<template>
  <table>
    <thead>
      <tr>
        <th style="text-align: center; min-width: 54px">
          <div>
            {{ settings.options.active.title }}
            <helptext :helptext="settings.options.active.helptext"></helptext>
          </div>
        </th>
        <th>
          {{ settings.options.domain.title }}
          <helptext :helptext="settings.options.domain.helptext"></helptext>
        </th>
        <th>
          <div></div>
        </th>
        <th>
          <div></div>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(item, index) in value" v-bind:key="'domain-' + index">
        <td style="text-align: center">
          <input
            :name="'domain-' + index + '-active'"
            type="checkbox"
            data-role="switch"
            v-model="value[index].active"
          />
        </td>
        <td>
          <input
            :name="'domain-' + index + '-name'"
            type="text"
            class="rounded"
            :readonly="value[index].isDefault || popup"
            v-on:focus="$emit('blur')"
            v-model="value[index].domain"
          />
        </td>
        <td style="text-align: center">
          <button
            :hidden="popup"
            v-if="!value[index].isDefault"
            v-on:click="$emit('editDomain', index)"
            class="button primary bd-cobalt outline cycle"
          >
            <span class="mif-pencil"></span>
          </button>
        </td>
        <td style="text-align: center">
          <button
            :hidden="popup"
            v-if="!value[index].isDefault"
            v-on:click="$emit('deleteDomain', index)"
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
      domain: false,
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
