import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as TelegramBot from 'node-telegram-bot-api'

@Injectable()
export class TelegramInstance {
  private token: string
  public bot: TelegramBot

  constructor(
    @Inject(ConfigService)
    public configService: ConfigService,
  ) {
    this.token = configService.get<string>('TELEGRAM_BOT_KEY')

    if (!this.token) {
      throw new Error('Empty telegram bot token')
    }

    this.bot = new TelegramBot(this.token, { polling: true })

    process.env.NTBA_FIX_319 = '1'
  }
}
