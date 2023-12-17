import { isset } from '../functions/functions.js';
import options from '../settings/settings.js';

// function to check the nzb file completeness
export default (nzbFile) => {
  let settings = options.get();
  // prepare the files and segment counters
  let filesTotal = 0;
  let filesExpected = 0;
  let filesMissing = 0;
  let segmentsTotal = 0;
  let segmentsExpected = 0;
  let segmentsExpectedPerFile = 0;
  let segmentsMissing = 0;
  let segmentsMissingPercent = 0;
  // prepare the result object
  let result = {
    complete: true,
    error: false,
  };

  // if yes, check if it does contain files
  if (
    isset(() => nzbFile.nzb[0].file) &&
    typeof nzbFile.nzb[0].file === 'object'
  ) {
    // Threshold value for missing files or segments for rejection
    const fileThreshold = settings.completeness.fileCheckThreshold;
    const segmentThreshold = settings.completeness.segmentCheckThreshold / 100;
    // RegExp for the expected amounts of files, expected amount of files is in capturing group 2
    const reFilesExpected = new RegExp(
      '.*?[(\\[](\\d{1,4}) ?(?:\\/|of) ?(\\d{1,4})[)\\]].*?\\((\\d{1,4}) ?(?:\\/|of) ?(\\d{1,5})\\)',
      'i'
    );
    // RegExp for the expected segments per file, expected amount of segments is in capturing group 2
    const reSegmentsExpected = new RegExp(
      '.*\\((\\d{1,4}) ?(?:\\/|of) ?(\\d{1,5})\\)',
      'i'
    );
    // get the amount of files
    filesTotal = nzbFile.nzb[0].file.length;
    // loop through the files
    for (let file of nzbFile.nzb[0].file) {
      // check if the file subject contains the expected amount of files
      // if not, the filesExpected counter will remain 0
      if (isset(() => file.attr.subject) && file.attr.subject !== '') {
        if (reFilesExpected.test(file.attr.subject)) {
          // check if the found expected amount of files is bigger than an already found one
          // like this the highest number will be used e.g. in cases when an uploader subsequently has added more files
          if (
            Number(file.attr.subject.match(reFilesExpected)[2]) > filesExpected
          ) {
            // if yes, set filesExpected to the found value
            filesExpected = Number(file.attr.subject.match(reFilesExpected)[2]);
          }
        }
        // reset segmentsExpectedPerFile
        segmentsExpectedPerFile = 0;
        // check if the file subject contains the expected amount of segments for this file
        if (reSegmentsExpected.test(file.attr.subject)) {
          // if yes, set the value
          segmentsExpectedPerFile = Number(
            file.attr.subject.match(reSegmentsExpected)[2]
          );
        } else {
          // if not, we loop through the segments and get the highest number from the number attribute
          // this is not very accurate but still in some cases might give an indication for missing segments
          if (file.segments[0].segment === 'object') {
            for (let segment of file.segments[0].segment) {
              if (
                isset(() => segment.attr.number) &&
                segment.attr.number !== ''
              ) {
                if (Number(segment.attr.number) > segmentsExpectedPerFile) {
                  segmentsExpectedPerFile = Number(segment.attr.number);
                }
              }
            }
          }
        }
      }
      // add the segments of this file to the total amount of segments
      if (
        isset(() => file.segments[0].segment) &&
        typeof file.segments[0].segment === 'object'
      ) {
        segmentsTotal += file.segments[0].segment.length;
      }
      // add the expected segments for this file to the total amount of expected segments
      segmentsExpected += segmentsExpectedPerFile;
    }
    // calculate missing files and segments
    filesMissing =
      filesExpected - filesTotal > 0 ? filesExpected - filesTotal : 0;
    segmentsMissing =
      segmentsExpected - segmentsTotal > 0
        ? segmentsExpected - segmentsTotal
        : 0;
    segmentsMissingPercent =
      segmentsExpected - segmentsTotal > 0
        ? Math.round((segmentsMissing / segmentsExpected) * 100 * 100) / 100
        : 0;
    // if file check is enabled and missing files are above threshold, the nzb file is incomplete
    if (settings.completeness.fileCheck && filesMissing > fileThreshold) {
      result.error = `${chrome.i18n.getMessage(
        'error_nzbfileIncomplete'
      )}: ${filesMissing} ${chrome.i18n.getMessage('error_missingFiles')}`;
    }
    // if the nzb file does not contain any segments it is obviously incomplete
    if (segmentsTotal === 0) {
      result.error = chrome.i18n.getMessage('error_noSegments');
    }
    // if segment check is enabled and missing segments are above threshold, the nzb file is incomplete
    else if (
      settings.completeness.segmentCheck &&
      segmentsMissing / segmentsTotal > segmentThreshold
    ) {
      if (result.error) {
        result.error = `${result.error} ${chrome.i18n.getMessage(
          'general_and'
        )}`;
      } else {
        result.error = `${chrome.i18n.getMessage('error_nzbfileIncomplete')}`;
      }
      result.error = `${
        result.error
      } ${segmentsMissing} ${chrome.i18n.getMessage(
        'error_missingSegments'
      )} (${segmentsMissingPercent}%)`;
    }
  }
  // if the nzb file does not contain any files it is obviously incomplete
  else {
    result.error = chrome.i18n.getMessage('error_noFiles');
  }
  if (result.error) {
    result.complete = false;
  }
  result.filesTotal = filesTotal;
  result.filesExpected = filesExpected;
  result.filesMissing = filesMissing;
  result.segmentsTotal = segmentsTotal;
  result.segmentsExpected = segmentsExpected;
  result.segmentsMissing = segmentsMissing;
  result.segmentsMissingPercent = segmentsMissingPercent;
  return result;
};
