import { COMMAND_MESSAGES } from 'src/messages'

export const MealBaseCommands = {
  mealStart: {
    text: COMMAND_MESSAGES.meal.mealDone,
  },
}

export const MealEventMessagesIncoming = {
  mealStart: MealBaseCommands.mealStart.text,
}
