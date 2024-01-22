import { Injectable, Logger } from '@nestjs/common'
import { calculateTimeDifferenceInMinutes } from 'src/helpers/customTimeDifference'
import { MESSAGES } from 'src/messages'
import { mealPeriodInMinutes } from './settings.constants'
import { PeriodTime } from './settings.types'

@Injectable()
export class SettingsHelper {
  private logger: Logger = new Logger(SettingsHelper.name)

  public tryToGetPeriodDifferenceInMinutes(period: PeriodTime) {
    const { from, to } = period

    return calculateTimeDifferenceInMinutes(`${from.h}:${from.m}`, `${to.h}:${to.m}`)
  }

  public tryToParsePeriodUserText(text: string): PeriodTime {
    const period = text?.split('-')

    if (period?.length < 2) {
      throw new Error(MESSAGES.settings.errors.separator)
    }

    const parsedValues = period?.map((item) => {
      const hAndM = item?.split(':')

      const [h, m = 0] = hAndM?.map((hAndMItem) => {
        const result = parseInt(hAndMItem)

        if (hAndMItem && Number.isNaN(result)) {
          throw new Error(MESSAGES.settings.errors.separator)
        }

        return result
      })

      if (h < 0 || h > 23) {
        throw new Error(MESSAGES.settings.errors.hourPeriod)
      }

      if (m && (m < 0 || m > 59)) {
        throw new Error(MESSAGES.settings.errors.minutePeriod)
      }

      return { h, m }
    })

    const [from, to] = parsedValues

    if (from.h === to.h) {
      throw new Error(MESSAGES.settings.errors.hourEqualityError)
    }

    return { from, to }
  }

  public tryToGetDifferenceAndParsedPeriod(text: string) {
    try {
      const period = this.tryToParsePeriodUserText(text)
      const difference = this.tryToGetPeriodDifferenceInMinutes(period)

      return { difference, ...period }
    } catch (ex) {
      this.logger.error('[tryToGetDifferenceAndParsedPeriod]', ex)

      return { difference: mealPeriodInMinutes, from: { h: 10, m: 0 }, to: { h: 22, m: 0 } }
    }
  }
}
