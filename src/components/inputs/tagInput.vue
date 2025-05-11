<script setup lang="ts">
import { computed, InputHTMLAttributes, nextTick, onMounted, ref, watch } from 'vue'
defineOptions({ name: 'TagInput' })
export type AutocompleteItemType = string // | (object & { [key: string]: any }); TODO: WIP
export interface TagInputProps {
  modelValue: string[]
  allowCustom?: boolean /** @deprecated replaced by `validator` and will be removed in next major release */
  validator?: RegExp | ((tag: string, items?: AutocompleteItemType[]) => boolean) | 'onlyAutocompleteItems'
  validationMessage?: string
  autocompleteItems?:
    | AutocompleteItemType[]
    | ((tag: string) => AutocompleteItemType[] | Promise<AutocompleteItemType[]>)
  autocompleteKey?: string
  showCount?: boolean
  tagTextColor?: string
  tagBgColor?: string
  tagClass?: string
  customDelimiter?: string[] | string
  singleLine?: boolean
  inputProps?: InputHTMLAttributes
  placeholder?: string
}

const props = withDefaults(defineProps<TagInputProps>(), {
  modelValue: () => [],
  autocompleteKey: 'id',
  autocompleteItems: () => [],
  validationMessage: 'Invalid tag: custom tags not allowed',
  allowCustom: true,
  validator: undefined,
  showCount: false,
  tagTextColor: 'white',
  tagBgColor: 'rgb(120, 54, 10)',
  tagClass: '',
  customDelimiter: () => [],
  singleLine: false,
  inputProps: () => ({}),
  placeholder: 'Enter tag',
})
const emit = defineEmits(['update:modelValue'])
// Tags
const tags = ref<string[]>(props.modelValue)
const tagsClass = ref(props.tagClass)
const newTag = ref('')
const focused = ref(false)
const activeOptionInd = ref(-1)
const customDelimiter = computed<string[] | string>(() => [
  ...new Set(
    (typeof props.customDelimiter == 'string' ? props.customDelimiter.split('') : props.customDelimiter).flatMap(
      (delim) => delim.split('')
    )
  ),
])

// handling duplicates
const duplicate = ref<string | null>(null)
const handleDuplicate = (tag: string) => {
  duplicate.value = tag
  setTimeout(() => (duplicate.value = null), 1000)
  newTag.value = ''
}
const noMatchingTag = ref(false)
function handleNoMatchingTag() {
  noMatchingTag.value = true
  setTimeout(() => (noMatchingTag.value = false), 500)
  let v = newTag.value
  if (customDelimiter.value.includes(v.charAt(v.length - 1))) newTag.value = v.slice(0, v.length - 1)
}

/** compute options and filtered options */
const options = ref<AutocompleteItemType[] | undefined>(undefined)
watch(newTag, async () => {
  activeOptionInd.value = -1 /** reset arrow key navigation when input changes */
  options.value = props.autocompleteItems
    ? Array.isArray(props.autocompleteItems)
      ? props.autocompleteItems
      : await props.autocompleteItems(newTag.value)
    : undefined
})

const availableOptions = computed(() => {
  if (!options.value) return []
  return options.value.filter(
    (option) => newTag.value && !tags.value.includes(option) && option.match(new RegExp(newTag.value, 'i'))
  )
})

/** add new tag */
const addTag = (tag: string) => {
  tag = tag.trim()
  /** prevent empty tag */
  if (!tag) {
    handleNoMatchingTag()
    return
  }

  /** return early if duplicate */
  if (tags.value.includes(tag)) {
    handleDuplicate(tag)
    return
  }

  if (
    (props.validator instanceof RegExp && !props.validator.test(tag)) ||
    ((props.validator === 'onlyAutocompleteItems' || (props.validator === undefined && !props.allowCustom)) &&
      !options.value?.includes(tag)) ||
    (typeof props.validator === 'function' && !props.validator(tag, options.value))
  ) {
    handleNoMatchingTag()
    return
  }

  tags.value.push(tag)
  newTag.value = ''
  activeOptionInd.value = -1
}
const addTagIfDelem = (tag: string) => {
  if (!customDelimiter.value || customDelimiter.value.length == 0) return
  if (customDelimiter.value.includes(tag.charAt(tag.length - 1))) addTag(tag.slice(0, tag.length - 1))
}
const removeTag = (index: number) => {
  tags.value.splice(index, 1)
}

