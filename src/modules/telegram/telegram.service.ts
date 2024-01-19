import { Injectable, Logger } from '@nestjs/common'
import * as TelegramBot from 'node-telegram-bot-api'
import { TelegramInstance } from './telegram.instance'

@Injectable()
export class TelegramService {
  private logger: Logger = new Logger(TelegramService.name)

  constructor(private readonly telegramInstance: TelegramInstance) {}

  // public async sendAll(message: string) {
  //   if (!this.bot) {
  //     this.logger.warn('Telegram bot is not available')

  //     return
  //   }

  //   this.logger.log('[Telegram log, Before Send]', message)

  //   for await (const id of [...this.ids, ...this.temporaryIds]) {
  //     this.send(id, message)
  //   }
  // }

  public sendMessage({ id, message, data }: { id?: string; data: TelegramBot.Message; message: string }) {
    try {
      const parsedId = `${data?.chat?.id}`

      this.telegramInstance.bot.sendMessage(parsedId, message, {
        parse_mode: 'HTML',
      })
    } catch (error) {
      this.logger.warn(`Chat ${id} get error`, error)
    }
  }
}
