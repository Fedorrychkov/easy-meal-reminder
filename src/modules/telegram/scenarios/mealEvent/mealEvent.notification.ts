import { Injectable, Logger } from '@nestjs/common'
import TelegramBot from 'node-telegram-bot-api'
import { baseCommands } from '../../commands'
import { TelegramService } from '../../telegram.service'

@Injectable()
export class MealNotification {
  private logger = new Logger(MealNotification.name)

  constructor(private readonly telegramService: TelegramService) {}

  public async mealNotificationSend(chatId: string, message: string, options?: TelegramBot.SendMessageOptions) {
    this.logger.log(`[mealNotificationSend]: Сообщение отправлено в chatId: ${chatId}`, { message })

    this.telegramService.sendMessage({ id: chatId, message, options: options || baseCommands })
  }
}
