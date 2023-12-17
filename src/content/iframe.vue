<template>
  <iframe></iframe>
</template>

<script>
import Vue from 'vue';
export default {
  name: 'iFrame',
  mounted: function () {
    this.renderChildren();
  },
  beforeUpdate: function () {
    //freezing to prevent unnessessary Reactifiation of vNodes
    this.iApp.children = Object.freeze(this.$slots.default);
  },
  methods: {
    renderChildren: function () {
      const children = this.$slots.default;
      const body = this.$el.contentDocument.body;
      const head = this.$el.contentDocument.head;
      const el = document.createElement('DIV'); // we will mount or nested app to this element
      body.appendChild(el);

      for (let link of ['/css/metro4.css', '/css/sky-net.css']) {
        const css = document.createElement('LINK');
        css.setAttribute('rel', 'stylesheet');
        css.setAttribute('type', 'text/css');
        css.setAttribute('href', browser.runtime.getURL(link));
        head.appendChild(css);
      }
      const css_content = document.createTextNode(`
body,
html,
.dialog { 
  max-height: 100vh;
  max-width: 100vw;
  height: 100%;
  width: 100%;
}
.dialog {
  border: none;
}
.dialog-content {
  max-height: 100%;
  height: 100%;
  overflow: auto
}
.dialog-content,
.dialog-actions {
  margin-top: 0px !important;
}
.dialog-actions {
  display: flex;
  justify-content: space-between;
}
label {
  font-weight: 500;
}`);
      const css = document.createElement('STYLE');
      css.setAttribute('type', 'text/css');
      css.appendChild(css_content);
      head.appendChild(css);
      const iApp = new Vue({
        name: 'iApp',
        //freezing to prevent unnessessary Reactifiation of vNodes
        data: { children: Object.freeze(children) },
        render(h) {
          return h('div', this.children);
        },
      });
      iApp.$mount(el); // mount into iframe
      this.iApp = iApp; // cache instance for later updates
    },
  },
};
</script>

<style></style>
