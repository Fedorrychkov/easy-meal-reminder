import { MealBaseCommands } from '../scenarios/mealEvent/message.constants'

export const baseCommands = {
  reply_markup: {
    keyboard: [[MealBaseCommands.mealStart], [MealBaseCommands.mealRemindsDrop, MealBaseCommands.mealRemindsStart]],
  },
}
