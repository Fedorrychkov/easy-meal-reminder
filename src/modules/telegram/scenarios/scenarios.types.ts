import { TelegramMessageHandlerType } from '../telegram.types'

export interface IScenarioInstance {
  messageHandlers: TelegramMessageHandlerType[]
  entity?: StorageEntity
}

export type CommandType = Record<string, { text: string }>

export enum StorageEntity {
  settings = 'settings',
}
