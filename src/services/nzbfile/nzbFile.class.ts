import { PublicPath } from 'wxt/browser'

import { analyseNzbLink, showNzbFileDialog } from './functions'
import { ValidateResults, validateNZBFile } from './validation'

import { i18n } from '#imports'
import { getCategory } from '@/services/categories'
import * as general from '@/services/general'
import log from '@/services/logger/debugLogger'
import { NZBStatus, TargetStatus } from '@/services/logger/loggerDB'
import nzbLog from '@/services/logger/nzbLogger'
import notifications from '@/services/notifications'
import * as nzbfile from '@/services/nzbfile'
import { NZBObject, NZB_FILE_HEADER, nzbObjectToText, textToNzbObject } from '@/services/nzbfile/nzbObject'
import { Settings as NZBFileSettings } from '@/services/nzbfile/settings'
import * as searchengines from '@/services/searchengines'
import * as nzbFileTargets from '@/services/targets'
import { getBasenameFromFilename } from '@/utils/stringUtilities'

export type NZBFileTarget = nzbFileTargets.TargetSettings & {
  selectedCategory?: string
  status?: TargetStatus
  errorMessage?: string
}

export class NZBFileObject {
  id?: number
  status?: NZBStatus
  selected: boolean
  nzbFile: NZBObject
  filename: string
  header: string
  title: string
  password: string
  filepath: string
  targets: NZBFileTarget[]
  source: string
  searchEngine?: string
  downloadURL?: string
  settings?: NZBFileSettings
  errorMessage?: string
  log: (nzbFile: NZBFileObject) => Promise<number>

  constructor() {
    this.selected = true
    this.nzbFile = {} as NZBObject
    this.filename = ''
    this.header = ''
    this.title = ''
    this.password = ''
    this.filepath = ''
    this.targets = []
    this.source = ''
    this.log = nzbLog.log
  }

  async init(): Promise<NZBFileObject> {
    log.info(`inititating nzbFileObject`)
    this.status = 'initiated'
    this.settings = await nzbfile.getSettings()
    this.id = await this.log(this)
    log.info(`initiating nzbFileObject with id ${this.id} completed`)
    return this
  }

  async addNzbFile(
    nzbTextFile: string,
    filename: string,
    source: string,
    targets: NZBFileTarget[] = []
  ): Promise<void> {
    try {
      if (!this.status) await this.init()
      this.nzbFile = textToNzbObject(nzbTextFile)
      this.filename = filename
      this.source = source
      this.targets = targets.length > 0 ? targets : await nzbFileTargets.getTargets()
      this.extractMetaInformation()
      this.setDefaultsFromFilename()
      this.status = 'fetched'
      this.id = await this.log(this)
    } catch (e) {
      this.error(
        i18n.t('errors.errorWhileProcessing', [e instanceof Error ? e.message : i18n.t('errors.unknownError')])
      )
    }
  }

  private extractMetaInformation(): void {
    if (this.nzbFile.head?.meta) {
      for (const meta of this.nzbFile.head.meta) {
        if (
          ['title', 'password'].includes(meta.type) &&
          !(this as Record<string, unknown>)[meta.type] &&
          meta['#text']
        ) {
          ;(this as Record<string, unknown>)[meta.type] = meta['#text']
        }
      }
    }
  }

  private setDefaultsFromFilename(): void {
    if (this.filename) {
      const basename = getBasenameFromFilename(this.filename)
      const [, title, password] = /^(.*?)(?:{{(.*?)}})?$/.exec(basename) || []
      if (!this.title && title) this.title = title
      if (!this.password && password) this.password = password
    }
  }

  async processNzblnk(nzblnk: string, source: string, targets: NZBFileTarget[] = []): Promise<void> {
    try {
      if (!this.status) await this.init()
      const { h, t, p } = analyseNzbLink(nzblnk)
      Object.assign(this, { header: h, title: t, password: p, source })
      this.targets = targets.length > 0 ? targets : await nzbFileTargets.getTargets()
      this.search()
    } catch (e) {
      this.error(
        i18n.t('errors.errorWhileProcessingNzblnk', [e instanceof Error ? e.message : i18n.t('errors.unknownError')])
      )
    }
  }

