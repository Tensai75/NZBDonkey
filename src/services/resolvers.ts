import { FormFieldResolverOptions } from '@primevue/forms'
import psl from 'psl'

import { get as getInterceptionSettings } from './interception/settings'

import { i18n } from '#i18n'
import { browser } from '#imports'

// --- Types ---

export type ResolverResult = { errors: { message: string }[] }
export type Resolver = (options: FormFieldResolverOptions) => ResolverResult | Promise<ResolverResult>

// --- Compose helper ---

const compose =
  (...resolvers: Resolver[]): Resolver =>
  async (options: FormFieldResolverOptions) => {
    const errors: { message: string }[] = []
    for (const resolver of resolvers) {
      const result = await resolver(options)
      errors.push(...result.errors)
    }
    return { errors }
  }

// --- Base validators ---

export const requiredResolver: Resolver = ({ value, name = '' }) => {
  const errors: { message: string }[] = []
  if (!value) {
    errors.push({ message: i18n.t('validation.isRequired', [name]) })
  }
  return { errors }
}

export const requiredListResolver: Resolver = ({ value }) => {
  const errors: { message: string }[] = []
  if (value.length < 1) {
    errors.push({ message: i18n.t('validation.atLeastOneOptionRequired') })
  }
  return { errors }
}

export const urlResolver: Resolver = ({ value }) => {
  const errors: { message: string }[] = []
  const regex =
    /^(?:(?:https?):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu
  if (!regex.test(value)) {
    errors.push({ message: i18n.t('validation.noValidURL') })
  }
  return { errors }
}

export const replacementStringResolver: Resolver = ({ value }) => {
  const errors: { message: string }[] = []
  if (value.indexOf('%s') < 0) {
    errors.push({ message: i18n.t('validation.noReplacementString') })
  }
  return { errors }
}

export const uniqueBaseDomainResolver: Resolver = async ({ value }) => {
  const errors: { message: string }[] = []
  if (psl.get(value) !== value) {
    errors.push({ message: i18n.t('validation.noBaseDomain') })
  }
  const settings = await getInterceptionSettings()
  if (settings.domains.some((d) => d.domain === value)) {
    errors.push({ message: i18n.t('validation.domainExists') })
  }
  return { errors }
}

export const jsonPathResolver: Resolver = ({ value }) => {
  const errors: { message: string }[] = []
  const regex =
    /^(?:\$)?(?:\.(?:\*|[A-Za-z_][A-Za-z0-9_-]*))*?(?:\[(?:\d+|\*|['"][^'"\]]+['"])\])*?(?:\.(?:\*|[A-Za-z_][A-Za-z0-9_-]*|\[(?:\d+|\*|['"][^'"\]]+['"])\]))*$/i
  if (!regex.test('$.' + value)) {
    errors.push({ message: i18n.t('validation.noValidJSONPath') })
  }
  return { errors }
}

export const regexpResolver: Resolver = ({ value }) => {
  const errors: { message: string }[] = []
  try {
    const regex = new RegExp(value)
    regex.test('test')
  } catch {
    errors.push({ message: i18n.t('validation.noValidRegexp') })
  }
  return { errors }
}

export const netRequestRegexpResolver: Resolver = async ({ value }) => {
  const errors: { message: string }[] = []
  try {
    const result = await browser.declarativeNetRequest.isRegexSupported({ regex: value })
    if (!result.isSupported) {
      errors.push({ message: i18n.t('validation.regexpNotSupported') })
    }
  } catch {
    errors.push({ message: i18n.t('validation.noValidRegexp') })
  }
  return { errors }
}

export const relativePathResolver: Resolver = ({ value }) => {
  const errors: { message: string }[] = []
  if (/^[\\/]|\.{1,}[\\/]|[:]|[\\/]{2,}|[\\/]$/.test(value)) {
    errors.push({ message: i18n.t('validation.noRelativePath') })
  }
  return { errors }
}

export const hostResolver: Resolver = ({ value }) => {
  const errors: { message: string }[] = []
  if (
    !/^([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])(\.([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]))*\.?$/.test(
      value
    )
  ) {
    errors.push({ message: i18n.t('validation.noValidHostOrIp') })
  }
  return { errors }
}

export const portResolver: Resolver = ({ value }) => {
  const errors: { message: string }[] = []
  if (Number(value) > 65535 || Number(value) < 1) {
    errors.push({ message: i18n.t('validation.noValidPort') })
  }
  return { errors }
}

// --- Composed resolvers ---

export const requiredURLResolver = compose(requiredResolver, urlResolver, replacementStringResolver)
export const requiredUniqueBaseDomainResolver = compose(requiredResolver, uniqueBaseDomainResolver)
export const requiredJSONPathResolver = compose(requiredResolver, jsonPathResolver)
export const requiredRegexpResolver = compose(requiredResolver, regexpResolver)
export const requiredNetRequestRegexpResolver = compose(requiredResolver, regexpResolver, netRequestRegexpResolver)
export const requiredRelativePathResolver = compose(requiredResolver, relativePathResolver)
export const requiredHostResolver = compose(requiredResolver, hostResolver)
export const requiredPortResolver = compose(requiredResolver, portResolver)
