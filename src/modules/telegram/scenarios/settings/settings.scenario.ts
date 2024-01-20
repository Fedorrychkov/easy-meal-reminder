import { Injectable } from '@nestjs/common'
import * as TelegramBot from 'node-telegram-bot-api'
import { SettingsEntity, UserEntity } from 'src/entities'
import { getNumber } from 'src/helpers'
import { SettingsService } from 'src/modules/settings'
import { baseCommands } from '../../commands'
import { settingsCommands } from '../../commands/settings'
import { TelegramService } from '../../telegram.service'
import { TelegramMessageHandlerType } from '../../telegram.types'
import { IScenarioInstance } from '../scenarios.types'
import { availableMealCounts, SettingMealsMessageIncomingCount, SettingsMessagesIncoming } from './settings.constants'

@Injectable()
export class SettingsScenario implements IScenarioInstance {
  messageHandlers: TelegramMessageHandlerType[]

  constructor(
    private readonly telegramService: TelegramService,
    private readonly userEntity: UserEntity,
    private readonly settingsService: SettingsService,
    private readonly settingsEntity: SettingsEntity,
  ) {
    this.messageHandlers = [this.settings.bind(this)]
  }

  private async settings(message: TelegramBot.Message) {
    const user = await this.userEntity.getUser(`${message?.from?.id}`)

    if (!Object.values(SettingsMessagesIncoming).includes(message?.text)) {
      return
    }

    if (Object.values(SettingMealsMessageIncomingCount).includes(message?.text)) {
      const count = parseFloat(getNumber(message?.text))
      const settings = await this.settingsService.getByUserId(user.id)

      const isValidNumber = !Number.isNaN(count) ? availableMealCounts?.findIndex((item) => count === item) > -1 : false

      const payload = this.settingsEntity.getValidProperties({
        ...settings,
        userId: user.id,
        mealsCountPerDay: count,
      })

      await this.settingsService.createOrUpdate(payload)

      this.telegramService.sendMessage({
        data: message,
        message: isValidNumber ? `Количество приемов в ${count}/день успешно установлено` : 'Попробуйте еще раз',
        options: isValidNumber ? baseCommands : settingsCommands,
      })

      return { isFinal: true }
    }

    if (SettingsMessagesIncoming.main === message?.text) {
      this.telegramService.sendMessage({
        data: message,
        message: 'Выберите необходимую команду',
        options: baseCommands,
      })

      return { isFinal: true }
    }

    // if (message?.text?.indexOf(WelcomeMessagesIncoming.start) > -1) {
    //   this.telegramService.sendMessage({
    //     data: message,
    //     message: 'Попробуйте выбрать подходящую команду',
    //     options: baseCommands,
    //   })

    //   return
    // }

    this.telegramService.sendMessage({ data: message, message: 'test', options: settingsCommands })

    return { isFinal: true }
  }
}
