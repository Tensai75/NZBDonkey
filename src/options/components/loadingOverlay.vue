<template>
  <div id="loadingOverlay">
    <img src="/img/loader.gif" alt="Loading Spinner" /><br />
    <span>{{ loadingText }}</span>
  </div>
</template>

<script>
export default {
  data: function () {
    return {
      loadingText: 'Lade Einstellungen...',
    };
  },
};
</script>

<style>
#loadingOverlay {
  background: #ffffff;
  position: fixed;
  height: 100vh;
  width: 100vw;
  z-index: 9999;
  top: 0px;
  left: 0px;
  text-align: center;
  padding-top: 20%;
}
</style>
