import firebase from 'firebase-admin'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { CollectionReference, Timestamp } from '@google-cloud/firestore'
import { UserDocument } from './user.document'
import { time } from 'src/helpers'

@Injectable()
export class UserEntity {
  private logger: Logger = new Logger(UserEntity.name)

  constructor(
    @Inject(UserDocument.collectionName)
    private userCollection: CollectionReference<UserDocument>,
  ) {}

  async getUser(id: string): Promise<UserDocument | null> {
    const snapshot = await this.userCollection.doc(id).get()

    if (!snapshot.exists) {
      return null
    } else {
      return snapshot.data()
    }
  }

  async createOrUpdateUser(user: UserDocument) {
    const userDocument = await this.userCollection.doc(user.id)
    await userDocument.set(user)

    return user
  }

  private findAllGenerator() {
    const collectionRef = this.userCollection
    const query: firebase.firestore.Query<UserDocument> = collectionRef

    return query
  }

  async findAll(): Promise<UserDocument[]> {
    const list: UserDocument[] = []
    let query = this.findAllGenerator()

    query = query.orderBy('createdAt', 'desc')
    const snapshot = await query.get()
    snapshot.forEach((doc) => list.push(doc.data()))

    return list
  }

  getValidProperties(user: UserDocument) {
    const dueDateMillis = time().valueOf()
    const createdAt = Timestamp.fromMillis(dueDateMillis)

    return {
      id: user.id,
      chatId: user.chatId,
      username: user.username || null,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      isPremium: user.isPremium || null,
      isBot: user.isBot || null,
      phone: user.phone || null,
      createdAt: user.createdAt || createdAt,
      updatedAt: user.updatedAt || null,
    }
  }
}
