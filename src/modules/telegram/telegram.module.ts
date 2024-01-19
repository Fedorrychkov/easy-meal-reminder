import { Module } from '@nestjs/common'
import { MealEventEntity, UserEntity } from 'src/entities'
import { WelcomeScenario, MealScenario } from './scenarios'
import { TelegramInstance } from './telegram.instance'
import { TelegramListener } from './telegram.listener'
import { TelegramService } from './telegram.service'

@Module({
  imports: [],
  controllers: [],
  providers: [
    UserEntity,
    MealEventEntity,
    TelegramInstance,
    TelegramListener,
    TelegramService,
    WelcomeScenario,
    MealScenario,
  ],
  exports: [],
})
export class TelegramModule {}
