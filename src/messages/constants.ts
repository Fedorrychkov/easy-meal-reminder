export const MESSAGES = {
  meal: {
    maxMeal:
      'Вы достигли назначенной цели, поздаврялем! Возвращайтесь завтра, чтобы продолжить контролировать количество приемов еды ;)',
    overloadMeals:
      'Вы съели на {count} {word} больше, чем требуется. Рекоммендуем остановиться на сегодня, чтобы не нарушить график :(',
    successfullySaved: 'Прием пищи успешно сохранен {count}/{maxCount}',
    nextMeal: 'следующий прием еды через {nextPeriod} {periodWord}, напомним за {reminderMinute} {reminderWord}',
  },
  settings: {
    unavailableSettled: 'не установлено',
    tryToSetCount: 'У вас не установлено количество приемов пищи в день, давайте установим?',
  },
  unavailableCommand: 'Не распознанная команда',
}
