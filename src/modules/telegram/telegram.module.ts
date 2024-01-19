import { Module } from '@nestjs/common'
import { UserEntity } from 'src/entities'
import { WelcomeScenario } from './scenarios'
import { TelegramInstance } from './telegram.instance'
import { TelegramListener } from './telegram.listener'
import { TelegramService } from './telegram.service'

@Module({
  imports: [],
  controllers: [],
  providers: [UserEntity, TelegramInstance, TelegramListener, TelegramService, WelcomeScenario],
  exports: [],
})
export class TelegramModule {}
