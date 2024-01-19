export const MealBaseCommands = {
  mealStart: {
    text: 'Я уже поел',
  },
  mealRemindsDrop: {
    text: 'Остановить напоминания',
  },
  mealRemindsStart: {
    text: 'Запустить напоминания',
  },
}

export const MealEventMessagesIncoming = {
  mealStart: MealBaseCommands.mealStart.text,
  mealRemindsStart: MealBaseCommands.mealRemindsStart.text,
  mealRemindsDrop: MealBaseCommands.mealRemindsDrop.text,
}
