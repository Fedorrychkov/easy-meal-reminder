import { Injectable } from '@nestjs/common'
import * as TelegramBot from 'node-telegram-bot-api'
import { SettingsEntity, UserEntity } from 'src/entities'
import { getNumber } from 'src/helpers'
import { MealEventService } from 'src/modules/mealEvent'
import { mealPeriodInHour, SettingsService } from 'src/modules/settings'
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
    private readonly mealEventService: MealEventService,
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
      const [settings, events] = await Promise.all([
        this.settingsService.getByUserId(user.id),
        await this.mealEventService.getTodayEvents(),
      ])

      const isValidNumber = !Number.isNaN(count) ? availableMealCounts?.findIndex((item) => count === item) > -1 : false

      if (isValidNumber) {
        const payload = this.settingsEntity.getValidProperties({
          ...settings,
          userId: user.id,
          mealsCountPerDay: count,
        })

        await this.settingsService.createOrUpdate(payload)
      }

      const mealRegisteredText = `За сегодня было зарегистрировано ${events?.length} приемов пищи`
      const reminderPeriodInHour = mealPeriodInHour / count

      const isNeedInfoAboutReminds = count > 1 && isValidNumber
      const periodInMinutes = reminderPeriodInHour * 60
      const reminderPeriodText = isNeedInfoAboutReminds
        ? `Судя по выбранному количеству приемов в день, вам нужно кушать каждые ${periodInMinutes} минут`
        : ''

      const reminderNotificationText =
        isNeedInfoAboutReminds && settings?.isNotificationEnabled
          ? `Вы будете получать уведомления за 30 минут каждые ${periodInMinutes} минут`
          : ''

      this.telegramService.sendMessage({
        data: message,
        message: isValidNumber
          ? `Количество приемов в ${count}/день успешно установлено\n\n${mealRegisteredText}\n\n${reminderPeriodText}\n\n${reminderNotificationText}`
          : 'Попробуйте еще раз',
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

    if (SettingsMessagesIncoming.mealRemindsDrop === message?.text) {
      const settings = await this.settingsService.getByUserId(user.id)

      const payload = this.settingsEntity.getValidProperties({
        ...settings,
        userId: user.id,
        isNotificationEnabled: false,
      })

      await this.settingsService.createOrUpdate(payload)

      this.telegramService.sendMessage({
        data: message,
        message: `Уведомления отключены, включить можете нажав на кнопку или написав "${SettingsMessagesIncoming.mealRemindsStart}"`,
        options: baseCommands,
      })

      return { isFinal: true }
    }

    if (SettingsMessagesIncoming.mealRemindsStart === message?.text) {
      const settings = await this.settingsService.getByUserId(user.id)

      const payload = this.settingsEntity.getValidProperties({
        ...settings,
        userId: user.id,
        isNotificationEnabled: true,
      })

      await this.settingsService.createOrUpdate(payload)

      this.telegramService.sendMessage({
        data: message,
        message: `Уведомления включены, отключить можете нажав на кнопку или написав "${SettingsMessagesIncoming.mealRemindsDrop}"`,
        options: baseCommands,
      })

      return { isFinal: true }
    }

    this.telegramService.sendMessage({
      data: message,
      message:
        'В настройках вы можете указать количество приемов пищи, для управления уведомления перейдите на главную',
      options: settingsCommands,
    })

    return { isFinal: true }
  }
}
