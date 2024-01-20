import firebase from 'firebase-admin'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { CollectionReference, Timestamp } from '@google-cloud/firestore'
import { MealEventDocument } from './mealEvent.document'
import { getUniqueId, time } from 'src/helpers'
import { MealEventFilterOptions } from './dto'

@Injectable()
export class MealEventEntity {
  private logger: Logger = new Logger(MealEventEntity.name)

  constructor(
    @Inject(MealEventDocument.collectionName)
    private mealEventCollection: CollectionReference<MealEventDocument>,
  ) {}

  async getUser(id: string): Promise<MealEventDocument | null> {
    const snapshot = await this.mealEventCollection.doc(id).get()

    if (!snapshot.exists) {
      return null
    } else {
      return snapshot.data()
    }
  }

  async createOrUpdate(event: MealEventDocument) {
    const document = await this.mealEventCollection.doc(event.id)
    await document.set(event)

    return event
  }

  private findAllGenerator(options?: MealEventFilterOptions) {
    const collectionRef = this.mealEventCollection
    let query: firebase.firestore.Query<MealEventDocument> = collectionRef

    if (options?.status) {
      const optionStr = !Array.isArray(options?.status) ? '==' : 'in'
      query = query.where('status', optionStr, options.status)
    }

    if (options?.fromDate) {
      query = query.where('createdAt', '>=', options?.fromDate)
    }

    if (options?.toDate) {
      query = query.where('createdAt', '<=', options?.toDate)
    }

    if (options?.userId) {
      query = query.where('userId', '==', options?.userId)
    }

    return query
  }

  async findAll(options?: MealEventFilterOptions): Promise<MealEventDocument[]> {
    const list: MealEventDocument[] = []
    let query = this.findAllGenerator(options)
    const { createdAtOrderBy = 'desc' } = options

    query = query.orderBy('createdAt', createdAtOrderBy)
    const snapshot = await query.get()
    snapshot.forEach((doc) => list.push(doc.data()))

    return list
  }

  getValidProperties(event: MealEventDocument) {
    const dueDateMillis = time().valueOf()
    const createdAt = Timestamp.fromMillis(dueDateMillis)

    return {
      id: event.id || getUniqueId(),
      userId: event.userId,
      chatId: event.chatId || null,
      status: event.status || null,
      createdAt: event.createdAt || createdAt,
      updatedAt: event.updatedAt || null,
    }
  }
}
