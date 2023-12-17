<template>
  <span
    v-if="helptext"
    class="mif-question p-1"
    data-role="popover"
    data-cls-popover="rounded drop-shadow"
    :data-popover-text="helptext"
    :data-popover-position="position"
    data-popover-hide="0"
    data-close-button="false"
    data-hide-on-leave="true"
    style="cursor: pointer"
  ></span>
</template>

<script>
export default {
  props: ['helptext', 'position'],
};
</script>
