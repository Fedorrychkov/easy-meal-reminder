import { declOfNum, interpolate } from 'src/helpers'
import { COMMAND_MESSAGES } from 'src/messages'
import { CommandType } from '../scenarios.types'

export const availableMealCounts = [1, 2, 3, 4, 5, 6, 7, 8]

export const SettingMealsMessageIncomingCount: Record<string, string> = availableMealCounts
  ?.map((count) => ({
    count,
    text: interpolate(COMMAND_MESSAGES.settings.mealCountSetter, {
      count,
      countWord: declOfNum(count, ['прием', 'приема', 'приемов']),
    }),
  }))
  .reduce((all, item) => {
    return {
      ...all,
      [`mealCount_${item.count}`]: item.text,
    }
  }, {})

export const SettingsMessagesIncoming = {
  settings: '/settings',
  main: COMMAND_MESSAGES.default.home,
  mealRemindsDrop: COMMAND_MESSAGES.settings.mealRemindsDrop,
  mealRemindsStart: COMMAND_MESSAGES.settings.mealRemindsStart,
  mealPeriodTime: COMMAND_MESSAGES.settings.mealPeriodTime,
  mealCountsSize: COMMAND_MESSAGES.settings.mealCountsSize,
  ...SettingMealsMessageIncomingCount,
}

export const settingsMealCountCommands: CommandType = Object.entries(SettingMealsMessageIncomingCount).reduce(
  (all, [key, text]) => ({
    ...all,
    [key]: {
      text,
    },
  }),
  {},
)

export const SettingsBaseCommands: CommandType = {
  settings: {
    text: SettingsMessagesIncoming.settings,
  },
  main: {
    text: SettingsMessagesIncoming.main,
  },
  mealRemindsDrop: {
    text: SettingsMessagesIncoming.mealRemindsDrop,
  },
  mealRemindsStart: {
    text: SettingsMessagesIncoming.mealRemindsStart,
  },
  mealPeriodTime: {
    text: SettingsMessagesIncoming.mealPeriodTime,
  },
  mealCountsSize: {
    text: SettingsMessagesIncoming.mealCountsSize,
  },
  ...settingsMealCountCommands,
}
