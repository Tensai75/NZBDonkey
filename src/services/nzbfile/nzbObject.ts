import { version } from '@@/package.json'
import { XMLBuilder, XMLParser } from 'fast-xml-parser/src/fxp'

export interface NZBObject {
  'xmlns'?: string
  'head'?: NZBHeadObject
  'file': NZBFileObject[]
  '#comment'?: string[] // Optional comments at the NZB root level
}

export interface NZBHeadObject {
  'meta': NZBMetaObject[]
  '#comment'?: string[] // Optional comment within the head element
}

export interface NZBMetaObject {
  'type': string
  '#text': string
}

export interface NZBFileObject {
  'poster': string
  'date': number
  'subject': string
  'groups': NZBGroupObject[]
  'segments': NZBSegmentsObject
  '#comment'?: string[] // Optional comment inside file elements
}

export interface NZBGroupObject {
  'group': string | string[]
  '#comment'?: string[] // Optional comment inside groups
}

export interface NZBSegmentsObject {
  'segment': NZBSegmentObject[]
  '#comment'?: string[] // Optional comment inside segments
}

export interface NZBSegmentObject {
  'number': number
  'bytes': number
  'text': string // This is the Message-ID
  '#comment'?: string[] // Optional comment inside segment
}

export const NZB_FILE_HEADER = `<?xml version="1.0" encoding="UTF-8"?>
  <!DOCTYPE nzb PUBLIC "-//newzBin//DTD NZB 1.1//EN" "http://www.newzbin.com/DTD/nzb/nzb-1.1.dtd">
  <nzb xmlns="http://www.newzbin.com/DTD/2003/nzb">
  <!-- created with NZBDonkey v${version} -->
  `
const xmlConverterOptions = {
  attributeNamePrefix: '',
  ignoreAttributes: false,
  allowBooleanAttributes: true,
  parseAttributeValue: true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isArray: (name: string, jpath: string, isLeafNode: boolean, isAttribute: boolean): boolean => {
    if (['meta', 'file', 'group', 'segment', 'comment'].includes(name)) return true
    return false
  },
  textNodeName: '#text',
  commentPropName: '#comment',
}

export const textToNzbObject = (text: string): NZBObject => {
  const parser = new XMLParser(xmlConverterOptions)
  let xmlObject
  try {
    xmlObject = parser.parse(text)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    throw new Error('not a valid XML file')
  }
  if (!xmlObject.nzb) throw new Error('not a valid NZB file')
  return xmlObject.nzb as NZBObject
}

export const nzbObjectToText = (
  nzbObject: object | undefined,
  format: boolean = true,
  indentBy: number = 4
): string => {
  const builder = new XMLBuilder({ format: format, indentBy: ' '.repeat(indentBy), ...xmlConverterOptions })
  let text: string
  try {
    text = builder.build(nzbObject)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    throw new Error('not a valid NZBObject')
  }
  return text
}
