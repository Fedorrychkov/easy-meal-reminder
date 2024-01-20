import * as dayjs from 'dayjs'
import * as utc from 'dayjs/plugin/utc'
import * as timezone from 'dayjs/plugin/timezone'
import * as isToday from 'dayjs/plugin/isToday'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isToday)

export const time = dayjs
