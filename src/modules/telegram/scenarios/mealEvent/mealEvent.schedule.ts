import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { MealEventDocument } from 'src/entities'
import { time } from 'src/helpers'
import { MealEventService } from 'src/modules/mealEvent'

@Injectable()
export class MealEventsSchedule {
  private readonly logger: Logger = new Logger(MealEventsSchedule.name)

  constructor(private readonly mealEventService: MealEventService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async getMealEvents() {
    const events = await this.mealEventService.getTodayEvents()

    const eventsByUsers = new Map<string, MealEventDocument[] | undefined>()

    events?.forEach((event) => {
      const definedEvents = eventsByUsers?.get(event.userId) || []

      eventsByUsers.set(event.userId, [...definedEvents, event])
    })

    const userMaps = [...(eventsByUsers.entries() || [])].map(([userId, events]) => {
      return {
        userId,
        events,
      }
    })

    const times = userMaps?.[0]?.events?.map((event) => time.unix((event.createdAt as any)?._seconds))

    console.log(userMaps, times, 'userMaps')
  }
}
