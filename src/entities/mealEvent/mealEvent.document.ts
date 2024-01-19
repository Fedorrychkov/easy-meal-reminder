import { Timestamp } from '@google-cloud/firestore'
import { MealEventStatus } from './mealEvent.types'

/**
 * В моделях сущностей не может быть undefined полей, это ограничение firestore, разрешен только null или значения
 */
export class MealEventDocument {
  static collectionName = 'meal-events'

  id: string
  userId: string
  status: MealEventStatus | null
  chatId?: string | null
  createdAt?: Timestamp | null
  updatedAt?: Timestamp | null
}
