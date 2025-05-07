import { NZBObject } from './nzbObject'
import { Settings as NZBFileSettings } from './settings'

import { i18n } from '#i18n'

export type ValidateResults = {
  complete: boolean
  error: Error | undefined
  filesTotal: number
  filesExpected: number
  filesMissing: number
  segmentsTotal: number
  segmentsExpected: number
  segmentsMissing: number
  segmentsMissingPercent: number
}

export const validateNZBFile = (nzbFile: NZBObject, settings: NZBFileSettings) => {
  // prepare the files and segment counters
  let filesTotal = 0
  let filesExpected = 0
  let filesMissing = 0
  let segmentsTotal = 0
  let segmentsExpected = 0
  let segmentsExpectedPerFile = 0
  let segmentsMissing = 0
  let segmentsMissingPercent = 0
  let errorString = ''
  // prepare the result object
  const result: ValidateResults = {
    complete: true,
    error: undefined,
    filesTotal: 0,
    filesExpected: 0,
    filesMissing: 0,
    segmentsTotal: 0,
    segmentsExpected: 0,
    segmentsMissing: 0,
    segmentsMissingPercent: 0,
  }

  // if yes, check if it does contain files
  if (nzbFile.file && typeof nzbFile.file === 'object') {
    // Threshold value for missing files or segments for rejection
    const fileThreshold = settings.fileCheckThreshold
    const segmentThreshold = settings.segmentCheckThreshold / 100
    // RegExp for the expected amounts of files, expected amount of files is in capturing group 2
    const reFilesExpected = new RegExp(
      '.*?[(\\[](\\d{1,4}) ?(?:\\/|of) ?(\\d{1,4})[)\\]].*?\\((\\d{1,4}) ?(?:\\/|of) ?(\\d{1,5})\\)',
      'i'
    )
    // RegExp for the expected segments per file, expected amount of segments is in capturing group 2
    const reSegmentsExpected = new RegExp('.*\\((\\d{1,4}) ?(?:\\/|of) ?(\\d{1,5})\\)', 'i')
    // get the amount of files
    filesTotal = nzbFile.file.length
    // loop through the files
    for (const file of nzbFile.file) {
      // check if the file subject contains the expected amount of files
      // if not, the filesExpected counter will remain 0
      if (file.subject && file.subject !== '') {
        if (reFilesExpected.test(file.subject)) {
          // check if the found expected amount of files is bigger than an already found one
          // like this the highest number will be used e.g. in cases when an uploader subsequently has added more files
          const files = file.subject.match(reFilesExpected)
          if (files && files[2] && Number(files[2]) > filesExpected) {
            // if yes, set filesExpected to the found value
            filesExpected = Number(files[2])
          }
        }
        // reset segmentsExpectedPerFile
        segmentsExpectedPerFile = 0
        // check if the file subject contains the expected amount of segments for this file
        if (reSegmentsExpected.test(file.subject)) {
          // if yes, set the value
          const segments = file.subject.match(reSegmentsExpected)
          if (segments && segments[2] && Number(segments[2])) segmentsExpectedPerFile = Number(segments[2])
        } else {
          // if not, we loop through the segments and get the highest number from the number attribute
          // this is not very accurate but still in some cases might give an indication for missing segments
          if (file.segments.segment.length) {
            for (const segment of file.segments.segment) {
              if (segment.number) {
                if (segment.number > segmentsExpectedPerFile) {
                  segmentsExpectedPerFile = segment.number
                }
              }
            }
          }
        }
      }
      // add the segments of this file to the total amount of segments
      if (file.segments && file.segments.segment.length) {
        segmentsTotal += file.segments.segment.length
      }
      // add the expected segments for this file to the total amount of expected segments
      segmentsExpected += segmentsExpectedPerFile
    }
    // calculate missing files and segments
    filesMissing = filesExpected - filesTotal > 0 ? filesExpected - filesTotal : 0
    segmentsMissing = segmentsExpected - segmentsTotal > 0 ? segmentsExpected - segmentsTotal : 0
    segmentsMissingPercent =
      segmentsExpected - segmentsTotal > 0 ? Math.round((segmentsMissing / segmentsExpected) * 100 * 100) / 100 : 0
    // if file check is enabled and missing files are above threshold, the nzb file is incomplete
    if (settings.fileCheck && filesMissing > fileThreshold) {
      errorString = `${i18n.t('validation.nzbFileIncomplete')}: ${i18n.t('validation.missingFiles', [filesMissing])}`
    }
    // if the nzb file does not contain any segments it is obviously incomplete
    if (segmentsTotal === 0) {
      errorString = i18n.t('validation.noSegments')
    }
    // if segment check is enabled and missing segments are above threshold, the nzb file is incomplete
    else if (settings.segmentCheck && segmentsMissing / segmentsTotal > segmentThreshold) {
      if (errorString !== '') {
        errorString += ` ${i18n.t('common.and')} `
      } else {
        errorString = `${i18n.t('validation.nzbFileIncomplete')}: `
      }
      errorString += `${i18n.t('validation.missingSegments', [segmentsMissing])} (${segmentsMissingPercent}%)`
    }
  }
  // if the nzb file does not contain any files it is obviously incomplete
  else {
    errorString = i18n.t('validation.noFiles')
  }

  if (errorString !== '') {
    result.error = new Error(errorString)
    result.complete = false
  }
  result.filesTotal = filesTotal
  result.filesExpected = filesExpected
  result.filesMissing = filesMissing
  result.segmentsTotal = segmentsTotal
  result.segmentsExpected = segmentsExpected
  result.segmentsMissing = segmentsMissing
  result.segmentsMissingPercent = segmentsMissingPercent
  return result
}
