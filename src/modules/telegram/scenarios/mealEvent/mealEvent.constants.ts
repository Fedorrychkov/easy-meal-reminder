import { COMMAND_MESSAGES } from 'src/messages'

export const MealBaseCommands = {
  mealStart: {
    text: COMMAND_MESSAGES.meal.mealDone,
  },
  mealLater: {
    text: COMMAND_MESSAGES.meal.mealLater,
  },
}

export const MealEventMessagesIncoming = {
  mealStart: MealBaseCommands.mealStart.text,
  mealLater: MealBaseCommands.mealLater.text,
}
