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
        {{ tag }}
        <button class="delete" @click="removeTag(index)">x</button>
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

<style scoped>
* {
  box-sizing: border-box;
}

.options {
  position: absolute;
  top: 35px;
  list-style-type: none;
  padding: 0;
  visibility: hidden;
  transition: visibility 1s;
  overflow: auto;
}

input:focus ~ .options {
  visibility: visible;
}

.options li {
  padding: 10px;
  background: #333;
  color: #eee;
  cursor: pointer;
}

.options li:hover,
.options li.active {
  background: #555;
}

.tag-input {
  position: relative;
  width: 250px;
}

.tags {
  --tagBgColor: rgb(250, 104, 104);
  --tagTextColor: white;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
  margin: 0;
  padding: 10px;
  left: 10px;
  border-bottom: 1px solid #5558;
  cursor: text;

  &.singleLine {
    flex-wrap: nowrap;
    overflow: auto;
  }

  &.focused {
    border-bottom: 1px solid var(--p-primary-400);
  }

  &.duplicate {
    border-bottom: 1px solid rgb(235, 27, 27);
  }

  &.noMatchingTag {
    outline: rgb(235, 27, 27);
    border: 1px solid rgb(235, 27, 27);
    animation: shake1 0.5s;
  }
}

.tag {
  background: var(--tagBgColor);
  padding: 5px;
  border-radius: 4px;
  color: var(--tagTextColor);
  white-space: nowrap;
  transition: 0.1s ease background;
}

.del {
  background: red;
}

.delete {
  color: var(--tagTextColor);
  background: none;
  outline: none;
  border: none;
  cursor: pointer;
}

.tag.duplicate {
  background: rgb(235, 27, 27);
  animation: shake 1s;
}

input {
  all: unset;
}

.count {
  font-size: 0.8rem;
  white-space: nowrap;
  flex-grow: 1;
  text-align: end;
}

.count span {
  background: #eee;
  padding: 2px;
  border-radius: 2px;
}

.err {
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
