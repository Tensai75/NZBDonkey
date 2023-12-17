<template>
  <table style="width: 100%; min-width: 100%; max-width: 100%">
    <thead>
      <tr>
        <th v-if="fullSettings.settings.categories.type == 'automatic'"></th>
        <th
          v-show="
            fullSettings.settings.categories.type == 'manual' ||
            (fullSettings.settings.categories.type == 'automatic' &&
              fullSettings.settings.categories.fallbackType == 'manual')
          "
          style="
            text-align: center;
            width: 80px;
            min-width: 80px;
            max-width: 80px;
          "
        >
          <div>
            {{ settings.options.active.title }}
            <helptext :helptext="settings.options.active.helptext"></helptext>
          </div>
        </th>
        <th
          v-show="
            fullSettings.settings.categories.type == 'default' ||
            (fullSettings.settings.categories.type == 'automatic' &&
              fullSettings.settings.categories.fallbackType == 'default')
          "
          style="
            text-align: center;
            width: 100px;
            min-width: 100px;
            max-width: 100px;
          "
        >
          <div>
            {{ settings.options.defaultCategory.title }}
            <helptext
              :helptext="settings.options.defaultCategory.helptext"
            ></helptext>
          </div>
        </th>
        <th style="text-align: left; width: 100%">
          {{ settings.options.name.title }}
          <helptext :helptext="settings.options.name.helptext"></helptext>
        </th>
        <th
          v-if="fullSettings.settings.categories.type == 'automatic'"
          style="
            text-align: left;
            width: 100%;
            min-width: 350px;
            max-width: 500px;
          "
        >
          {{ settings.options.regex.title }}
          <helptext :helptext="settings.options.regex.helptext"></helptext>
        </th>
        <th
          v-if="!targets[fullSettings.type].hasTargetCategories"
          style="
            text-align: left;
            width: 36px;
            min-width: 36px;
            max-width: 36px;
          "
        >
          <div></div>
        </th>
      </tr>
    </thead>
    <draggable
      v-model="inputValue"
      tag="tbody"
      id="categories"
      v-on:start="onDragStart()"
      v-on:end="onDragEnd($event)"
    >
      <tr v-for="(item, index) in value" v-bind:key="'category-' + index">
        <td v-show="fullSettings.settings.categories.type == 'automatic'">
          <div
            class="mif-unfold-more bold dragger border rounded outline primary"
            :title="draggerHelptext"
          ></div>
        </td>
        <td
          v-show="
            fullSettings.settings.categories.type == 'manual' ||
            (fullSettings.settings.categories.type == 'automatic' &&
              fullSettings.settings.categories.fallbackType == 'manual')
          "
          style="text-align: center"
        >
          <input
            :name="'category-' + index + '-active'"
            type="checkbox"
            data-role="switch"
            v-model="value[index].active"
            v-on:input="$emit('input', value)"
          />
        </td>
        <td
          v-show="
            fullSettings.settings.categories.type == 'default' ||
            (fullSettings.settings.categories.type == 'automatic' &&
              fullSettings.settings.categories.fallbackType == 'default')
          "
          style="text-align: center"
        >
          <ValidationProvider
            :rules="
              fullSettings.settings.categories.type == 'default' ||
              (fullSettings.settings.categories.type == 'automatic' &&
                fullSettings.settings.categories.fallbackType == 'default')
                ? { required: true }
                : {}
            "
            immediate
            v-slot="validation"
            vid="category-default"
            tag="span"
          >
            <label
              :class="[
                'radio',
                'transition-onvalid',
                validation.valid ? '' : 'invalid',
              ]"
            >
              <input
                name="category-default"
                type="radio"
                data-role="radio"
                data-role-radio="true"
                :class="[validation.valid == true ? '' : 'invalid']"
                :value="index"
                v-model="fullSettings.settings.categories.defaultCategory"
              />
              <span class="check"></span>
              <span class="caption"></span>
            </label>
          </ValidationProvider>
        </td>
        <td style="white-space: nowrap; width: 35%">
          <ValidationProvider
            :rules="
              !targets[fullSettings.type].hasTargetCategories
                ? { required: true }
                : {}
            "
            immediate
            v-slot="validation"
            tag="span"
            class="nameinput"
          >
            <input
              :name="'category-' + index + '-name'"
              type="text"
              :class="[
                'rounded',
                validation.valid ? '' : ['invalid', 'pr-8'],
                'inline',
              ]"
              :readonly="targets[fullSettings.type].hasTargetCategories"
              v-on:focus="blur(targets[fullSettings.type].hasTargetCategories)"
              v-model="value[index].name"
              v-on:input="$emit('input', value)"
            />
            <span
              v-if="!validation.valid"
              class="mif-warning p-1 warningicon"
              data-role="popover"
              data-cls-popover="rounded drop-shadow alert outline"
              :data-popover-text="validation.errors[0]"
              data-popover-hide="0"
              data-close-button="false"
              data-hide-on-leave="true"
              style="cursor: pointer"
            ></span>
          </ValidationProvider>
        </td>
        <td
          v-show="fullSettings.settings.categories.type == 'automatic'"
          style="white-space: nowrap; width: 65%"
        >
          <select
            class="rounded regexSelect"
            style="
              display: inline-block;
              width: auto;
              line-height: 1.5;
              width: 30%;
            "
            v-model="value[index].type"
            v-on:input="
              value[index].regex =
                defaultSettings.regex[$event.target.value].regex
            "
          >
            <option
              v-for="(item, key) in defaultSettings.regex"
              :key="'regex-' + key"
              :value="key"
              v-html="item.name"
            ></option>
          </select>
          <ValidationProvider
            :rules="
              fullSettings.settings.categories.type == 'automatic' &&
              value[index].type == 'own'
                ? { required: true, regex: true }
                : ''
            "
            immediate
            v-slot="validation"
            tag="span"
            class="regexinput"
          >
            <input
              :name="'category-' + index + '-name'"
              type="text"
              :class="[
                'rounded',
                validation.valid ? '' : ['invalid', 'pr-8'],
                'regex',
              ]"
              :disabled="!(value[index].type == 'own')"
              v-model="value[index].regex"
              style="display: inline-block; width: 70%"
            />
            <span
              v-if="!validation.valid"
              class="mif-warning p-1 warningicon"
              data-role="popover"
              data-cls-popover="rounded drop-shadow alert outline"
              :data-popover-text="validation.errors[0]"
              data-popover-hide="0"
              data-close-button="false"
              data-hide-on-leave="true"
              style="cursor: pointer"
            ></span>
          </ValidationProvider>
        </td>
        <td
          v-if="!targets[fullSettings.type].hasTargetCategories"
          style="text-align: center"
        >
          <button
            v-if="value.length > 1"
            v-on:click="deleteCategory(index)"
            class="button alert bd-red outline cycle"
          >
            <span class="mif-bin"></span>
          </button>
        </td>
      </tr>
    </draggable>
    <tr slot="footer">
      <th v-if="fullSettings.settings.categories.type == 'automatic'"></th>
      <th
        v-show="
          fullSettings.settings.categories.type == 'manual' ||
          (fullSettings.settings.categories.type == 'automatic' &&
            fullSettings.settings.categories.fallbackType == 'manual')
        "
      ></th>
      <th
        v-show="
          fullSettings.settings.categories.type == 'default' ||
          (fullSettings.settings.categories.type == 'automatic' &&
            fullSettings.settings.categories.fallbackType == 'default')
        "
      ></th>
      <th style="text-align: left; width: 100%"></th>
      <th v-if="fullSettings.settings.categories.type == 'automatic'"></th>
      <th
        v-if="!targets[fullSettings.type].hasTargetCategories"
        style="text-align: left; width: 36px; min-width: 36px; max-width: 36px"
      >
        <button
          v-on:click="addCategory()"
          class="button secondary outline cycle"
        >
          <span class="mif-add"></span>
        </button>
      </th>
    </tr>
  </table>
