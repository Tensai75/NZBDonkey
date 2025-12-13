import registerConnectionTestHandler from './connectionTestHandler'
import registerNzblnkHandler from './nzblnkHandler'
import registerContextMenus from './registerContextMenus'
import searchEnginesUpdate from './searchEnginesUpdate'

export default function (): void {
  registerContextMenus()
  registerNzblnkHandler()
  registerConnectionTestHandler()
  searchEnginesUpdate()
}
