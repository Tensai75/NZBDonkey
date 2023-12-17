<template>
  <div class="dialog">
    <div class="dialog-title">
      <img
        src="/icons/NZBDonkey_32.png"
        style="width: 32px; height: 32px; margin: -5px 10px 0px 0px"
      />Category Selection
    </div>
    <div class="dialog-content">
      <div
        v-if="!title"
        class="content d-flex flex-align-center flex-justify-center"
      >
        <img src="/img/loader.gif" />
      </div>

      <div v-if="title" class="content">
        <div class="row cell-12">
          <h6 class="mt-0" style="overflow-wrap: anywhere">
            {{ title }}
          </h6>
        </div>
        <table class="row cell-12">
          <template v-for="(category, index) in categories">
            <tr
              v-if="category.active"
              v-bind:key="index"
              v-on:click="send(category.name)"
              class="grid cell-12 border bd-cobalt border-radius-5 border-size-1 my-3 p-2 flex-justify-center c-pointer"
            >
              <td>
                <span class="m-0 cell-12 h6">{{ category.name }}</span>
              </td>
            </tr>
          </template>
        </table>
      </div>
    </div>

    <div class="dialog-actions d-flex flex-justify-between">
      <button v-on:click="send(false)" class="button secondary outline rounded">
        Keine Kategorie
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  components: {},
  data: function () {
    return {
      portName: false,
      port: false,
      windowId: false,
      categories: false,
      title: false,
    };
  },
  created: async function () {
    let window = await browser.windows.getCurrent();
    this.windowId = window.id;
    // open a port to the background script and tell it we are ready...
    this.portName = 'categorySelection_' + this.windowId;
    this.port = browser.runtime.connect({ name: this.portName });
    this.port.postMessage({
      ready: true,
      windowId: this.windowId,
    });
    let _this = this;
    // now wait for the background script to send the categories
    this.port.onMessage.addListener(function (request) {
      if (
        request.categories &&
        Array.isArray(request.categories) &&
        request.windowId === _this.windowId
      ) {
        _this.categories = request.categories;
        _this.title = request.title;
        setInterval(async function () {
          let focusedWindow = await browser.windows.getLastFocused();
          if (focusedWindow.id != _this.windowId) {
            browser.windows.update(_this.windowId, {
              focused: true,
              drawAttention: true,
            });
          }
        }, 5000);
      }
    });
  },
  methods: {
    send: function (category) {
      this.port.postMessage({
        category: category,
        windowId: this.windowId,
      });
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
