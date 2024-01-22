import { declWords, MESSAGES } from 'src/messages'
import { Injectable } from '@nestjs/common'
import * as TelegramBot from 'node-telegram-bot-api'
import { SettingsEntity, UserEntity } from 'src/entities'
import { declOfNum, getNumber, interpolate } from 'src/helpers'
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

      const mealRegisteredText = interpolate(MESSAGES.meal.mealTodayRegisteredTimes, { count: events?.length || 0 })
      const reminderPeriodInHour = mealPeriodInHour / count

      const isNeedInfoAboutReminds = count > 1 && isValidNumber
      const periodInMinutes = parseInt(`${reminderPeriodInHour * 60}`)
      const reminderPeriodText = isNeedInfoAboutReminds
        ? interpolate(MESSAGES.meal.mealReminderMinutesRecommend, {
            reminderPeriod: periodInMinutes,
            reminderMinute: declOfNum(periodInMinutes, declWords.minutes),
          })
        : ''

      const reminderNotificationText =
        isNeedInfoAboutReminds && settings?.isNotificationEnabled
          ? interpolate(MESSAGES.meal.mealReminderInfoText, {
              reminderPeriond: 30,
              reminderMinute: declOfNum(30, declWords.minutes),
              reminderUserPeriod: periodInMinutes,
              reminderMinutePeriod: declOfNum(periodInMinutes, declWords.minutes),
            })
          : ''

      this.telegramService.sendMessage({
        data: message,
        message: isValidNumber
          ? `${interpolate(MESSAGES.settings.successfullySettled, {
              count,
            })}\n\n${mealRegisteredText}\n\n${reminderPeriodText}\n\n${reminderNotificationText}`
          : MESSAGES.tryAgain,
        options: isValidNumber ? baseCommands : settingsCommands,
      })

      return { isFinal: true }
    }

    if (SettingsMessagesIncoming.main === message?.text) {
      this.telegramService.sendMessage({
        data: message,
        message: MESSAGES.chooseCommand,
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
        message: interpolate(MESSAGES.settings.notificationsSuccessfullyDisabled, {
          command: SettingsMessagesIncoming.mealRemindsStart,
        }),
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
        message: interpolate(MESSAGES.settings.notificationsSuccessfullyEnabled, {
          command: SettingsMessagesIncoming.mealRemindsDrop,
        }),
        options: baseCommands,
      })

      return { isFinal: true }
    }

    this.telegramService.sendMessage({
      data: message,
      message: MESSAGES.settings.info,
      options: settingsCommands,
    })

    return { isFinal: true }
  }
}
