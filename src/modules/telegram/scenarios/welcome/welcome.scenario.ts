import { Injectable } from '@nestjs/common'
import * as TelegramBot from 'node-telegram-bot-api'
import { baseCommands, settingsCommands } from 'src/modules/telegram/commands'
import { TelegramService } from 'src/modules/telegram/telegram.service'
import { TelegramMessageHandlerType } from 'src/modules/telegram/telegram.types'
import { MealEventMessagesIncoming } from '../mealEvent/mealEvent.constants'
import { SettingsMessagesIncoming } from '../settings/settings.constants'
import { IScenarioInstance } from '../scenarios.types'
import { UserDocument, UserEntity } from 'src/entities'
import { WelcomeMessagesIncoming } from './message.constants'
import { SettingsService } from 'src/modules/settings'
import { MealEventService } from 'src/modules/mealEvent'
import { MESSAGES } from 'src/messages'
import { interpolate } from 'src/helpers'

@Injectable()
export class WelcomeScenario implements IScenarioInstance {
  messageHandlers: TelegramMessageHandlerType[]

  constructor(
    private readonly telegramService: TelegramService,
    private readonly userEntity: UserEntity,
    private readonly settingsService: SettingsService,
    private readonly mealEventService: MealEventService,
  ) {
    this.messageHandlers = [this.welcomeStart.bind(this)]
  }

  private getWelcomeMessage(user: UserDocument, message: TelegramBot.Message) {
    const isPrivate = message?.chat.type

    if (!!user) {
      const welcomeText = interpolate(MESSAGES.welcome.welcomeBack, { username: user?.username })

      return welcomeText
    }

    const welcomeText = isPrivate
      ? interpolate(MESSAGES.welcome.userGreeting, { username: message?.from?.username })
      : MESSAGES.unavailableMode

    const welcomeFinish = isPrivate ? MESSAGES.welcome.welcomeWithoutMealCount : ''

    const finalText = `
${welcomeText}
${welcomeFinish}
    `

    return finalText
  }

  private async welcomeStart(message: TelegramBot.Message) {
    const userId = `${message?.from?.id}`
    const user = await this.userEntity.getUser(userId)

    const text = this.getWelcomeMessage(user, message)

    if (!user && message?.from) {
      const { username, id, first_name, last_name, is_bot } = message?.from
      const payload = this.userEntity.getValidProperties({
        id: `${id}`,
        username,
        firstName: first_name,
        lastName: last_name,
        chatId: `${id}`,
        isBot: `${is_bot}`,
        isPremium: `${(message?.from as any)?.is_premium}`,
      })

      await this.userEntity.createOrUpdateUser(payload)
    }

    if (Object.values({ ...MealEventMessagesIncoming, ...SettingsMessagesIncoming }).includes(message?.text)) {
      return
    }

    if (message?.text?.indexOf(WelcomeMessagesIncoming.start) > -1) {
      const [settings, events] = await Promise.all([
        this.settingsService.getByUserId(userId),
        this.mealEventService.getTodayEvents(),
      ])

      const isNeedToUseSettigns = !settings?.mealsCountPerDay
      const isNeedToShowInfoAboutEvents = !events?.length

      const eventsText = isNeedToShowInfoAboutEvents ? MESSAGES.meal.mealTodayStartText : ''
      const countSettingsText = isNeedToUseSettigns ? MESSAGES.settings.setCountMessageTextStart : ''

      const remindsInfoText = `${countSettingsText}${MESSAGES.settings.setCountMessageTextEnd}`

      this.telegramService.sendMessage({
        data: message,
        message: `${MESSAGES.welcome.greeting}\n\n${remindsInfoText}\n\n${eventsText}`,
        options: isNeedToUseSettigns ? settingsCommands : baseCommands,
      })

      return { isFinal: true }
    }

    this.telegramService.sendMessage({ data: message, message: text, options: baseCommands })

    return { isFinal: true }
  }
}
