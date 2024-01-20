import { Timestamp } from '@google-cloud/firestore'
import { Injectable, Logger } from '@nestjs/common'
import { SettingsDocument, SettingsEntity } from 'src/entities'
import { time } from 'src/helpers'

@Injectable()
export class SettingsService {
  private logger: Logger = new Logger(SettingsService.name)

  constructor(private readonly settingsEntity: SettingsEntity) {}

  public async getByUserId(userId: string) {
    return await this.settingsEntity.getSettingByUser(userId)
  }

  public async createOrUpdate(settings: SettingsDocument) {
    const { doc, data } = await this.settingsEntity.getUpdate(settings.id)

    if (!doc) {
      return await this.settingsEntity.createOrUpdate(settings)
    }

    const dueDateMillis = time().valueOf()
    const updatedAt = Timestamp.fromMillis(dueDateMillis)

    const payload = this.settingsEntity.getValidProperties({
      ...data,
      ...settings,
      updatedAt,
    })

    await doc.update({ ...payload })
  }
}
