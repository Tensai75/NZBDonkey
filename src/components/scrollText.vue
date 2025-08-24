<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

type Direction = 'left' | 'right'

interface Props {
  speed?: number // px/sec
  pauseAtEnds?: number // seconds to pause at each end (non-loop mode)
  loop?: boolean // continuous loop mode
  startOnHover?: boolean // start scrolling only on hover
  direction?: Direction // 'left' or 'right'
  tooltip?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  speed: 80,
  pauseAtEnds: 0,
  loop: false,
  startOnHover: false,
  direction: 'left' as Direction,
  tooltip: true,
})

const root = ref<HTMLDivElement | null>(null)
const textEl = ref<HTMLElement | null>(null)
const hovered = ref(false)
const isScrolling = ref(false)
const reducedMotion = ref(false)

let animationFrame: number | null = null
let pauseTimeout: ReturnType<typeof setTimeout> | null = null
let position = 0
let scrollDirection = 1 // 1 = left, -1 = right
let lastTimestamp = 0
let distance = 0
let containerW = 0
let textW = 0

function startScroll() {
  stopScroll()
  if (!root.value || !textEl.value) return

  containerW = root.value.clientWidth
  textW = textEl.value.scrollWidth
  distance = textW - containerW
  if (distance <= 0) {
    textEl.value.style.transform = 'translateX(0)'
    isScrolling.value = false
    return
  }

  position = 0
  scrollDirection = props.direction === 'right' ? -1 : 1
  lastTimestamp = performance.now()
  isScrolling.value = true
  animate()
}

function stopScroll() {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }
  if (pauseTimeout) {
    clearTimeout(pauseTimeout)
    pauseTimeout = null
  }
  isScrolling.value = false
  if (textEl.value) textEl.value.style.transform = 'translateX(0)'
}

function animate() {
  if (!textEl.value || reducedMotion.value) return

  const speed = props.speed ?? 80 // px/sec
  const pauseAtEnds = props.pauseAtEnds ?? 0 // seconds

  const now = performance.now()
  const dt = (now - lastTimestamp) / 1000 // seconds
  lastTimestamp = now

  position += scrollDirection * speed * dt

  if (props.loop) {
    // Loop mode: wrap around
    if (scrollDirection === 1 && position > distance) position = 0
    if (scrollDirection === -1 && position < -distance) position = 0
    textEl.value.style.transform = `translateX(${-position}px)`
    animationFrame = requestAnimationFrame(animate)
    return
  }

  // Back-and-forth mode
  if (scrollDirection === 1 && position >= distance) {
    position = distance
    textEl.value.style.transform = `translateX(${-position}px)`
    if (pauseAtEnds > 0) {
      // Do NOT call requestAnimationFrame here!
      pauseTimeout = setTimeout(() => {
        scrollDirection = -1
        lastTimestamp = performance.now()
        animationFrame = requestAnimationFrame(animate) // Resume after pause
      }, pauseAtEnds * 1000)
    } else {
      scrollDirection = -1
      lastTimestamp = performance.now()
      animationFrame = requestAnimationFrame(animate)
    }
    return
  }
  if (scrollDirection === -1 && position <= 0) {
    position = 0
    textEl.value.style.transform = `translateX(${-position}px)`
    if (pauseAtEnds > 0) {
      // Do NOT call requestAnimationFrame here!
      pauseTimeout = setTimeout(() => {
        scrollDirection = 1
        lastTimestamp = performance.now()
        animationFrame = requestAnimationFrame(animate) // Resume after pause
      }, pauseAtEnds * 1000)
    } else {
      scrollDirection = 1
      lastTimestamp = performance.now()
      animationFrame = requestAnimationFrame(animate)
    }
    return
  }

  textEl.value.style.transform = `translateX(${-position}px)`
  animationFrame = requestAnimationFrame(animate)
}

function maybeStart() {
  if (props.startOnHover && !hovered.value) {
    stopScroll()
    return
  }
  startScroll()
}

onMounted(() => {
  const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
  const setRM = () => {
    reducedMotion.value = !!mql.matches
    if (reducedMotion.value) stopScroll()
    else maybeStart()
  }
  mql.addEventListener('change', setRM)
  setRM()

  window.addEventListener('resize', () => nextTick(maybeStart))
  watch(
    () => [props.speed, props.pauseAtEnds, props.loop, props.direction],
    () => nextTick(maybeStart)
  )
  watch(hovered, maybeStart)
  nextTick(maybeStart)
})

onBeforeUnmount(() => {
  stopScroll()
})
</script>

<template>
  <div
    ref="root"
    class="smart-line"
    style="width: 100%; max-width: 100%; overflow-x: hidden; white-space: nowrap"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <span ref="textEl" class="smart-line__text" :title="props.tooltip ? (textEl?.textContent ?? undefined) : undefined">
      <slot />
    </span>
  </div>
</template>

<style scoped>
.smart-line__text {
  display: inline-block;
  will-change: transform;
  transition: none !important;
}
</style>
