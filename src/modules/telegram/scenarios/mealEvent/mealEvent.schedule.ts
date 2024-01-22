import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { Dayjs } from 'dayjs'
import { MealEventDocument, SettingsDocument, UserDocument, UserEntity } from 'src/entities'
import { interpolate, time, declOfNum } from 'src/helpers'
import { MESSAGES, declWords } from 'src/messages'
import { MealEventService } from 'src/modules/mealEvent'
import { SettingsHelper, SettingsService } from 'src/modules/settings'
import { settingsMealsCommands } from '../../commands/settings'
import { MealNotification } from './mealEvent.notification'
import { getTimeInfoForNotifications } from './utils'

@Injectable()
export class MealEventsSchedule {
  private readonly logger: Logger = new Logger(MealEventsSchedule.name)

  private notificationMealSended = new Map<string, boolean>()
  private notificationMealStartSended = new Map<string, number>()
  private notificationMealCountPerDatSended = new Map<string, number>()
  private notificationContinueSettingsInstallement = new Map<string, number>()

  constructor(
    private readonly mealEventService: MealEventService,
    private readonly settingsService: SettingsService,
    private readonly userEntity: UserEntity,
    private readonly mealNotification: MealNotification,
    private readonly settingsHelper: SettingsHelper,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkMealsByUsersToday() {
    const users = await this.userEntity.findAll()

    await Promise.allSettled(
      users?.map(async (user) => {
        const [events, settings] = await Promise.all([
          this.mealEventService.getTodayEvents(user.id),
          this.settingsService.getByUserId(user.id),
        ])

        const isToday = time
          .unix((user.createdAt as any)?._seconds)
          .tz('Europe/Moscow')
          .isToday()

        const { difference, from, to } = this.settingsHelper.tryToGetDifferenceAndParsedPeriod(settings.mealPeriodTimes)

        const { isNeedToPushNotification, currentDate, currentDateInstance } = getTimeInfoForNotifications({
          difference,
          from,
          to,
        })

        if (!settings && !isToday) {
          await this.sendSettingsInstallement({
            user,
            settings,
            currentDate,
            currentDateInstance,
          })

          return
        }

        // Если время еще не 10 утра (по мск по сути) или нотификации выключены, то уведомления не посылаем.
        if (!isNeedToPushNotification || !settings?.isNotificationEnabled || isToday) {
          this.logger.log(
            `[checkMealsByUsersToday]: Пользователь ${user.id} с ником ${user.username} пока не может получать уведомления`,
            {
              isNeedToPushNotification,
              isNotificationEnabled: settings?.isNotificationEnabled,
              currentDatetime: currentDateInstance.format('DD/MM/YYYY HH:mm:ss'),
              isToday,
            },
          )

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
          this.logger.log(`[getMealEvents]: Пользователь ${user.id} с ником ${user.username} отключил уведомления`)

          return
        }

        if (!settings?.mealsCountPerDay) {
          this.logger.log(
            `[getMealEvents]: Пользователь ${user.id} с ником ${user.username} не установил количество приемов пищи`,
          )

          return
        }

        if (events?.length >= settings?.mealsCountPerDay) {
          this.logger.log(`[getMealEvents]: Пользователь ${user.id} с ником ${user.username} уже выполнил план за день`)

          return
        }

        const { difference, from, to } = this.settingsHelper.tryToGetDifferenceAndParsedPeriod(settings.mealPeriodTimes)

        const { isNeedToPushNotification } = getTimeInfoForNotifications({ difference, from, to })

        if (!isNeedToPushNotification) {
          this.logger.log(
            `[getMealEvents]: Пользователь ${user.id} с ником ${user.username} пока не может получать уведомления`,
            {
              isNeedToPushNotification,
            },
          )

          return
        }

        const reversedEvents = [...events?.reverse()]

        const reminderPeriodInMinutes = difference / settings?.mealsCountPerDay
        const [lastEvent] = reversedEvents

        const key = `${user.id}-${lastEvent.id}`
        const isSended = this.notificationMealSended.get(key) || false

        if (isSended) {
          this.logger.log(
            `[getMealEvents]: Пользователь ${user.id} с ником ${user.username} уже получал уведомление о следующем приеме пищи`,
            {
              key,
            },
          )

          return
        }

        const diff = Math.round(
          time
            .unix((lastEvent.createdAt as any)?._seconds)
            .tz('Europe/Moscow')
            .diff(time().tz('Europe/Moscow')) / 1000,
        )
        const minutes = Math.floor(diff / 60)

        const isNeedToSend = minutes - -reminderPeriodInMinutes < 30

        if (!isNeedToSend) {
          this.logger.log(
            `[getMealEvents]: Пользователю ${user.id} с ником ${user.username} пока рано отправлять уведомление`,
            {
              minutes,
              reminderPeriodInMinutes,
              diff: minutes - -reminderPeriodInMinutes,
            },
          )
        }

        if (isNeedToSend) {
          await this.mealNotification.mealNotificationSend(
            user.chatId,
            interpolate(MESSAGES.meal.mealReminder, {
              reminderMinute: 30,
              reminderWord: declOfNum(30, declWords.minutes),
            }),
          )

          this.notificationMealSended.set(key, true)
        }
      }),
    )
  }

  private async sendSettingsInstallement({
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
    if (settings) {
      return false
    }

    const key = `${user.id}-${currentDate}`
    const lastTodayNotification = this.notificationContinueSettingsInstallement.get(key)

    if (lastTodayNotification) {
      this.logger.log(
        `[sendSettingsInstallement]: Пользователь ${user.id} с ником ${user.username} уже получал уведомления о продолжении установки настроек`,
      )

      return false
    }

    await this.mealNotification.mealNotificationSend(
      user.chatId,
      MESSAGES.settings.settingsInstallementContinueNotification,
    )

    this.notificationContinueSettingsInstallement.set(key, currentDateInstance.valueOf())

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
        `[sendMealStartNotification]: Пользователь ${user.id} с ником ${user.username} уже зарегистрировал ${events.length} приемов пищи за сегодня ${currentDate}`,
      )

      return false
    }

    const lastTodayNotification = this.notificationMealStartSended.get(key)

    if (lastTodayNotification) {
      this.logger.log(
        `[sendMealStartNotification]: Пользователь ${user.id} с ником ${user.username} уже получал уведомления о начале еды`,
      )

      return false
    }

    const mealsCountPerDay = settings?.mealsCountPerDay

    const mealCountInfo = !!mealsCountPerDay
      ? `\n\n${interpolate(MESSAGES.meal.mealReminderAwaitToStart, {
          count: mealsCountPerDay,
          countWord: declOfNum(mealsCountPerDay, ['прием', 'приема', 'приемов']),
        })}`
      : ''

    await this.mealNotification.mealNotificationSend(
      user.chatId,
      `${MESSAGES.meal.mealReminderAwaitToStartGreeting}${mealCountInfo}`,
    )

    this.notificationMealStartSended.set(key, currentDateInstance.valueOf())

    return true
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
    if (settings?.mealsCountPerDay && settings?.mealsCountPerDay > 0) {
      return false
    }

    const key = `${user.id}-${currentDate}`

    const lastTodayNotification = this.notificationMealCountPerDatSended.get(key)

    if (lastTodayNotification) {
      this.logger.log(
        `[sendMealsCountPerDayNotification]: Пользователь ${user.id} с ником ${user.username} уже получал уведомления о необходимости настроить интервалы еды`,
      )

      return false
    }

    await this.mealNotification.mealNotificationSend(
      user.chatId,
      MESSAGES.settings.setCountMessageTextFull,
      settingsMealsCommands,
    )

    this.notificationMealCountPerDatSended.set(key, currentDateInstance.valueOf())

    return true
  }
}
