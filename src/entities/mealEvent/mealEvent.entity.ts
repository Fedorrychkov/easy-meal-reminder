import { Inject, Injectable, Logger } from '@nestjs/common'
import { CollectionReference, Timestamp } from '@google-cloud/firestore'
import { MealEventDocument } from './mealEvent.document'
import { getUniqueId, time } from 'src/helpers'

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
