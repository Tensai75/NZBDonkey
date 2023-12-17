<template>
  <div class="dialog">
    <div class="dialog-title">
      <img
        src="/icons/NZBDonkey_32.png"
        style="width: 32px; height: 32px; margin: -5px 10px 0px 0px"
      />Target Selection
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
            Select Target for "{{ title }}":
          </h6>
        </div>
        <table class="row cell-12">
          <template v-for="(target, index) in targets">
            <tr
              v-if="target.active"
              v-bind:key="index"
              v-on:click="send(index)"
              class="grid cell-12 border bd-cobalt border-radius-5 border-size-1 my-3 p-2 flex-justify-center c-pointer"
            >
              <td>
                <img
                  :src="['/img/' + target.type + '.png']"
                  class="cell-2"
                  style="max-width: 35px; max-height: 35px"
                />
              </td>
              <td>
                <span class="m-0 cell-10 h6">{{ target.name }}</span>
              </td>
            </tr>
          </template>
        </table>
      </div>
    </div>

    <div class="dialog-actions d-flex flex-justify-between">
      <button v-on:click="send(false)" class="button secondary outline rounded">
        Abbrechen
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
      targets: false,
      title: false,
    };
  },
  created: async function () {
    let window = await browser.windows.getCurrent();
    this.windowId = window.id;
    // open a port to the background script and tell it we are ready...
    this.portName = 'targetSelection_' + this.windowId;
    this.port = browser.runtime.connect({ name: this.portName });
    const listener = function (request) {
      if (
        request.targets &&
        Array.isArray(request.targets) &&
        request.windowId === this.windowId
      ) {
        this.targets = request.targets;
        this.title = request.title;
        let windowId = this.windowId;
        setInterval(async function () {
          let focusedWindow = await browser.windows.getLastFocused();
          if (focusedWindow.id != windowId) {
            chrome.windows.update(windowId, {
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
  },
  methods: {
    send: function (target) {
      this.port.postMessage({
        target: target,
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
