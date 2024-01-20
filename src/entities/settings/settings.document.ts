import { Timestamp } from '@google-cloud/firestore'

/**
 * В моделях сущностей не может быть undefined полей, это ограничение firestore, разрешен только null или значения
 */
export class SettingsDocument {
  static collectionName = 'settings'

  id: string
  userId: string
  mealsCountPerDay?: number | null
  isNotificationEnabled?: boolean | null
  createdAt?: Timestamp | null
  updatedAt?: Timestamp | null
}
