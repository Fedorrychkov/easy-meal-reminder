import { Logger } from '@nestjs/common'
import { time } from 'src/helpers'

export const getTimeInfoForNotifications = () => {
  const logger = new Logger('getTimeInfoForNotifications')
  const currentDateInstance = time().tz('Europe/Moscow')

  const currentDate = currentDateInstance.format('MM/DD/YYYY')

  const formattedCurrentForStartNotificationDatetime = currentDateInstance.hour(10).minute(0).second(0)
  const formattedCurrentForEndNotificationDatetime = currentDateInstance.hour(22).minute(0).second(0)

  const isNeedToPushNotification =
    time(formattedCurrentForStartNotificationDatetime).isBefore(currentDateInstance) &&
    time(formattedCurrentForEndNotificationDatetime).isAfter(currentDateInstance)

  logger.log('[Current Time]', {
    before: time(formattedCurrentForStartNotificationDatetime).isBefore(currentDateInstance),
    after: time(formattedCurrentForEndNotificationDatetime).isAfter(currentDateInstance),
    beforeTime: time(formattedCurrentForStartNotificationDatetime).format('MM/DD/YYYY HH:mm:ss'),
    afterTime: time(formattedCurrentForEndNotificationDatetime).format('MM/DD/YYYY HH:mm:ss'),
    current: time(currentDateInstance).format('MM/DD/YYYY HH:mm:ss'),
  })

  return { isNeedToPushNotification, currentDate, currentDateInstance }
}
