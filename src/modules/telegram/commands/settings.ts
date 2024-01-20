import { SettingMealsMessageIncomingCount, SettingsBaseCommands } from '../scenarios/settings/settings.constants'

const countMessages = Object.values(SettingMealsMessageIncomingCount)?.map((text) => [{ text: text }])

export const settingsCommands = {
  reply_markup: {
    keyboard: [[SettingsBaseCommands.main], ...countMessages],
  },
}
