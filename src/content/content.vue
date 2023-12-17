<template>
  <div v-if="showDialog" id="analyseSelectionDialog">
    <i-frame class="nzbdoneky_iframe">
      <i-frame-content>
        <ValidationObserver
          immediate
          v-slot="{ invalid }"
          tag="div"
          class="dialog"
        >
          <div class="dialog-title">
            <img
              :src="icon"
              title="NZBDonkey"
              style="
                width: 32px !important;
                height: 32px !important;
                display: inline-block;
                margin-right: 10px;
              "
            />NZBDonkey
          </div>
          <div class="dialog-content">
            <div class="row cell-12 w-100">
              <label for="title">Title</label>
              <input v-model="title" name="title" type="text" class="rounded" />
            </div>
            <div class="row cell-12 w-100">
              <label for="header">Header</label>
              <ValidationProvider
                immediate
                rules="required"
                v-slot="validation"
                tag="span"
                class="w-100"
              >
                <input
                  v-model="header"
                  name="header"
                  type="text"
                  :class="['rounded', validation.valid ? '' : 'invalid']"
                />
                <span class="invalid_feedback" :hidden="!validation.valid">
                  {{ validation.errors[0] }}
                </span>
              </ValidationProvider>
            </div>
            <div class="row cell-12 w-100">
              <label for="password">Password</label>
              <input
                v-model="password"
                name="password"
                type="text"
                class="rounded"
              />
            </div>
            <div v-if="selection" class="row cell-12 w-100">
              <label for="selection">Selektierter Text</label>
              <textarea
                v-model="selection"
                name="selection"
                rows="5"
                class="rounded"
                style="max-width: 100%"
                readonly
              >
              </textarea>
            </div>
            <div v-if="targets" class="row cell-12">
              <label for="target">NZB-Datei Ziel</label>
              <select v-model="target" name="target" class="rounded">
                <option
                  v-for="(targ, key) in targets"
                  v-bind:key="key"
                  :value="key"
                >
                  {{ targ.name }}
                </option>
              </select>
            </div>
            <div v-if="categories && categories.length > 0" class="row cell-12">
              <label for="category">Kategorie</label>
              <select v-model="category" name="category" class="rounded">
                <option value="">Keine Kategorie</option>
                <option
                  v-for="(cat, key) in categories"
                  v-bind:key="key"
                  :value="cat.name"
                >
                  {{ cat.name }}
                </option>
              </select>
            </div>
          </div>
          <div class="dialog-actions">
            <button v-on:click="close" class="button secondary outline rounded">
              Abbrechen
            </button>
            <button
              v-on:click="submit"
              class="button primary rounded"
              v-bind:disabled="invalid"
            >
              NZB-Datei suchen
            </button>
          </div>
        </ValidationObserver>
      </i-frame-content>
    </i-frame>
  </div>
</template>

<script>
import iFrame from './iframe.vue';
import iFrameContent from './iframecontent.vue';
import debugLog from '../logger/debugLog.js';
import categories from '../categories/functions.js';
export default {
  name: 'App',
  props: ['settings', 'selection', 'header', 'password', 'title'],
  data: function () {
    return {
      category: false,
      categories: false,
      target: false,
      targets: false,
      showDialog: false,
      icon: browser.runtime.getURL('/icons/NZBDonkey_32.png'),
    };
  },
  created: function () {
    if (
      this.settings.target.allowMultipleTargets ||
      this.settings.target.showTargetsInContextMenu
    ) {
      this.targets = this.settings.target.targets.filter(function (target) {
        return target.active;
      });
    }
    this.target = this.settings.target.defaultTarget;
    this.setCategories(this.target);
    this.showDialog = true;
  },
  methods: {
    close: function () {
      debugLog.info(
        `Popup for text selection analysis was closed on: ${window.location.href}`
      )();
      this.showDialog = false;
    },
    submit: function () {
      debugLog.info(
        `Information from text selection analysis was sent to background script on: ${window.location.href}`
      )();
      browser.runtime.sendMessage({
        action: 'doTheDonkey',
        header: this.header,
        title: this.title,
        password: this.password,
        category: this.category,
        target: this.target,
        source: location.href,
      });
      this.showDialog = false;
    },
    setCategories: function (target = this.target) {
      this.categories = categories.getCategories(target);
      this.setCategory();
    },
    setCategory: async function () {
      if (this.categories) {
        const category = await categories.getCategory(
          this.target,
          this.title,
          false
        );
        this.category = category ? category : '';
      }
    },
  },
  components: {
    iFrame: iFrame,
    iFrameContent: iFrameContent,
  },
  watch: {
    target: {
      handler(value) {
        this.setCategories(value);
        this.setCategory();
      },
    },
    title: {
      handler(value) {
        this.setCategory();
      },
    },
  },
};
</script>

<style>
#analyseSelectionDialog {
  margin: 0;
  padding: 0;
  border: 0;
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 3000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.nzbdoneky_iframe {
  min-height: 660px;
  max-height: 100%;
  max-width: 100%;
  width: 640px;
  border: 1px solid #0066f2;
  border-radius: 0.25rem !important;
}
</style>
