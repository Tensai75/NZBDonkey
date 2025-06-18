import { Settings } from '@/services/general/settings'
import log from '@/services/logger/debugLogger'

export function analyseText(settings: Settings): {
  selection: string
  header: string
  password: string
  title: string
} {
  let selection: string = ''
  let header: string = ''
  let password: string = ''
  let title: string = ''
  let test: RegExpMatchArray | null
  const range = document.createRange()
  range.selectNodeContents(cleanFragment(getSelectionFragment()))
  selection = cleanText(range.toString())
  log.info(selection)
  // test if the selection contains a description for the header starting with some common words used for and ending with a colon or a vertical bar
  let customHeaderSearchTerms = settings.textSelection.header.join('|')
  customHeaderSearchTerms = customHeaderSearchTerms != '' ? '|' + customHeaderSearchTerms : ''
  const headerRegexpString = `(?:^\\s*(?:header|subje[ck]t|betreff|files?${customHeaderSearchTerms}) ?.*?(?::|\\s)+)+"?(\\S.*\\S)"?$`
  const headerRegexp = new RegExp(headerRegexpString, 'im')
  if (headerRegexp.test(selection)) {
    // set the header to the text after the description
    // we search for any text until we find it and then get all of it until the next line break
    // like this we will find the header information either if placed on the same line or if placed on the next line
    // we also take care of if the description is used twice (e.g. before the hidden tag and in the hidden tag again)
    test = selection.match(headerRegexp)
    header = test ? test[1] : ''
  }

  // test if the selection contains a NZB file name in the format of nzbfilename{{password}}
  // we first assume that the NZB file name is on its own line
  test = selection.match(/^(.*){{(.*?)}}/m)
  if (test) {
    // set the title and password according to the NZB filename
    title = test[1]
    password = test[2]
    // check if maybe there is nevertheless a leading description and remove it from the title
    // assuming that the leading description includes the word NZB and ends with a colon
    if (/.*nzb.*:\s*/i.test(title)) {
      title = title.replace(/.*nzb.*:\s*/i, '')
    }
    // if no NZB file name was found the title and password have to be set by another way
  } else {
    // first check if there is actually a title prefix
    let customTitleSearchTerms = settings?.textSelection.title.join('|')
    customTitleSearchTerms = customTitleSearchTerms != '' ? '|' + customTitleSearchTerms : ''
    const titleRegexpString = `(?:^\\s?(?:titel|title${customTitleSearchTerms}) ?.*?(?::|\\s)+)+(\\S.*\\S)$`
    const titleRegexp = new RegExp(titleRegexpString, 'im')
    test = selection.match(titleRegexp)
    if (test) {
      title = test[1]
    } else {
      // if not, simply set title to the first line of the selection
      title = selection.split('\n')[0]
    }
    // test if the selection contains a description for the password starting with some common words used for and ending with a colon or a vertical bar
    let customPasswordSearchTerms = settings.textSelection.password.join('|')
    customPasswordSearchTerms = customPasswordSearchTerms != '' ? '|' + customPasswordSearchTerms : ''
    const passwordRegexpString = `(?:^\\s?(?:passwor[td]|pw|pass${customPasswordSearchTerms}) ?.*?(?::|\\s)+)+(\\S.*\\S)$`
    const passwordRegexp = new RegExp(passwordRegexpString, 'im')
    test = selection.match(passwordRegexp)
    if (test) {
      // set the password to the text after the description
      // we search for any text until we find it and then get all of it until the next line break
      // like this we will find the password either if placed on the same line or if placed on the next line
      // we also take care of if the description is used twice (e.g. before the hidden tag and in the hidden tag again)
      password = test[1]
    }
  }
  return {
    selection: selection,
    header: header ? header : title ? title : '',
    password: password ? password : '',
    title: title ? title : '',
  }
}

function getSelectionFragment(): DocumentFragment {
  let html = new DocumentFragment()
  if (typeof window.getSelection !== 'undefined') {
    const sel = window.getSelection()
    if (sel?.rangeCount) {
      html = sel.getRangeAt(0).cloneContents()
    }
  }
  return html
}

function cleanFragment(fragment: DocumentFragment): DocumentFragment {
  // Replace all textarea elements
  const textareas = fragment.querySelectorAll('textarea')
  textareas.forEach((textarea) => {
    const pre = document.createElement('pre')
    pre.textContent = (textarea as HTMLTextAreaElement).value
    textarea.replaceWith(pre)
  })
  // Replace all input[type="text"] elements
  const textInputs = fragment.querySelectorAll('input[type="text"]')
  textInputs.forEach((input) => {
    const span = document.createElement('span')
    span.textContent = (input as HTMLInputElement).value
    input.replaceWith(span)
  })
  // Replace <br> tags with a line break
  const brs = fragment.querySelectorAll('br')
  brs.forEach((br) => {
    const lineBreak = document.createTextNode('\n')
    br.replaceWith(lineBreak)
  })
  // Remove <script> tags
  const scripts = fragment.querySelectorAll('script')
  scripts.forEach((script) => {
    script.remove()
  })
  return fragment
}

function cleanText(text: string): string {
  return text
    .split('\n') // Break into lines
    .map((line) => line.trim()) // Trim each line
    .join('\n') // Recombine
    .replace(/\t+/g, ' ') // Replace tabs with a space
    .replace(/ {2,}/g, ' ') // Collapse multiple spaces
    .replace(/\n{2,}/g, '\n') // Collapse multiple line breaks
    .trim() // Final trim of full result
}
