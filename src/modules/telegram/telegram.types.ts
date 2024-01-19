import * as TelegramBot from 'node-telegram-bot-api'

export type TelegramMessageHandlerReturnType =
  | Promise<{
      message?: TelegramBot.Message
      metadata?: TelegramBot.Metadata
      options?: Record<string, unknown>
      isFinal?: boolean
    }>
  | undefined

export type TelegramMessageHandlerType = (
  message: TelegramBot.Message,
  metadata: TelegramBot.Metadata,
) => TelegramMessageHandlerReturnType
