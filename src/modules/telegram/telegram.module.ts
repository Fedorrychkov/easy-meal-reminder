import { Module } from '@nestjs/common'
import { UserEntity } from 'src/entities'
import { MealEventModule } from '../mealEvent'
import { SettingsModule } from '../settings'
import { WelcomeScenario, MealScenario, MealEventsSchedule, MealNotification } from './scenarios'
import { SettingsScenario } from './scenarios/settings'
import { TelegramInstance } from './telegram.instance'
import { TelegramListener } from './telegram.listener'
import { TelegramService } from './telegram.service'

@Module({
  imports: [MealEventModule, SettingsModule],
  controllers: [],
  providers: [
    // Entities
    UserEntity,

    // Services
    TelegramInstance,
    TelegramListener,
    TelegramService,
    MealNotification,

    // Scenarios
    WelcomeScenario,
    MealScenario,
    SettingsScenario,

    // Schedules
    MealEventsSchedule,
  ],
  exports: [],
})
export class TelegramModule {}