// positioning and handling tag change
const tagsUl = ref<HTMLUListElement | null>(null)
const onTagsChange = () => {
  tagsUl.value?.scrollTo(tagsUl.value.scrollWidth, 0)
  // emit value on tags change
  emit('update:modelValue', tags.value)
}
watch(tags, () => nextTick(onTagsChange), { deep: true })
onMounted(onTagsChange)

const shouldDelete = ref<boolean>(false)
let timer: ReturnType<typeof setTimeout> | null = null

const deleteLastTag = () => {
  if (newTag.value.length === 0 && tags.value.length > 0) {
    if (shouldDelete.value) {
      if (timer) clearTimeout(timer)
      shouldDelete.value = false
      removeTag(tags.value.length - 1)
    } else {
      shouldDelete.value = true
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => (shouldDelete.value = false), 3000)
    }
  }
}
const id = Math.random().toString(36).substring(7)
const inputElId = `tag-input${id}`
</script>

<template>
  <label :for="inputElId">
  <label :for="inputElId" class="nzbdonkeyTagInput">
    <ul
      ref="tagsUl"
      class="tags"
      tabindex="0"
      :class="{ duplicate, focused, noMatchingTag, singleLine }"
      :style="{ '--tagBgColor': tagBgColor, '--tagTextColor': tagTextColor }"
    >
      <li
        v-for="(tag, index) in tags"
        :key="tag"
        :class="{
          duplicate: tag === duplicate,
          tag: tagsClass.length == 0,
          del: shouldDelete && index === tags.length - 1,
          [tagsClass]: true,
        }"
      >
        <span>{{ tag }}</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="delete" @click="removeTag(index)">
          <g id="times-circle">
            <path d="M12,21a9,9,0,1,1,9-9A9,9,0,0,1,12,21ZM12,4.5A7.5,7.5,0,1,0,19.5,12,7.5,7.5,0,0,0,12,4.5Z" />
            <path
              d="M9,15.75a.74.74,0,0,1-.53-.22.75.75,0,0,1,0-1.06l6-6a.75.75,0,0,1,1.06,1.06l-6,6A.74.74,0,0,1,9,15.75Z"
            />
            <path
              d="M15,15.75a.74.74,0,0,1-.53-.22l-6-6A.75.75,0,0,1,9.53,8.47l6,6a.75.75,0,0,1,0,1.06A.74.74,0,0,1,15,15.75Z"
            />
          </g>
        </svg>
      </li>
      <div class="tag-input">
        <input
          :id="inputElId"
          v-model="newTag"
          type="text"
          autocomplete="off"
          :placeholder="placeholder"
          v-bind="inputProps"
          @keydown.enter="addTag(activeOptionInd > -1 ? availableOptions[activeOptionInd] : newTag)"
          @keydown.prevent.tab="addTag(newTag)"
          @keydown.delete="deleteLastTag()"
          @input="addTagIfDelem(newTag)"
          @keydown.prevent.down="activeOptionInd = (activeOptionInd + 1) % availableOptions.length"
          @keydown.prevent.up="
            activeOptionInd = (availableOptions.length + activeOptionInd - 1) % availableOptions.length
          "
          @focus="focused = true"
          @blur="focused = false"
        />

        <ul class="options">
          <li
            v-for="(option, i) in availableOptions"
            :key="option"
            :class="{ active: i === activeOptionInd }"
            @click="addTag(option)"
          >
            {{ option }}
          </li>
        </ul>
      </div>
      <div v-if="showCount" class="count">
        <span>{{ tags.length }}</span> tags
      </div>
    </ul>
  </label>
  <small v-show="noMatchingTag" class="err">{{ validationMessage }}</small>
</template>

<style>
:root {
  --nzbdonkeyTagInput-content-border-color: var(--p-surface-400);
  --nzbdonkeyTagInput-content-hover-color: var(--p-surface-900);
  --nzbdonkeyTagInput-highlight-focus-color: var(--p-primary-500);
  --nzbdonkeyTagInput-input-background-color: var(--p-surface-0);
}

