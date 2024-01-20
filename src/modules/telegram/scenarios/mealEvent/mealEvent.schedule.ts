import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { Dayjs } from 'dayjs'
import { MealEventDocument, SettingsDocument, UserDocument, UserEntity } from 'src/entities'
import { time } from 'src/helpers'
import { MealEventService } from 'src/modules/mealEvent'
import { mealPeriodInHour, SettingsService } from 'src/modules/settings'
import { settingsCommands } from '../../commands/settings'
import { MealNotification } from './mealEvent.notification'

@Injectable()
export class MealEventsSchedule {
  private readonly logger: Logger = new Logger(MealEventsSchedule.name)

  private notificationMealSended = new Map<string, boolean>()
  private notificationMealStartSended = new Map<string, number>()
  private notificationMealCountPerDatSended = new Map<string, number>()

  constructor(
    private readonly mealEventService: MealEventService,
    private readonly settingsService: SettingsService,
    private readonly userEntity: UserEntity,
    private readonly mealNotification: MealNotification,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkMealsByUsersToday() {
    const users = await this.userEntity.findAll()

    await Promise.allSettled(
      users?.map(async (user) => {
        const [events, settings] = await Promise.all([
          this.mealEventService.getTodayEvents(),
          this.settingsService.getByUserId(user.id),
        ])

        const currentDateInstance = time()

        const currentDate = currentDateInstance.format('MM/DD/YYYY')

        const formattedStartNotificationTime = '10:00:00'
        const formattedCurrentNotificationDatetime = `${currentDate} ${formattedStartNotificationTime}`

        const isNeedToPushNotification = time(formattedCurrentNotificationDatetime).isBefore(currentDateInstance)

        // Если время еще не 10 утра (по мск по сути) или нотификации выключены, то уведомления не посылаем.
        if (!isNeedToPushNotification || !settings?.isNotificationEnabled) {
          return
        }

        const isSkipNext = await this.sendMealStartNotification({
          user,
          settings,
          currentDate,
          currentDateInstance,
          events,
        })

        if (isSkipNext) {
          return
        }

        await this.sendMealsCountPerDayNotification({ user, settings, currentDate, currentDateInstance })
      }),
    )
  }

  // EVERY 2 MINUTES
  @Cron('0 */2 * * * *')
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

    await Promise.allSettled(
      userMaps?.map(async (eventByUser) => {
        const { userId, events } = eventByUser
        const [user, settings] = await Promise.all([
          this.userEntity.getUser(userId),
          this.settingsService.getByUserId(userId),
        ])

        if (!settings?.isNotificationEnabled) {
          this.logger.log(`Пользователь ${user.id} с ником ${user.username} отключил уведомления`)

          return
        }

        if (!settings?.mealsCountPerDay) {
          this.logger.log(`Пользователь ${user.id} с ником ${user.username} не установил количество приемов пищи`)

          // TODO: Добавить уведомления 1 раз в день об установке количества приемов пищи (начать уведомлять через день после регистрации)
          return
        }

        if (events?.length >= settings?.mealsCountPerDay) {
          this.logger.log(`Пользователь ${user.id} с ником ${user.username} уже выполнил план за день`)

          return
        }

        const reversedEvents = [...events?.reverse()]

        const reminderPeriodInMinutes = (mealPeriodInHour / settings?.mealsCountPerDay) * 60
        const [lastEvent] = reversedEvents

        const key = `${user.id}-${lastEvent.id}`
        const isSended = this.notificationMealSended.get(key) || false

        if (isSended) {
          return
        }

        const diff = Math.round(time.unix((lastEvent.createdAt as any)?._seconds).diff(time()) / 1000)
        const minutes = Math.floor(diff / 60)

        const isNeedToSend = minutes - -reminderPeriodInMinutes < 30

        if (isNeedToSend) {
          await this.mealNotification.mealNotificationSend(
            user.chatId,
            'Не забудьте покушать! Следующий прием пищи ожидается в течении 30 минут ;)',
          )

          this.notificationMealSended.set(key, true)
        }
      }),
    )
  }

  private async sendMealsCountPerDayNotification({
    user,
    settings,
    currentDate,
    currentDateInstance,
  }: {
    user: UserDocument
    settings: SettingsDocument
    currentDate: string
    currentDateInstance: Dayjs
  }) {
    const isToday = time.unix((user.createdAt as any)?._seconds).isToday()

    if ((settings?.mealsCountPerDay && settings?.mealsCountPerDay > 0) || isToday) {
      return false
    }

    const key = `${user.id}-${currentDate}`

    const lastTodayNotification = this.notificationMealCountPerDatSended.get(key)

    if (lastTodayNotification) {
      this.logger.log(
        `Пользователь ${user.id} с ником ${user.username} уже получал уведомления о необходимости настроить интервалы еды`,
      )

      return false
    }

    const countSettingsText =
      'Для корректной работы, вам нужно настроить количество приемов еды, чтобы я мог уведомлять вас заблоговременно!\n\n'

    const remindsInfoText = `${countSettingsText}Обратите внимание, я начинаю уведомления от последнего зарегестрированного приема пищи`

    await this.mealNotification.mealNotificationSend(user.chatId, `${remindsInfoText}`, settingsCommands)

    this.notificationMealCountPerDatSended.set(key, currentDateInstance.valueOf())

    return true
  }

  private async sendMealStartNotification({
    user,
    settings,
    events,
    currentDate,
    currentDateInstance,
  }: {
    user: UserDocument
    settings: SettingsDocument
    events: MealEventDocument[]
    currentDate: string
    currentDateInstance: Dayjs
  }) {
    const key = `${user.id}-${currentDate}`

    // Не нужно отправлять уведомления о напоминании еды, если прием пищи уже был зарегистрирован
    if (events?.length > 0) {
      this.logger.log(
        `Пользователь ${user.id} с ником ${user.username} уже зарегистрировал ${events.length} приемов пищи за сегодня ${currentDate}`,
      )

      return false
    }

    const lastTodayNotification = this.notificationMealStartSended.get(key)

    if (lastTodayNotification) {
      this.logger.log(`Пользователь ${user.id} с ником ${user.username} уже получал уведомления о начале еды`)

      return false
    }

    const mealsCountPerDay = settings?.mealsCountPerDay

    const mealCountInfo = !!mealsCountPerDay
      ? `\n\nСегодня вас ждет ${mealsCountPerDay} приемов пищи, удачи, с соблюдеием графика!`
      : ''

    await this.mealNotification.mealNotificationSend(
      user.chatId,
      `Приветствую! Вы сегодня еще не кушали, постарайтесь сделать это в ближайшее время!${mealCountInfo}`,
    )

    this.notificationMealStartSended.set(key, currentDateInstance.valueOf())

    return true
  }
}
