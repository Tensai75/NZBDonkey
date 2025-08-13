import { Settings } from '@/services/general/settings'

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
  // test if the selection contains a description for the header starting with some common words used for and ending with a colon or a vertical bar
  let customHeaderSearchTerms = settings.textSelection.header.join('|')
  customHeaderSearchTerms = customHeaderSearchTerms != '' ? customHeaderSearchTerms + '|' : ''
  const headerRegexpString = `^(?:${customHeaderSearchTerms}header|subje[ck]t|betreff|files?(?: name)?)(?:\\s|:)*(.*?)$`
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
    customTitleSearchTerms = customTitleSearchTerms != '' ? customTitleSearchTerms + '|' : ''
    const titleRegexpString = `^(?:${customTitleSearchTerms}titel|title)(?:\\s|:)*(.*?)$`
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
    customPasswordSearchTerms = customPasswordSearchTerms != '' ? customPasswordSearchTerms + '|' : ''
    const passwordRegexpString = `^(?:${customPasswordSearchTerms}passwor[td]|pw|(?:file )?pass)(?:\\s|:)*(.*?)$`
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
  // Remove all formatting tags like <b>, <i>, etc., but keep their inner text/content
  const formattingTags = ['b', 'i', 'u', 'em', 'strong', 'mark', 'small', 'del', 'ins', 'sub', 'sup', 'span', 'font']
  formattingTags.forEach((tag) => {
    const elements = Array.from(fragment.querySelectorAll(tag))
    elements.forEach((el) => {
      // Move all children before the formatting element (merging with surrounding content)
      while (el.firstChild) {
        el.parentNode?.insertBefore(el.firstChild, el)
      }
      el.parentNode?.removeChild(el)
    })
  })
  // Remove all empty text nodes and merge adjacent text nodes
  fragment.normalize()
  // Add a line break "\n" to the end of each text node
  const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_TEXT)
  let node: Text | null = walker.nextNode() as Text | null
  while (node) {
    node.textContent += '\n'
    node = walker.nextNode() as Text | null
  }
  return fragment
}

function cleanText(text: string): string {
  return text
    .split('\n') // Break into lines
    .map(
      (line) =>
        line
          .replace(/\t+/g, ' ') // Replace tabs with a space
          .replace(/ {2,}/g, ' ') // Collapse multiple spaces
          .trim() // Trim each line
    )
    .join('\n') // Recombine
    .replace(/\n{2,}/g, '\n') // Collapse multiple line breaks
    .trim() // Final trim of full result
}
