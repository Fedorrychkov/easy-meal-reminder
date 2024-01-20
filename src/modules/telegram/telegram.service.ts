import { Injectable, Logger } from '@nestjs/common'
import * as TelegramBot from 'node-telegram-bot-api'
import { TelegramInstance } from './telegram.instance'

@Injectable()
export class TelegramService {
  private logger: Logger = new Logger(TelegramService.name)

  constructor(private readonly telegramInstance: TelegramInstance) {}

  public sendMessage({
    id,
    message,
    data,
    options,
  }: {
    id?: string
    data?: TelegramBot.Message
    message: string
    options?: TelegramBot.SendMessageOptions
  }) {
    try {
      const parsedId = `${data?.chat?.id || id}`

      if (!parsedId) {
        this.logger.error('Unavailable chat id to send message')

        return
      }

      this.telegramInstance.bot.sendMessage(parsedId, message, {
        parse_mode: 'HTML',
        ...options,
      })
    } catch (error) {
      this.logger.warn(`Chat ${id} get error`, error)
    }
  }
}
