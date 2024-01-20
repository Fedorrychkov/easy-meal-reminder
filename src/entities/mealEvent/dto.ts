import { OrderByDirection } from '@google-cloud/firestore'
import { MealEventDocument } from './mealEvent.document'
import { MealEventStatus } from './mealEvent.types'

export type MealEventFilterOptions = {
  status?: MealEventStatus | MealEventStatus[]
  userId?: string
  fromDate?: MealEventDocument['createdAt']
  toDate?: MealEventDocument['createdAt']
  createdAtOrderBy?: OrderByDirection
}
