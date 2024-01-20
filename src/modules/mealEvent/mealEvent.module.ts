import { Module } from '@nestjs/common'
import { MealEventEntity } from 'src/entities'
import { MealEventService } from './mealEvent.service'

@Module({
  imports: [],
  controllers: [],
  providers: [MealEventEntity, MealEventService],
  exports: [MealEventService, MealEventEntity],
})
export class MealEventModule {}
