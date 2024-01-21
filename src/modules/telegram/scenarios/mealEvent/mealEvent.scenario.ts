import { Injectable } from '@nestjs/common'
import * as TelegramBot from 'node-telegram-bot-api'
import { MealEventEntity, MealEventStatus, UserDocument, UserEntity } from 'src/entities'
import { getUniqueId } from 'src/helpers'
import { MealEventService } from 'src/modules/mealEvent'
import { mealPeriodInHour, SettingsService } from 'src/modules/settings'
import { baseCommands } from '../../commands'
import { settingsCommands } from '../../commands/settings'
import { TelegramService } from '../../telegram.service'
import { TelegramMessageHandlerType } from '../../telegram.types'
import { IScenarioInstance } from '../scenarios.types'
import { MealEventMessagesIncoming } from './message.constants'

@Injectable()
export class MealScenario implements IScenarioInstance {
  messageHandlers: TelegramMessageHandlerType[]

  constructor(
    private readonly telegramService: TelegramService,
    private readonly mealEventEntity: MealEventEntity,
    private readonly userEntity: UserEntity,
    private readonly mealEventService: MealEventService,
    private readonly settingsService: SettingsService,
  ) {
    this.messageHandlers = [this.meals.bind(this)]
  }

  private async mealStart(message: TelegramBot.Message, user: UserDocument) {
    const [events, settings] = await Promise.all([
      this.mealEventService.getTodayEvents(user.id),
      this.settingsService.getByUserId(user.id),
    ])

    const payload = this.mealEventEntity.getValidProperties({
      id: getUniqueId(),
      userId: user.id,
      status: MealEventStatus.CONFIRMED,
      chatId: `${message.chat.id}`,
    })

    await this.mealEventEntity.createOrUpdate(payload)

    const mealCountFromSettings = settings?.mealsCountPerDay || 'не установлено'
    const countSum = events?.length + 1

    let muchText = ''

    // TODO-tech-debt: need to refactor this text logic
    if (settings?.mealsCountPerDay && settings?.mealsCountPerDay <= countSum) {
      const isEqual = settings?.mealsCountPerDay === countSum
      const isMuch = settings?.mealsCountPerDay < countSum
      muchText = `${
        isEqual
          ? 'Вы достигли назначенной цели, поздаврялем! Возвращайтесь завтра, чтобы продолжить контролировать количество приемов еды ;)'
          : ''
      }${
        isMuch
          ? `Вы съели на ${
              countSum - settings?.mealsCountPerDay
            } раз(а) больше, чем требуется. Рекоммендуем остановиться на сегодня, чтобы не нарушить график :(`
          : ''
      }`
    }

    const isNeedToAddMealsCount = !settings?.mealsCountPerDay
    const isNeedInfoAboutReminds = settings?.mealsCountPerDay > 1
    const reminderPeriodInHour = mealPeriodInHour / settings?.mealsCountPerDay

    const periodInMinutes = parseInt(`${reminderPeriodInHour * 60}`)

    const successText = `Прием пищи успешно сохранен ${countSum}/${mealCountFromSettings} ${
      muchText
        ? ''
        : `${
            isNeedInfoAboutReminds ? `, следующий прием еды через ${periodInMinutes} минут, напомним за 30 минут` : ''
          }`
    }`

    const needAddMealText = isNeedToAddMealsCount
      ? 'У вас не установлено количество приемов пищи в день, давайте установим?'
      : ''

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
      const { isNeedToAddMealsCount, text } = await this.mealStart(message, user)

      this.telegramService.sendMessage({
        data: message,
        message: text,
        options: isNeedToAddMealsCount ? settingsCommands : baseCommands,
      })

      return { isFinal: true }
    }

    this.telegramService.sendMessage({ data: message, message: 'test', options: baseCommands })

    return { isFinal: true }
  }
}
