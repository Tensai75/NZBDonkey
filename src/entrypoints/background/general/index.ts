import registerNzblnkHandler from './nzblnkHandler'
import registerContextMenus from './registerContextMenus'

export default function (): void {
  registerContextMenus()
  registerNzblnkHandler()
}
