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
  '#text': string // This is the Message-ID
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
  } catch {
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
  } catch {
    throw new Error('not a valid NZBObject')
  }
  return text
}

export const mergeNZBObjects = (nzbObjects: NZBObject[]): NZBObject => {
  let mergedNzb: NZBObject = {
    xmlns: 'http://www.newzbin.com/DTD/2003/nzb',
    head: {
      meta: [],
    },
    file: [],
  }

  nzbObjects.forEach((nzb) => {
    if (nzb.head?.meta) {
      mergedNzb.head!.meta.push(...nzb.head.meta)
    }
    if (nzb.file) {
      nzb.file.forEach((file) => {
        mergedNzb.file.push(file)
      })
    }
  })

  // Remove duplicates in meta
  mergedNzb = makeMetaUnique(mergedNzb)

  // Remove duplicates in file
  mergedNzb = makeFilesUnique(mergedNzb)

  return mergedNzb
}

export const mergeNZBFileObjects = (files: NZBFileObject[]): NZBFileObject[] => {
  const fileMap = new Map<string, NZBFileObject>()

  files.forEach((file) => {
    const existingFile = fileMap.get(file.subject)

    if (existingFile) {
      // Merge segments from both files
      const allSegments = [...existingFile.segments.segment, ...file.segments.segment]

      // Update the existing file with merged segments and latest metadata
      fileMap.set(file.subject, {
        ...file, // Use latest file's metadata (poster, date, groups)
        segments: {
          ...file.segments,
          segment: allSegments,
        },
      })
    } else {
      fileMap.set(file.subject, file)
    }
  })

  return Array.from(fileMap.values())
}

export const makeMetaUnique = (nzb: NZBObject): NZBObject => {
  const uniqueMeta = Array.from(new Set(nzb.head?.meta?.map((m) => JSON.stringify(m)) || [])).map((m) => JSON.parse(m))
  return {
    ...nzb,
    head: {
      ...nzb.head,
      meta: uniqueMeta,
    },
  }
}

export const makeFilesUnique = (nzb: NZBObject): NZBObject => {
  // First merge files with same subject
  const mergedFiles = mergeNZBFileObjects(nzb.file)

  // Then deduplicate segments within each file
  const filesWithUniqueSegments = mergedFiles.map((file) => ({
    ...file,
    segments: {
      ...file.segments,
      segment: makeSegmentsUnique(file.segments.segment),
    },
  }))

  return {
    ...nzb,
    file: filesWithUniqueSegments,
  }
}

export const makeSegmentsUnique = (segments: NZBSegmentObject[]): NZBSegmentObject[] => {
  const uniqueSegments = Array.from(new Map(segments.map((segment) => [segment['#text'], segment])).values())
  return uniqueSegments.sort((a, b) => a.number - b.number)
}
