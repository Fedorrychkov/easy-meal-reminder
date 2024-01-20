import { MealBaseCommands } from '../scenarios/mealEvent/message.constants'
import { SettingsBaseCommands } from '../scenarios/settings/settings.constants'

export const baseCommands = {
  reply_markup: {
    keyboard: [
      [MealBaseCommands.mealStart],
      [SettingsBaseCommands.mealRemindsDrop, SettingsBaseCommands.mealRemindsStart],
      [SettingsBaseCommands.settings],
    ],
  },
}
