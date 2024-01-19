import * as dayjs from 'dayjs'
import { Injectable } from '@nestjs/common'
import * as TelegramBot from 'node-telegram-bot-api'
import { UserDocument, UserEntity } from 'src/entities'
import { TelegramService } from '../../telegram.service'
import { TelegramMessageHandlerType } from '../../telegram.types'
import { IScenarioInstance } from '../scenarios.types'
import { Timestamp } from '@google-cloud/firestore'

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
      const dueDateMillis = dayjs().valueOf()
      const createdAt = Timestamp.fromMillis(dueDateMillis)
      const { username, id, first_name, last_name, is_bot } = message?.from
      const payload = this.userEntity.getValidProperties({
        id: `${id}`,
        username,
        firstName: first_name,
        lastName: last_name,
        chatId: `${id}`,
        isBot: `${is_bot}`,
        isPremium: `${(message?.from as any)?.is_premium}`,
        createdAt,
      })

      await this.userEntity.createOrUpdateUser(payload)
    }

    this.telegramService.sendMessage({ data: message, message: text })

    return { isFinal: true }
  }
}
