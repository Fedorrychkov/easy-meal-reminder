import { Injectable } from '@nestjs/common'
import * as TelegramBot from 'node-telegram-bot-api'
import { UserDocument, UserEntity } from 'src/entities'
import { baseCommands } from '../../commands'
import { TelegramService } from '../../telegram.service'
import { TelegramMessageHandlerType } from '../../telegram.types'
import { MealEventMessagesIncoming } from '../mealEvent/message.constants'
import { IScenarioInstance } from '../scenarios.types'
import { WelcomeMessagesIncoming } from './message.constants'

@Injectable()
export class WelcomeScenario implements IScenarioInstance {
  messageHandlers: TelegramMessageHandlerType[]

  constructor(private readonly telegramService: TelegramService, private readonly userEntity: UserEntity) {
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
    const user = await this.userEntity.getUser(`${message?.from?.id}`)

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

    if (Object.values(MealEventMessagesIncoming).includes(message?.text)) {
      return
    }

    if (message?.text?.indexOf(WelcomeMessagesIncoming.start) > -1) {
      this.telegramService.sendMessage({
        data: message,
        message: 'Попробуйте выбрать подходящую команду',
        options: baseCommands,
      })

      return
    }

    this.telegramService.sendMessage({ data: message, message: text })

    return { isFinal: true }
  }
}
