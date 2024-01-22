import { Logger } from '@nestjs/common'
import { time } from 'src/helpers'
import { PeriodTime } from 'src/modules/settings/settings.types'

export const getTimeInfoForNotifications = (options: { difference: number } & PeriodTime) => {
  const { difference, from, to } = options || {}

  const logger = new Logger('getTimeInfoForNotifications')
  const currentDateInstance = time().tz('Europe/Moscow')

  const currentDate = currentDateInstance.format('MM/DD/YYYY')
  const currentHour = parseInt(currentDateInstance.format('HH'))

  const isDifferentDays = from.h > to.h

  const formattedCurrentForStartNotificationDatetime = currentDateInstance
    .hour(from.h)
    .minute(from.m)
    .second(0)
    .subtract(isDifferentDays ? 1 : 0, 'day')
  const formattedCurrentForEndNotificationDatetime = formattedCurrentForStartNotificationDatetime.add(
    time.duration({ minutes: difference }),
  )

  const isNeedToPushNotification =
    time(formattedCurrentForStartNotificationDatetime).isBefore(currentDateInstance) &&
    time(formattedCurrentForEndNotificationDatetime).isAfter(currentDateInstance)

  logger.log('[Current Time]', {
    before: time(formattedCurrentForStartNotificationDatetime).isBefore(currentDateInstance),
    after: time(formattedCurrentForEndNotificationDatetime).isAfter(currentDateInstance),
    beforeTime: time(formattedCurrentForStartNotificationDatetime).format('MM/DD/YYYY HH:mm:ss'),
    afterTime: time(formattedCurrentForEndNotificationDatetime).format('MM/DD/YYYY HH:mm:ss'),
    current: time(currentDateInstance).format('MM/DD/YYYY HH:mm:ss'),
    currentHour,
  })

  return { isNeedToPushNotification, currentDate, currentDateInstance }
}
