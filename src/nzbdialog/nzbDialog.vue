<template>
  <ValidationObserver immediate v-slot="{ invalid }" tag="div" class="dialog">
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
        <label for="title">Titel</label>
        <ValidationProvider
          immediate
          rules="required"
          v-slot="validation"
          tag="span"
          class="w-100"
        >
          <input
            v-model="title"
            name="title"
            type="text"
            :class="['rounded', validation.valid ? '' : 'invalid']"
          />
          <span class="invalid_feedback" :hidden="!validation.valid">
            {{ validation.errors[0] }}
          </span>
        </ValidationProvider>
      </div>
      <!-- div class="row cell-12 w-100">
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
      </div -->
      <div class="row cell-12 w-100">
        <label for="password">Password</label>
        <input v-model="password" name="password" type="text" class="rounded" />
      </div>
      <!-- div v-if="selection" class="row cell-12 w-100">
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
      </div -->
      <div v-if="targets" class="row cell-12">
        <label for="target">NZB-Datei Ziel</label>
        <select v-model="target" name="target" class="rounded">
          <option v-for="(targ, key) in targets" v-bind:key="key" :value="key">
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
    <div class="dialog-actions d-flex flex-justify-between">
      <button v-on:click="send(true)" class="button secondary outline rounded">
        Abbrechen
      </button>
      <button
        v-on:click="send()"
        class="button primary rounded"
        v-bind:disabled="invalid"
      >
        Send to Target
      </button>
    </div>
  </ValidationObserver>
</template>

<script>
import debugLog from '../logger/debugLog.js';
import settings from '../settings/settings.js';
import categories from '../categories/functions.js';
export default {
  components: {},
  data: function () {
    return {
      settings: settings.get(),
      portName: false,
      port: false,
      windowId: false,
      title: '',
      password: '',
      target: '',
      category: '',
      targets: false,
      categories: false,
      icon: '/icons/NZBDonkey_32.png',
      selection: false,
    };
  },
  created: async function () {
    let window = await browser.windows.getCurrent();
    this.windowId = window.id;
    // open a port to the background script and tell it we are ready...
    this.portName = 'nzbDialog_' + this.windowId;
    this.port = browser.runtime.connect({ name: this.portName });
    const listener = function (request) {
      if (request.nzb && request.windowId === this.windowId) {
        this.title = request.nzb.title ? request.nzb.title : '';
        this.password = request.nzb.password ? request.nzb.password : '';
        this.target = request.nzb.target
          ? request.nzb.target
          : this.settings.target.defaultTarget;
        this.setCategories(this.target);
        setInterval(async () => {
          let focusedWindow = await browser.windows.getLastFocused();
          if (focusedWindow.id != this.windowId) {
            browser.windows.update(this.windowId, {
              focused: true,
              drawAttention: true,
            });
          }
        }, 5000);
      }
    };
    const boundListener = listener.bind(this);
    this.port.onMessage.addListener(boundListener);
    this.port.postMessage({
      ready: true,
      windowId: this.windowId,
    });
    if (
      this.settings.target.allowMultipleTargets ||
      this.settings.target.showTargetsInContextMenu
    ) {
      this.targets = this.settings.target.targets.filter(function (target) {
        return target.active;
      });
    }
  },
  watch: {
    target: {
      handler: function (value) {
        this.setCategories(value);
      },
    },
    title: {
      handler: function () {
        this.setCategory();
      },
    },
  },
  methods: {
    send: function (abort = false) {
      this.port.postMessage({
        nzb: abort
          ? false
          : {
              title: this.title,
              password: this.password,
              target: this.target,
              category: this.category,
            },
        windowId: this.windowId,
      });
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
};
</script>

<style>
html,
body,
.dialog,
.dialog-content,
.content {
  width: 100%;
  height: 100%;
  min-width: 100%;
}
.dialog {
  min-height: 100%;
}
.dialog-content {
  max-height: 100%;
  overflow: auto;
}
</style>
