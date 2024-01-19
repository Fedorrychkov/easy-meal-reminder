import { Injectable } from '@nestjs/common'
import * as TelegramBot from 'node-telegram-bot-api'
import { MealEventEntity } from 'src/entities'
import { baseCommands } from '../../commands'
import { TelegramService } from '../../telegram.service'
import { TelegramMessageHandlerType } from '../../telegram.types'
import { IScenarioInstance } from '../scenarios.types'
import { MealEventMessagesIncoming } from './message.constants'

@Injectable()
export class MealScenario implements IScenarioInstance {
  messageHandlers: TelegramMessageHandlerType[]

  constructor(private readonly telegramService: TelegramService, private readonly mealEventEntity: MealEventEntity) {
    this.messageHandlers = [this.mealStart.bind(this)]
  }

  private async mealStart(message: TelegramBot.Message) {
    if (!Object.values(MealEventMessagesIncoming)?.includes(message?.text)) {
      return
    }

    const text = 'await'

    this.telegramService.sendMessage({ data: message, message: text, options: baseCommands })

    return { isFinal: true }
  }
}
