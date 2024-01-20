import { TelegramMessageHandlerType } from '../telegram.types'

export interface IScenarioInstance {
  messageHandlers: TelegramMessageHandlerType[]
}

export type CommandType = Record<string, { text: string }>
