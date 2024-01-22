import { Injectable, Logger } from '@nestjs/common'
import { ScenariosStorage, SettingsScenario, WelcomeScenario } from './scenarios'
import { MealScenario } from './scenarios/mealEvent'
import { IScenarioInstance, StorageEntity } from './scenarios/scenarios.types'
import { TelegramInstance } from './telegram.instance'
import { TelegramMessageHandlerType } from './telegram.types'

@Injectable()
export class TelegramListener {
  private logger = new Logger(TelegramListener.name)
  private handlersMap: { entity?: StorageEntity; handlers: TelegramMessageHandlerType[] }[]

  constructor(
    private readonly telegramInstance: TelegramInstance,
    private readonly welcomeScenario: WelcomeScenario,
    private readonly mealScenario: MealScenario,
    private readonly settingsScenario: SettingsScenario,
    private readonly scenariosStorage: ScenariosStorage,
  ) {
    const scenarios: IScenarioInstance[] = [this.welcomeScenario, this.mealScenario, this.settingsScenario]

    this.handlersMap = scenarios.map((scenarios) => ({
      entity: scenarios?.entity || undefined,
      handlers: [...scenarios.messageHandlers],
    }))

    this.init()
  }

  private init() {
    this.telegramInstance.bot.on('message', async (data, metadata) => {
      this.logger.log('Get message', { data, metadata })

      const generalByEntity = this.handlersMap?.find((map) => this.scenariosStorage.checkIsLastEntity(map.entity))
      const otherEntities = this.handlersMap?.filter((map) => generalByEntity?.entity !== map?.entity)
      const finalHandlers = [
        ...(generalByEntity ? generalByEntity?.handlers : []),
        ...otherEntities?.map((item) => item.handlers).flat(),
      ]

      for await (const handler of finalHandlers || []) {
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
