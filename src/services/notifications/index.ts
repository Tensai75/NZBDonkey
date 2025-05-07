import { notification } from './functions'

export default {
  error: (message: string, id: string = '') => notification(2, message, id),
  success: (message: string, id: string = '') => notification(1, message, id),
  info: (message: string, id: string = '') => notification(0, message, id),
}
