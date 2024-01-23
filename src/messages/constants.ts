import { MEAL_MESSAGES } from './scenarios/meal'
import { SETTINGS_MESSAGE } from './scenarios/settings'

export const MESSAGES = {
  meal: MEAL_MESSAGES,
  settings: SETTINGS_MESSAGE,
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
  unavailableCommandCurrently: 'На данный момент функционал не работает',
  errors: {
    internalError: 'Произошла непредвиденная ошибка, попробуйте выбрать другую команду или сообщить в поддержку',
  },
}

export const COMMAND_MESSAGES = {
  meal: {
    mealDone: 'Я уже поел',
    mealLater: 'Поем через час',
  },
  default: {
    home: 'На главную',
  },
  settings: {
    mealRemindsDrop: 'Остановить напоминания',
    mealRemindsStart: 'Запустить напоминания',
    mealCountSetter: 'У меня будет {count} {countWord} пищи в день',
    mealPeriodTime: 'Установить свой период времени',
    mealCountsSize: 'Установить количество приемов пищи',
  },
}
