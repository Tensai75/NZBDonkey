import analyseSelectionHandler from './analyseSelectionHandler'
import nzblnkHandler from './nzblnkHandler'
import sendToContextMenuHandler from './sendToContextMenuHandler'

export default function (): void {
  analyseSelectionHandler()
  nzblnkHandler()
  sendToContextMenuHandler()
}
