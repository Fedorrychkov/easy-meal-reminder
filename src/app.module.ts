import { ScheduleModule } from '@nestjs/schedule'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TelegramModule } from './modules/telegram'
import { FirestoreModule } from './services'
import { MealEventModule } from './modules/mealEvent'
import { isProduction } from './env'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: isProduction ? '.env' : '.env.stage',
    }),
    FirestoreModule.forRoot({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        keyFilename: configService.get<string>('SA_KEY'),
      }),
      inject: [ConfigService],
    }),
    TelegramModule,
    MealEventModule,
  ],
})
export class AppModule {}
