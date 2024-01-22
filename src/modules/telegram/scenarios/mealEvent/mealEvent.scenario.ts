import { Injectable } from '@nestjs/common'
import * as TelegramBot from 'node-telegram-bot-api'
import { MealEventEntity, MealEventStatus, UserDocument, UserEntity } from 'src/entities'
import { declOfNum, getUniqueId, interpolate } from 'src/helpers'
import { MESSAGES, declWords } from 'src/messages'
import { MealEventService } from 'src/modules/mealEvent'
import { SettingsHelper, SettingsService } from 'src/modules/settings'
import { baseCommands } from '../../commands'
import { settingsMealsCommands } from '../../commands/settings'
import { TelegramService } from '../../telegram.service'
import { TelegramMessageHandlerType } from '../../telegram.types'
import { IScenarioInstance } from '../scenarios.types'
import { MealEventMessagesIncoming } from './mealEvent.constants'

@Injectable()
export class MealScenario implements IScenarioInstance {
  messageHandlers: TelegramMessageHandlerType[]

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
    const [events, settings] = await Promise.all([
      this.mealEventService.getTodayEvents(user.id),
      this.settingsService.getByUserId(user.id),
    ])

    if (status !== MealEventStatus.CONFIRMED) {
      return {
        isNeedToAddMealsCount: !settings?.mealsCountPerDay,
        text: MESSAGES.unavailableCommandCurrently,
      }
    }

    const payload = this.mealEventEntity.getValidProperties({
      id: getUniqueId(),
      userId: user.id,
      status: MealEventStatus.CONFIRMED,
      chatId: `${message.chat.id}`,
    })

    await this.mealEventEntity.createOrUpdate(payload)

    const mealCountFromSettings = settings?.mealsCountPerDay || MESSAGES.settings.unavailableSettled
    const countSum = events?.length + 1

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
                  reminderMinute: 30,
                  reminderWord: declOfNum(30, declWords.minutes),
                })}`
              : ''
          }`
    }`

    const needAddMealText = isNeedToAddMealsCount ? MESSAGES.settings.tryToSetCount : ''

    const text = `${successText}\n\n${needAddMealText}${muchText}`

    return {
      isNeedToAddMealsCount: !settings?.mealsCountPerDay,
      text,
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
