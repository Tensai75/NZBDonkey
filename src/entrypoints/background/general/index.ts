import connectionTestHandler from './connectionTestHandler'
import registerNzblnkHandler from './nzblnkHandler'
import registerContextMenus from './registerContextMenus'
import searchEnginesUpdate from './searchEnginesUpdate'

export default function (): void {
  registerContextMenus()
  registerNzblnkHandler()
  connectionTestHandler()
  searchEnginesUpdate()
}
