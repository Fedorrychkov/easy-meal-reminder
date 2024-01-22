import { MealBaseCommands } from '../scenarios/mealEvent/mealEvent.constants'
import { SettingsBaseCommands } from '../scenarios/settings/settings.constants'

export const baseCommands = {
  reply_markup: {
    keyboard: [[MealBaseCommands.mealStart], [MealBaseCommands.mealLater], [SettingsBaseCommands.settings]],
  },
}
