import { Injectable, Logger } from '@nestjs/common'
import { WelcomeScenario } from './scenarios'
import { MealScenario } from './scenarios/mealEvent'
import { TelegramInstance } from './telegram.instance'
import { TelegramMessageHandlerType } from './telegram.types'

@Injectable()
export class TelegramListener {
  private logger = new Logger(TelegramListener.name)
  private handlers: TelegramMessageHandlerType[]

  constructor(
    private readonly telegramInstance: TelegramInstance,
    private readonly welcomeScenario: WelcomeScenario,
    private readonly mealScenario: MealScenario,
  ) {
    this.handlers = [...this.welcomeScenario.messageHandlers, ...this.mealScenario.messageHandlers]

    this.init()
  }

  private init() {
    this.telegramInstance.bot.on('message', async (data, metadata) => {
      this.logger.log('Get message', { data, metadata })

      for await (const handler of this.handlers || []) {
        const result = await handler(data, metadata)

        if (result) {
          this.logger.log('Get result from message handler', { result })
        }

        if (result?.isFinal) {
          break
        }
      }
    })
  }
}
