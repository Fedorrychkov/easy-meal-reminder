import { time } from 'src/helpers'

export const getTimeInfoForNotifications = () => {
  const currentDateInstance = time()

  const currentDate = currentDateInstance.format('MM/DD/YYYY')

  const formattedStartNotificationTime = '10:00:00'
  const formattedEndNotificationTime = '22:00:00'
  const formattedCurrentForStartNotificationDatetime = `${currentDate} ${formattedStartNotificationTime}`
  const formattedCurrentForEndNotificationDatetime = `${currentDate} ${formattedEndNotificationTime}`

  const isNeedToPushNotification =
    time(formattedCurrentForStartNotificationDatetime).isBefore(currentDateInstance) &&
    time(formattedCurrentForEndNotificationDatetime).isAfter(currentDateInstance)

  return { isNeedToPushNotification, currentDate, currentDateInstance }
}
