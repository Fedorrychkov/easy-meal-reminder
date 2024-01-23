import { declWords, MESSAGES } from 'src/messages'
import { Injectable, Logger } from '@nestjs/common'
import * as TelegramBot from 'node-telegram-bot-api'
import { SettingsEntity, UserEntity } from 'src/entities'
import { declOfNum, getNumber, interpolate } from 'src/helpers'
import { MealEventService } from 'src/modules/mealEvent'
import { nextMealReminderStandartPeriodInMinute, SettingsHelper, SettingsService } from 'src/modules/settings'
import { baseCommands } from '../../commands'
import { mainSettingsCommands, settingsMealsCommands } from '../../commands/settings'
import { TelegramService } from '../../telegram.service'
import { TelegramMessageHandlerType } from '../../telegram.types'
import { IScenarioInstance, StorageEntity } from '../scenarios.types'
import { availableMealCounts, SettingMealsMessageIncomingCount, SettingsMessagesIncoming } from './settings.constants'
import { ScenariosStorage } from '../scenarios.storage'

@Injectable()
export class SettingsScenario implements IScenarioInstance {
  private logger = new Logger(SettingsScenario.name)
  public messageHandlers: TelegramMessageHandlerType[]
  public entity = StorageEntity.settings

  constructor(
    private readonly telegramService: TelegramService,
    private readonly userEntity: UserEntity,
    private readonly settingsService: SettingsService,
    private readonly mealEventService: MealEventService,
    private readonly settingsEntity: SettingsEntity,
    private readonly settingsHelper: SettingsHelper,
    private readonly scenariosStorage: ScenariosStorage,
  ) {
    this.messageHandlers = [this.settings.bind(this)]
  }

  private async settings(message: TelegramBot.Message) {
    const user = await this.userEntity.getUser(`${message?.from?.id}`)

    const { isPeriodTimeScenario } = this.scenariosStorage.getStore(StorageEntity.settings)

    if (isPeriodTimeScenario) {
      try {
        const { from, to } = this.settingsHelper.tryToParsePeriodUserText(message?.text)
        const difference = this.settingsHelper.tryToGetPeriodDifferenceInMinutes({ from, to })

        this.logger.log(
          `[isPeriodTimeScenario]: Пользователю ${user.id} с ником ${user.username} установил свой промежуток времени работы`,
          { from, to, difference },
        )

        const settings = await this.settingsService.getByUserId(user.id)

        const periodsText = `${from.h}:${from.m}-${to.h}:${to.m}`

        const payload = this.settingsEntity.getValidProperties({
          ...settings,
          mealPeriodTimes: periodsText,
          userId: user.id,
        })

        await this.settingsService.createOrUpdate(payload)

        this.telegramService.sendMessage({
          data: message,
          message: MESSAGES.settings.customTimePeriodSuccessfullySaved,
          options: mainSettingsCommands,
        })

        this.scenariosStorage.clearStore(StorageEntity.settings)

        return { isFinal: true }
      } catch (error) {
        this.telegramService.sendMessage({
          data: message,
          message: error?.message,
          options: mainSettingsCommands,
        })
      }

      return { isFinal: true }
    }

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
      const { difference } = this.settingsHelper.tryToGetDifferenceAndParsedPeriod(settings.mealPeriodTimes)
      const periodInMinutes = difference / count

      const isNeedInfoAboutReminds = count > 1 && isValidNumber
      const reminderPeriodText = isNeedInfoAboutReminds
        ? interpolate(MESSAGES.meal.mealReminderMinutesRecommend, {
            reminderPeriod: periodInMinutes,
            reminderMinute: declOfNum(periodInMinutes, declWords.minutes),
          })
        : ''

      const reminderNotificationText =
        isNeedInfoAboutReminds && settings?.isNotificationEnabled
          ? interpolate(MESSAGES.meal.mealReminderInfoText, {
              reminderPeriond: nextMealReminderStandartPeriodInMinute,
              reminderMinute: declOfNum(nextMealReminderStandartPeriodInMinute, declWords.minutes),
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
        options: isValidNumber ? mainSettingsCommands : settingsMealsCommands,
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

    if (SettingsMessagesIncoming.mealCountsSize === message?.text) {
      this.telegramService.sendMessage({
        data: message,
        message: MESSAGES.settings.setMealCountsSizeWelcome,
        options: settingsMealsCommands,
      })

      return { isFinal: true }
    }

    if (SettingsMessagesIncoming.mealPeriodTime === message?.text) {
      const settings = await this.settingsService.getByUserId(user.id)

      this.scenariosStorage.updateStore(StorageEntity.settings, { isPeriodTimeScenario: true })

      this.telegramService.sendMessage({
        data: message,
        message: interpolate(MESSAGES.settings.setCustomTimePeriodInfo, {
          currentTimePeriod: `${settings?.mealPeriodTimes || '10:00-22:00'} (MSC)`,
        }),
        options: mainSettingsCommands,
      })

      return { isFinal: true }
    }

    this.telegramService.sendMessage({
      data: message,
      message: MESSAGES.settings.info,
      options: mainSettingsCommands,
    })

    return { isFinal: true }
  }
}
