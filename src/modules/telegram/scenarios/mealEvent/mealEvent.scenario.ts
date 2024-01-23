import { Timestamp } from '@google-cloud/firestore'
import { Injectable } from '@nestjs/common'
import * as TelegramBot from 'node-telegram-bot-api'
import { MealEventEntity, MealEventStatus, UserDocument, UserEntity } from 'src/entities'
import { declOfNum, getUniqueId, interpolate, time } from 'src/helpers'
import { MESSAGES, declWords } from 'src/messages'
import { MealEventService } from 'src/modules/mealEvent'
import {
  continueSkippedMealPeriodInMinute,
  nextMealReminderStandartPeriodInMinute,
  SettingsHelper,
  SettingsService,
} from 'src/modules/settings'
import { baseCommands } from '../../commands'
import { settingsMealsCommands } from '../../commands/settings'
import { TelegramService } from '../../telegram.service'
import { TelegramMessageHandlerType } from '../../telegram.types'
import { IScenarioInstance, StorageEntity } from '../scenarios.types'
import { MealEventMessagesIncoming } from './mealEvent.constants'

@Injectable()
export class MealScenario implements IScenarioInstance {
  messageHandlers: TelegramMessageHandlerType[]
  public entity = StorageEntity.meal

  constructor(
    private readonly telegramService: TelegramService,
    private readonly mealEventEntity: MealEventEntity,
    private readonly userEntity: UserEntity,
    private readonly mealEventService: MealEventService,
    private readonly settingsService: SettingsService,
    private readonly settingsHelper: SettingsHelper,
  ) {
    this.messageHandlers = [this.meals.bind(this)]
  }

  private async mealProceed(message: TelegramBot.Message, user: UserDocument, status: MealEventStatus) {
    try {
      const [events, settings] = await Promise.all([
        this.mealEventService.getTodayEvents(user.id, [MealEventStatus.CONFIRMED, MealEventStatus.SKIPPED]),
        this.settingsService.getByUserId(user.id),
      ])

      const reversedEvents = [...(events || [])]?.reverse()
      const confirmedEvents = events?.filter((event) => event.status === MealEventStatus.CONFIRMED)

      const [lastEvent] = reversedEvents

      const isLastSkipped = lastEvent && lastEvent?.status === MealEventStatus.SKIPPED

      const dueDateMillis = time().valueOf()
      const updatedAt = Timestamp.fromMillis(dueDateMillis)

      const payload = this.mealEventEntity.getValidProperties(
        isLastSkipped
          ? {
              ...lastEvent,
              status,
              updatedAt,
            }
          : {
              id: isLastSkipped ? lastEvent.id : getUniqueId(),
              userId: user.id,
              status: status,
              chatId: `${message.chat.id}`,
            },
      )

      await this.mealEventEntity.createOrUpdate(payload)

      const mealCountFromSettings = settings?.mealsCountPerDay || MESSAGES.settings.unavailableSettled
      const countSum = confirmedEvents?.length + 1

      let muchText = ''

      // TODO-tech-debt: need to refactor this text logic
      if (settings?.mealsCountPerDay && settings?.mealsCountPerDay <= countSum) {
        const isEqual = settings?.mealsCountPerDay === countSum
        const isMuch = settings?.mealsCountPerDay < countSum
        muchText = `${isEqual ? MESSAGES.meal.maxMeal : ''}${
          isMuch
            ? interpolate(MESSAGES.meal.overloadMeals, {
                count: countSum - settings?.mealsCountPerDay,
                word: declOfNum(countSum - settings?.mealsCountPerDay, ['раз', 'раза', 'раз']),
              })
            : ''
        }`
      }

      const isNeedToAddMealsCount = !settings?.mealsCountPerDay
      const isNeedInfoAboutReminds = settings?.mealsCountPerDay > 1
      const { difference } = this.settingsHelper.tryToGetDifferenceAndParsedPeriod(settings.mealPeriodTimes)

      const periodInMinutes = difference / settings?.mealsCountPerDay

      const successText = `${interpolate(MESSAGES.meal.successfullySaved, {
        count: countSum,
        maxCount: mealCountFromSettings,
      })} ${
        muchText
          ? ''
          : `${
              isNeedInfoAboutReminds
                ? `, ${interpolate(MESSAGES.meal.nextMeal, {
                    nextPeriod: periodInMinutes,
                    periodWord: declOfNum(periodInMinutes, declWords.minutes),
                    reminderMinute: nextMealReminderStandartPeriodInMinute,
                    reminderWord: declOfNum(nextMealReminderStandartPeriodInMinute, declWords.minutes),
                  })}`
                : ''
            }`
      }`

      const skippedText = interpolate(MESSAGES.meal.successfullySkipped, {
        reminderMinute: continueSkippedMealPeriodInMinute,
        reminderWord: declOfNum(continueSkippedMealPeriodInMinute, declWords.minutes),
      })

      const needAddMealText = isNeedToAddMealsCount ? MESSAGES.settings.tryToSetCount : ''

      const text = `${status === MealEventStatus.SKIPPED ? skippedText : successText}\n\n${needAddMealText}${muchText}`

      return {
        isNeedToAddMealsCount: !settings?.mealsCountPerDay,
        text,
      }
    } catch {
      return {
        text: MESSAGES.errors.internalError,
      }
    }
  }

  private async meals(message: TelegramBot.Message) {
    if (!Object.values(MealEventMessagesIncoming)?.includes(message?.text)) {
      return
    }

    const user = await this.userEntity.getUser(`${message?.from?.id}`)

    if (MealEventMessagesIncoming.mealStart === message?.text) {
      const { isNeedToAddMealsCount, text } = await this.mealProceed(message, user, MealEventStatus.CONFIRMED)

      this.telegramService.sendMessage({
        data: message,
        message: text,
        options: isNeedToAddMealsCount ? settingsMealsCommands : baseCommands,
      })

      return { isFinal: true }
    }

    if (MealEventMessagesIncoming.mealLater === message?.text) {
      const { isNeedToAddMealsCount, text } = await this.mealProceed(message, user, MealEventStatus.SKIPPED)

      this.telegramService.sendMessage({
        data: message,
        message: text,
        options: isNeedToAddMealsCount ? settingsMealsCommands : baseCommands,
      })

      return { isFinal: true }
    }

    this.telegramService.sendMessage({ data: message, message: MESSAGES.unavailableCommand, options: baseCommands })

    return { isFinal: true }
  }
}
