import { SettingMealsMessageIncomingCount, SettingsBaseCommands } from '../scenarios/settings/settings.constants'

const countMessages = Object.values(SettingMealsMessageIncomingCount)?.map((text) => [{ text: text }])

export const settingsMealsCommands = {
  reply_markup: {
    keyboard: [[SettingsBaseCommands.main, SettingsBaseCommands.settings], ...countMessages],
  },
}

export const mainSettingsCommands = {
  reply_markup: {
    keyboard: [
      [SettingsBaseCommands.main],
      [SettingsBaseCommands.mealPeriodTime, SettingsBaseCommands.mealCountsSize],
      [SettingsBaseCommands.mealRemindsDrop, SettingsBaseCommands.mealRemindsStart],
    ],
  },
}
