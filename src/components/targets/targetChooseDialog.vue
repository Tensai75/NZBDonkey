<script setup lang="ts">
import { Button } from 'primevue'

import * as targets from '@/services/targets'

const emit = defineEmits(['type'])

const targetsList: targets.Target[] = []
targets.targetList.forEach((targetName) => {
  targetsList.push(targets[targetName] as unknown as targets.Target)
})
</script>

<template>
  <div v-for="item in targetsList" :key="item.name" class="flex items-center gap-4 mb-4 flex-auto">
    <Button
      severity="contrast"
      variant="text"
      raised
      class="!border-2 w-96 mx-auto"
      :title="item.description"
      @click="emit('type', item.type)"
    >
      <img :src="'/img/' + item.type + '.png'" style="height: 24px" />
      <div>{{ item.name }}</div>
    </Button>
  </div>
</template>
