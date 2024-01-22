const setCountMessageTextStart =
  'Для корректной работы, вам нужно настроить количество приемов еды, чтобы я мог уведомлять вас заблоговременно!\n\n'
const setCountMessageTextEnd = 'Обратите внимание, я начинаю уведомления от последнего зарегестрированного приема пищи'

export const MESSAGES = {
  meal: {
    maxMeal:
      'Вы достигли назначенной цели, поздаврялем! Возвращайтесь завтра, чтобы продолжить контролировать количество приемов еды ;)',
    overloadMeals:
      'Вы съели на {count} {word} больше, чем требуется. Рекоммендуем остановиться на сегодня, чтобы не нарушить график :(',
    successfullySaved: 'Прием пищи успешно сохранен {count}/{maxCount}',
    nextMeal: 'следующий прием еды через {nextPeriod} {periodWord}, напомним за {reminderMinute} {reminderWord}',
    mealReminder: 'Не забудьте поесть! Следующий прием пищи ожидается в течении {reminderMinute} {reminderWord} ;)',
    mealReminderAwaitToStart: 'Сегодня вас ждет {count} {countWord} пищи, удачи, с соблюдением графика!',
    mealReminderAwaitToStartGreeting:
      'Приветствую! Вы сегодня еще не кушали, постарайтесь сделать это в ближайшее время!',
    mealTodayStartText: 'За сегодня, вы еще не ели ни разу? Давайте это исправлять!',
    mealTodayRegisteredTimes: 'За сегодня было зарегистрировано {count} приемов пищи',
    mealReminderMinutesRecommend:
      'Судя по выбранному количеству приемов в день, вам нужно кушать каждые ~{reminderPeriod} {reminderMinute}',
    mealReminderInfoText:
      'Вы будете получать уведомления, примерно, за {reminderPeriond} {reminderMinute} каждые ~{reminderUserPeriod} {reminderMinutePeriod}',
  },
  settings: {
    unavailableSettled: 'не установлено',
    tryToSetCount: 'У вас не установлено количество приемов пищи в день, давайте установим?',
    successfullySettled: 'Количество приемов в {count}/день успешно установлено',
    notificationsSuccessfullyDisabled: 'Уведомления отключены, включить можете нажав на кнопку или написав "{command}"',
    notificationsSuccessfullyEnabled: 'Уведомления включены, отключить можете нажав на кнопку или написав "{command}"',
    info: 'В настройках вы можете указать количество приемов пищи. Для управления уведомлениями перейдите на главную',
    settingsInstallementContinueNotification:
      'Кажется Вы не завершили установку своих настроек, может быть хотели бы продолжить?\nЯ буду напоминать вам каждый день о приемах еды ;)',
    setCountMessageTextFull: `${setCountMessageTextStart}\n\n${setCountMessageTextEnd}`,
    setCountMessageTextStart,
    setCountMessageTextEnd,
  },
  welcome: {
    greeting: 'Приветствую! Я бот напоминающий о приемах пищи!',
    userGreeting: 'Welcome on aboard, @{username}',
    welcomeBack: 'С возвращением, @{username}, вы уже поели?',
    welcomeWithoutMealCount: 'Добро пожаловать, давайте начнем настраивать ваши приемы пищи?',
  },
  unavailableCommand: 'Не распознанная команда',
  chooseCommand: 'Выберите необходимую команду',
  tryAgain: 'Попробуйте еще раз',
  unavailableMode:
    'Ого, меня включили не в личной переписке О_О. Я пока не поддерживаю такой вариант общения :( Пожалуйста, отпишите мне в личку ;)',
}

export const COMMAND_MESSAGES = {
  meal: {
    mealDone: 'Я уже поел',
  },
  default: {
    home: 'На главную',
  },
  settings: {
    mealRemindsDrop: 'Остановить напоминания',
    mealRemindsStart: 'Запустить напоминания',
    mealCountSetter: 'У меня будет {count} {countWord} пищи в день',
  },
}