@media (prefers-color-scheme: dark) {
  :root {
    --nzbdonkeyTagInput-content-border-color: var(--p-surface-600);
    --nzbdonkeyTagInput-content-hover-color: var(--p-surface-400);
    --nzbdonkeyTagInput-highlight-focus-color: var(--p-primary-400);
    --nzbdonkeyTagInput-input-background-color: var(--p-surface-950);
  }
}

.nzbdonkeyTagInput .options {
  position: absolute;
  top: 35px;
  list-style-type: none;
  padding: 0;
  visibility: hidden;
  transition: visibility 1s;
  overflow: auto;
}

.nzbdonkeyTagInput input:focus ~ .options {
  visibility: visible;
}

.nzbdonkeyTagInput .options li {
  padding: 10px;
  background: #333;
  color: #eee;
  cursor: pointer;
}

.nzbdonkeyTagInput .options li:hover,
.nzbdonkeyTagInput .options li.active {
  background: #555;
}

.nzbdonkeyTagInput .tag-input {
  position: relative;
  display: flex;
  align-items: center;
  height: 28px;
}

.nzbdonkeyTagInput .tags {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
  margin: 5px 0 5px 0;
  padding: 6px;
  left: 10px;
  border: 1px solid var(--nzbdonkeyTagInput-content-border-color);
  border-radius: 4px;
  cursor: text;
  background-color: var(--nzbdonkeyTagInput-input-background-color);
  min-height: 40px;
}

.nzbdonkeyTagInput .tags.singleLine {
  flex-wrap: nowrap;
  overflow: auto;
}

.nzbdonkeyTagInput .tags:hover {
  border: 1px solid var(--nzbdonkeyTagInput-content-hover-color);
}

.nzbdonkeyTagInput .tags.focused,
.nzbdonkeyTagInput .tags:focus,
.nzbdonkeyTagInput .tags:active {
  border: 2px solid var(--nzbdonkeyTagInput-highlight-focus-color);
}

.nzbdonkeyTagInput .tags.duplicate {
  border: 1px solid rgb(235, 27, 27);
}

.nzbdonkeyTagInput .tags.noMatchingTag {
  outline: rgb(235, 27, 27);
  border: 1px solid rgb(235, 27, 27);
  animation: shake1 0.5s;
}

.nzbdonkeyTagInput .tag {
  display: flex;
  align-items: center;
  white-space: nowrap;
  background: var(--p-primary-500);
  padding: 0px 5px 0px 5px;
  border-radius: 4px;
  color: var(--p-surface-100);
  white-space: nowrap;
  transition: 0.1s ease background;
  height: 28px;
  font-size: 14px;
}

.nzbdonkeyTagInput .del {
  background: red;
}

.nzbdonkeyTagInput .delete {
  fill: var(--p-surface-100);
  margin-left: 5px;
  margin-right: 0px;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.nzbdonkeyTagInput .tag.duplicate {
  background: rgb(235, 27, 27);
  animation: shake 1s;
}

.nzbdonkeyTagInput input {
  all: unset;
  font-size: 14px;
}

.nzbdonkeyTagInput .count {
  font-size: 0.8rem;
  white-space: nowrap;
  flex-grow: 1;
  text-align: end;
}

.nzbdonkeyTagInput .count span {
  background: #eee;
  padding: 2px;
  border-radius: 2px;
}

.nzbdonkeyTagInput .err {
  color: red;
}

@keyframes shake {
  10%,
  90% {
    transform: scale(0.9) translate3d(-1px, 0, 0);
  }

  20%,
  80% {
    transform: scale(0.9) translate3d(2px, 0, 0);
  }

  30%,
  50%,
  70% {
    transform: scale(0.9) translate3d(-4px, 0, 0);
  }

  40%,
  60% {
    transform: scale(0.9) translate3d(4px, 0, 0);
  }
}

@keyframes shake1 {
  10%,
  90% {
    transform: scale(0.99) translate3d(-1px, 0, 0);
  }

  20%,
  80% {
    transform: scale(0.98) translate3d(2px, 0, 0);
  }

  30%,
  50%,
  70% {
    transform: scale(1) translate3d(-4px, 0, 0);
  }

  40%,
  60% {
    transform: scale(0.98) translate3d(4px, 0, 0);
  }
}
</style>