  private async search(): Promise<void> {
    try {
      if (!this.status) await this.init()
      const searchEnginesSettings = await searchengines.getSettings()
      const engines = searchEnginesSettings.engines.filter((engine) => engine.isActive)
      if (engines.length === 0) {
        browser.tabs.create({ url: browser.runtime.getURL('/nzbdonkey.html#NOACTIVEENGINE' as PublicPath) })
        throw new Error(i18n.t('errors.noActiveSearchEngines'))
      }
      notifications.info(i18n.t('nzbsearch.searching', [this.header]))
      const searches = []
      for (const engine of engines) {
        const f = async (): Promise<{ nzbFile: NZBObject; engine: string }> => {
          try {
            const nzbFile = await searchengines[engine.type].getNZB(this.header, engine)
            if (!this.settings) this.settings = await nzbfile.getSettings()
            if (this.settings.fileCheck || this.settings.segmentCheck) {
              const validation = await this.validate(nzbFile)
              if (!validation.complete) throw validation.error
            }
            return { nzbFile, engine: engine.name }
          } catch (e) {
            const error = e instanceof Error ? e : new Error('unknown error')
            log.warn(`the result from "${engine.name}" was rejected for the following reason: ${error.message}`)
            throw error
          }
        }
        searches.push(f)
      }
      const prozessResult = async (nzbfile: NZBFileObject) => {
        nzbfile.status = 'fetched'
        nzbfile.log(this)
        const settings = await general.getSettings()
        if (settings.catchLinksShowDialog) {
          try {
            const nzbFiles = await showNzbFileDialog(nzbfile)
            nzbFiles.forEach((nzbFile) => nzbFile.process())
          } catch (e) {
            this.error(
              i18n.t('errors.errorWhileProcessing', [e instanceof Error ? e.message : i18n.t('errors.unknownError')])
            )
          }
        } else {
          nzbfile.process()
        }
      }
      switch (searchEnginesSettings.searchOrder) {
        case 'sequential':
          for (const search of searches) {
            try {
              const result = await search()
              this.nzbFile = result.nzbFile
              this.searchEngine = result.engine
              prozessResult(this)
              return
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
              // void
            }
          }
          break
        case 'parallel':
          try {
            const result = await Promise.any(searches.map(async (search) => await search()))
            this.nzbFile = result.nzbFile
            this.searchEngine = result.engine
            prozessResult(this)
            return
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (e) {
            // void
          }
      }
      throw new Error(i18n.t('errors.noSearchResults'))
    } catch (e) {
      this.error(
        i18n.t('errors.errorWhileSearching', [
          this.header,
          e instanceof Error ? e.message : i18n.t('errors.unknownError'),
        ])
      )
    }
  }

  async process(): Promise<void> {
    try {
      if (!this.selected) {
        log.info(`skipping NZB file "${this.title}"`)
        this.status = 'warn'
        this.errorMessage = i18n.t('errors.skippedByUser')
        this.targets.map((target) => {
          target.status = 'inactive'
        })
        this.log(this)
        return
      }
      if (!this.settings) this.settings = await nzbfile.getSettings()
      if (this.settings.processTitle) this.formatTitle()
      if (this.settings.addTitle) this.addTitleToMeta()
      if (this.settings.addPassword) this.addPasswordToMeta()
      if (this.settings.filesToBeRemoved.length > 0) this.removeFiles()
      this.sendToTargets()
    } catch (e) {
      this.error(
        i18n.t('errors.errorWhileProcessing', [e instanceof Error ? e.message : i18n.t('errors.unknownError')])
      )
    }
  }

  async validate(nzbFile: NZBObject = this.nzbFile): Promise<ValidateResults> {
    if (!this.settings) this.settings = await nzbfile.getSettings()
    return validateNZBFile(nzbFile, this.settings)
  }

  async sendToTargets(): Promise<void> {
    try {
      if (this.targets.length === 0) this.targets = (await nzbFileTargets.getTargets()) as NZBFileTarget[]
      if (this.targets.filter((target) => target.isActive).length === 0) {
        browser.tabs.create({ url: browser.runtime.getURL('/nzbdonkey.html#NOACTIVETARGET' as PublicPath) })
        throw new Error(i18n.t('errors.noActiveTargets'))
      }
      const pushPromises: (() => Promise<void>)[] = []
      for (let i = 0; i < this.targets.length; i++) {
        if (!this.targets[i].isActive) continue
        const pushPromise = async (): Promise<void> => {
          try {
            if (this.targets[i].categories.useCategories && this.targets[i].selectedCategory === undefined) {
              this.targets[i].selectedCategory = await getCategory(this.targets[i].categories, this.title)
            }
            await nzbFileTargets[this.targets[i].type].push(this, this.targets[i])
            this.targets[i].status = 'success'
            this.log(this)
          } catch (e) {
            this.targets[i].errorMessage = e instanceof Error ? e.message : i18n.t('errors.unknownError')
            this.targets[i].status = 'error'
            this.status = 'warn'
            this.log(this)
          }
        }
        pushPromises.push(pushPromise)
      }
      await Promise.allSettled(pushPromises.map((promise) => promise()))
      if (this.targets.filter((target) => target.status === 'success').length === 0) {
        throw new Error(i18n.t('errors.pushingToAllTargetsFailed'))
      } else if (this.targets.filter((target) => target.status === 'error').length > 0) {
        this.warn(i18n.t('errors.errorWhilePushingToTarget'))
      } else {
        this.success()
      }
    } catch (e) {
      this.error(
        i18n.t('errors.errorWhileProcessing', [e instanceof Error ? e.message : i18n.t('errors.unknownError')])
      )
    }
  }

  addMetaInformation(type: string, text: string): void {
    if (!this.nzbFile.head) this.nzbFile.head = { meta: [] }
    const meta = this.nzbFile.head.meta || []
    const existingMeta = meta.find((meta) => meta.type === type)
    if (existingMeta) existingMeta['#text'] = text
    else meta.push({ type, '#text': text })
    this.nzbFile.head.meta = meta
  }

  addPasswordToMeta(password: string = this.password): void {
    if (password) {
      this.addMetaInformation('password', password)
      this.password = password
    }
  }

  addTitleToMeta(title: string = this.title): void {
    if (title) {
      this.addMetaInformation('title', title)
      this.title = title
    }
  }

  removeFiles(): void {
    if (!this.nzbFile.head) this.nzbFile.head = { meta: [] }
    const comments = this.nzbFile['#comment'] || []
    this.nzbFile.file = this.nzbFile.file.filter((file) => {
      const filename = file.subject.match(/"(.+?)"/)?.[1] || file.subject
      const keep = !this.settings?.filesToBeRemoved.some((fileToBeRemoved) => filename.includes(fileToBeRemoved))
      if (!keep) {
        log.info(`removing file "${filename}" from NZB file`)
        comments.push(` file '${file.subject}' removed by NZBDonkey `)
      }
      return keep
    })
    this.nzbFile['#comment'] = comments
  }

  formatTitle(): string {
    switch (this.settings?.processTitleType) {
      case 'spaces':
        this.title = this.title.replaceAll('.', ' ')
        break
      case 'dots':
        this.title = this.title.replaceAll(' ', '.')
        break
    }
    return this.title
  }

  getFilename(): string {
    const filename = this.title != '' ? this.title + '.nzb' : this.filename != '' ? this.filename : ''
    if (filename === '') throw new Error(i18n.t('errors.noFilename'))
    return filename.replace(/[/\\?%*:|"<>\r\n\t\0\v\f\u200B]/g, '')
  }

  getFilenameWithPassword(): string {
    const filename = this.getFilename()
    if (!this.password) return filename
    const basename: string = getBasenameFromFilename(filename)
    if (/[/\\?*:|"<>]/g.test(this.password)) {
      log.warn('The Password does contain invalid characters and cannot be included in the filename')
      return basename + '_ERR_INV_CHAR_IN_PW' + '.nzb'
    }
    return basename + '{{' + this.password + '}}' + '.nzb'
  }

  getAsTextFile(format: boolean = true, indentBy: number = 4): string {
    let nzbFile = NZB_FILE_HEADER
    nzbFile += nzbObjectToText({ head: this.nzbFile.head }, format, indentBy)
    nzbFile += nzbObjectToText({ '#comment': this.nzbFile['#comment'] }, format, indentBy)
    nzbFile += nzbObjectToText({ file: this.nzbFile.file }, format, indentBy)
    nzbFile += '</nzb>'
    return nzbFile
  }

  warn(error: string): void {
    this.errorMessage = error
    this.status = 'warn'
    this.log(this)
    log.warn(error)
    notifications.error(error)
  }

  success(): void {
    this.status = 'success'
    this.log(this)
    let successMessage = ''
    if (this.header !== '') successMessage = i18n.t('nzbsearch.success', [this.header])
    else if (this.filename !== '') successMessage = i18n.t('interception.success', [this.filename])
    log.info(successMessage)
    notifications.success(successMessage)
  }

  error(error: string): void {
    this.errorMessage = error
    this.status = 'error'
    this.log(this)
    log.error(error)
    notifications.error(error)
  }
}
