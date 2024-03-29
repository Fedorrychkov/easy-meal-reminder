import { Timestamp } from '@google-cloud/firestore'
import { Injectable, Logger } from '@nestjs/common'
import { MealEventEntity, MealEventStatus } from 'src/entities'
import { time } from 'src/helpers'

@Injectable()
export class MealEventService {
  private logger: Logger = new Logger(MealEventService.name)

  constructor(private readonly mealEventEntity: MealEventEntity) {}

  public async getTodayEvents(userId?: string, statuses: MealEventStatus[] = [MealEventStatus.CONFIRMED]) {
    const toDate = time().tz('Europe/Moscow').endOf('day')
    const fromDate = toDate.startOf('day')
    const events = await this.mealEventEntity.findAll({
      status: statuses,
      userId,
      fromDate: Timestamp.fromMillis(fromDate.valueOf()),
      toDate: Timestamp.fromMillis(toDate.valueOf()),
      createdAtOrderBy: 'asc',
    })

    return events
  }
}
