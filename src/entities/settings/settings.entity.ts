import firebase from 'firebase-admin'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { CollectionReference, Timestamp } from '@google-cloud/firestore'
import { SettingsDocument } from './settings.document'
import { getUniqueId, time } from 'src/helpers'

@Injectable()
export class SettingsEntity {
  private logger: Logger = new Logger(SettingsEntity.name)

  constructor(
    @Inject(SettingsDocument.collectionName)
    private settingsCollection: CollectionReference<SettingsDocument>,
  ) {}

  public async getSettingByUser(userId: string): Promise<SettingsDocument | null> {
    const collectionRef = this.settingsCollection
    const query: firebase.firestore.Query<SettingsDocument> = collectionRef
    const list: SettingsDocument[] = []

    const snapshot = await query.where('userId', '==', userId).get()

    snapshot.forEach((doc) => list.push(doc.data()))

    return list?.[0]
  }

  public async createOrUpdate(setting: SettingsDocument) {
    const document = await this.settingsCollection.doc(setting.id)
    await document.set(setting)

    return setting
  }

  public async getUpdate(id: string) {
    const doc = await this.settingsCollection.doc(id)
    const snapshot = await doc.get()

    if (!snapshot.exists) {
      return { doc: null, data: null }
    } else {
      return { doc, data: snapshot.data() }
    }
  }

  public getValidProperties(setting: SettingsDocument) {
    const dueDateMillis = time().valueOf()
    const createdAt = Timestamp.fromMillis(dueDateMillis)

    return {
      id: setting.id || getUniqueId(),
      userId: setting.userId,
      mealsCountPerDay: setting.mealsCountPerDay || null,
      mealPeriodTimes: setting.mealPeriodTimes || null,
      isNotificationEnabled:
        typeof setting.isNotificationEnabled === 'undefined' ? true : setting.isNotificationEnabled,
      createdAt: setting.createdAt || createdAt,
      updatedAt: setting.updatedAt || null,
    }
  }
}
