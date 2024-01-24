# Meal Reminder
## Фукнцонал бота
- Приветствие
- Настройка количества приемов пищи в день
- Регистрация приемов пищи
- Отключение и включение уведомлений о приемах пищи (уведомления стартуют в день регистрации приема, если за день не было приемов, бот не напоминает о себе)
- Период приемов пищи 12 часов (начинает расчет от первой регистрации приема пищи за день)

## Setting up firebase
add package global `npm install -g firebase-tools` and use `firebase init` after it. Select => 1. Firestore; 2. Existing project; 3. Other steps use defaults. Or you can use command `firebase use your-project-name` for start using your firestore.

## Manage indexes
Your indexes saved in firebase.indexes.json and you can use command `firebase deploy --only firestore:indexes` for deploy it.

## Analytics
Try tu use amplitude analytics. Currently use [amplitude dashboard](https://app.amplitude.com/analytics/meal-reminder/home) for me

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ pnpm install
```

## Running the app

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Test

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```


## License

Nest is [MIT licensed](LICENSE).
