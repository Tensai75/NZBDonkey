import { FormFieldResolverOptions } from '@primevue/forms'
import psl from 'psl'

import { get as getInterceptionSettings } from './interception/settings'

import { i18n } from '#i18n'
import { browser } from '#imports'

export const requiredResolver = ({ value, name = '' }: FormFieldResolverOptions) => {
  const errors = []
  if (value === '') {
    errors.push({
      message: i18n.t('validation.isRequired', [name]),
    })
  }
  return { errors }
}

export const requiredURLResolver = ({ value, name }: FormFieldResolverOptions) => {
  const errors = []
  if (!value) {
    errors.push({
      message: i18n.t('validation.isRequired', [name ?? '']),
    })
  }
  const regex =
    /^(?:(?:https?):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu
  if (!regex.test(value)) {
    errors.push({
      message: i18n.t('validation.noValidURL'),
    })
  }
  if (value.indexOf('%s') < 0) {
    errors.push({
      message: i18n.t('validation.noReplacementString'),
    })
  }
  return { errors }
}

export const requiredListResolver = ({ value }: FormFieldResolverOptions) => {
  const errors = []
  if (value.length < 1) {
    errors.push({
      message: i18n.t('validation.atLeastOneOptionRequired'),
    })
  }
  return { errors }
}

export const requiredUniqueBaseDomainResolver = async ({ value, name = '' }: FormFieldResolverOptions) => {
  const errors = []
  if (!value) {
    errors.push({
      message: i18n.t('validation.isRequired', [name]),
    })
  }
  if (psl.get(value) !== value) {
    errors.push({ message: i18n.t('validation.noBaseDomain') })
  }
  const settings = await getInterceptionSettings()
  if (settings.domains.some((d) => d.domain === value)) {
    errors.push({ message: i18n.t('validation.domainExists') })
  }
  return { errors }
}

export const requiredJSONPathResolver = ({ value, name = '' }: FormFieldResolverOptions) => {
  const errors = []
  if (!value) {
    errors.push({
      message: i18n.t('validation.isRequired', [name]),
    })
  }
  const regex =
    /^(?:\$)?(?:\.(?:\*|[A-Za-z_][A-Za-z0-9_-]*))*?(?:\[(?:\d+|\*|['"][^'"\]]+['"])\])*?(?:\.(?:\*|[A-Za-z_][A-Za-z0-9_-]*|\[(?:\d+|\*|['"][^'"\]]+['"])\]))*$/i
  if (!regex.test('$.' + value)) {
    errors.push({ message: i18n.t('validation.noValidJSONPath') })
  }
  return { errors }
}

export const requiredRegexpResolver = ({ value, name = '' }: FormFieldResolverOptions) => {
  const errors = []
  if (!value) {
    errors.push({
      message: i18n.t('validation.isRequired', [name]),
    })
  }
  return { errors }
}

export const requiredNetRequestRegexpResolver = async ({ value, name = '' }: FormFieldResolverOptions) => {
  const errors = []
  if (!value) {
    errors.push({
      message: i18n.t('validation.isRequired', [name]),
    })
  }
  errors.push(...regexpResolver({ value, name }).errors)
  const regexpErrors = await netRequestRegexpResolver({ value, name })
  errors.push(...regexpErrors.errors)
  return { errors }
}

export const netRequestRegexpResolver = async ({ value }: FormFieldResolverOptions) => {
  const errors = []
  try {
    const result = await browser.declarativeNetRequest.isRegexSupported({ regex: value })
    if (!result.isSupported) {
      errors.push({
        message: i18n.t('validation.regexpNotSupported'),
      })
    }
  } catch {
    errors.push({
      message: i18n.t('validation.noValidRegexp'),
    })
  }
  return { errors }
}

export const regexpResolver = ({ value }: FormFieldResolverOptions) => {
  const errors = []
  try {
    const regex = new RegExp(value)
    regex.test('test')
  } catch {
    errors.push({
      message: i18n.t('validation.noValidRegexp'),
    })
  }
  return { errors }
}

export const requiredRelativePathResolver = ({ value, name = '' }: FormFieldResolverOptions) => {
  const errors = []
  if (!value) {
    errors.push({
      message: i18n.t('validation.isRequired', [name]),
    })
  }
  errors.push(...relativePathResolver({ value, name }).errors)
  return { errors }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const relativePathResolver = ({ value, name = '' }: FormFieldResolverOptions) => {
  const errors = []
  if (/^[\\/]|\.{1,}[\\/]|[:]|[\\/]{2,}|[\\/]$/.test(value)) {
    errors.push({
      message: i18n.t('validation.noRelativePath'),
    })
  }
  return { errors }
}

export const requiredHostResolver = ({ value, name = '' }: FormFieldResolverOptions) => {
  const errors = []
  if (!value) {
    errors.push({
      message: i18n.t('validation.isRequired', [name]),
    })
  }
  if (
    !/^([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])(\.([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]))*\.?$/.test(
      value
    )
  ) {
    errors.push({
      message: i18n.t('validation.noValidHostOrIp'),
    })
  }
  return { errors }
}

export const requiredPortResolver = ({ value, name = '' }: FormFieldResolverOptions) => {
  const errors = []
  if (!value) {
    errors.push({
      message: i18n.t('validation.isRequired', [name]),
    })
  }
  if (Number(value) > 65535 || Number(value) < 1) {
    errors.push({
      message: i18n.t('validation.noValidPort'),
    })
  }
  return { errors }
}
