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
  /**
   * formatted string.
   * Currently looks like 10:00-22:00 (it means from 10:00 to 22:00), Or 22:00-4:00 - it means today and next day times period work
   */
  mealPeriodTimes?: string | null
  createdAt?: Timestamp | null
  updatedAt?: Timestamp | null
}
