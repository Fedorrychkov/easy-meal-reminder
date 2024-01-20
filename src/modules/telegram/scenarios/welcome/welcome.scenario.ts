import { Injectable } from '@nestjs/common'
import * as TelegramBot from 'node-telegram-bot-api'
import { UserDocument, UserEntity } from 'src/entities'
import { baseCommands } from '../../commands'
import { TelegramService } from '../../telegram.service'
import { TelegramMessageHandlerType } from '../../telegram.types'
import { MealEventMessagesIncoming } from '../mealEvent/message.constants'
import { IScenarioInstance } from '../scenarios.types'
import { WelcomeMessagesIncoming } from './message.constants'
import { SettingsMessagesIncoming } from '../settings/settings.constants'
import { SettingsService } from 'src/modules/settings'
import { settingsCommands } from '../../commands/settings'
import { MealEventService } from 'src/modules/mealEvent'

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
      const welcomeText = `С возвращением, @${user?.username}, вы уже поели?`

      return welcomeText
    }

    const welcomeText = isPrivate
      ? `Welcome on aboard, @${message?.from?.username}`
      : 'Ого, меня включили не в личной переписке О_О. Я пока не поддерживаю такой вариант общения :( Пожалуйста, отпишите мне в личку ;)'

    const welcomeFinish = isPrivate ? 'Добро пожаловать, давайте начнем настраивать ваши приемы пищи?' : ''

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

      const eventsText = isNeedToShowInfoAboutEvents ? 'За сегодня, вы еще не ели ни разу? Давайте это исправлять!' : ''
      const countSettingsText = isNeedToUseSettigns
        ? 'Для корректной работы, вам нужно настроить количество приемов еды, чтобы я мог уведомлять вас заблоговременно!\n\n'
        : ''

      const remindsInfoText = `${countSettingsText}Обратите внимание, я начинаю уведомления от последнего зарегестрированного приема пищи`

      this.telegramService.sendMessage({
        data: message,
        message: `Приветствую! Я бот напоминающий о приемах пищи!\n\n${remindsInfoText}\n\n${eventsText}`,
        options: isNeedToUseSettigns ? settingsCommands : baseCommands,
      })

      return { isFinal: true }
    }

    this.telegramService.sendMessage({ data: message, message: text, options: baseCommands })

    return { isFinal: true }
  }
}