</template>

<script>
import draggable from 'vuedraggable';
import helptext from './helptext.vue';
import { targets } from '../../../targets/index.js';
import defaultSettings from '../../../categories/defaultSettings.js';

export default {
  props: ['value', 'settings', 'validation', 'fullSettings'],
  data: function () {
    return {
      draggerHelptext: 'Gedrückt halten zum Verschieben.',
      defaultSettings: defaultSettings,
      targets: targets,
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
  created: function () {
    this.$emit('input', [...this.value]);
  },
  components: {
    helptext: helptext,
    draggable: draggable,
  },
  methods: {
    blur: function (blur = true) {
      if (blur) {
        this.$emit('blur');
      }
    },
    onDragStart() {},
    onDragEnd: function (event) {
      if (
        this.fullSettings.settings.categories.defaultCategory == event.oldIndex
      ) {
        this.fullSettings.settings.categories.defaultCategory = event.newIndex;
      } else if (
        event.newIndex >=
          this.fullSettings.settings.categories.defaultCategory &&
        this.fullSettings.settings.categories.defaultCategory > event.oldIndex
      ) {
        this.fullSettings.settings.categories.defaultCategory -= 1;
      } else if (
        event.newIndex <=
          this.fullSettings.settings.categories.defaultCategory &&
        this.fullSettings.settings.categories.defaultCategory < event.oldIndex
      ) {
        this.fullSettings.settings.categories.defaultCategory += 1;
      }
    },
    deleteCategory: function (index) {
      this.blur();
      this.inputValue.splice(index, 1);
    },
    addCategory: function () {
      this.blur();
      this.inputValue.push({
        active: true,
        name: '',
        type: 'none',
        regex: '',
        isTargetCategory: false,
      });
    },
  },
};
</script>

<style scoped>
table {
  border-spacing: 0.5em;
  border-collapse: separate;
}
.dragger {
  padding: 5px 10px;
  cursor: move; /* fallback if grab cursor is unsupported */
  cursor: -moz-grab;
  cursor: -webkit-grab;
  cursor: grab;
}
.invalid span.check {
  border-color: #ce352c !important;
}
.regexSelect {
  border-right: none !important;
  border-top-right-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
}
.regex,
.regex.invalid {
  border-left: none !important;
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
}
.nameinput span,
.regexinput span {
  position: relative;
}
.warningicon {
  right: 30px;
  color: #ce352c !important;
}
.inline {
  display: inline;
}
</style>
