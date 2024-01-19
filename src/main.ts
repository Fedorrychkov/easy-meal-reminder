import * as express from 'express'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import * as admin from 'firebase-admin'
import { ServiceAccount } from 'firebase-admin'
import { ExpressAdapter } from '@nestjs/platform-express'
import { AppModule } from './app.module'

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'

// TODO: Сделал карявую проверку токена. По хорошему, как будто, это не лучшее место, однако пока не нашел другого варианта
async function bootstrap() {
  const server = express()

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), undefined)

  const configService: ConfigService = app.get(ConfigService)
  const projectId = configService.get<string>('FIREBASE_PROJECT_ID')
  // Set the config options
  const adminConfig: ServiceAccount = {
    projectId,
    privateKey: configService.get<string>('FIREBASE_PRIVATE_KEY'),
    clientEmail: configService.get<string>('FIREBASE_CLIENT_EMAIL'),
  }

  admin.initializeApp({
    credential: admin.credential.cert(adminConfig),
    databaseURL: `https://${projectId}.firebaseio.com`,
  })

  // сертификаты включаются только для стейджа, из него нет надобности торчать ssl портом
  await app.listen(8080)
}

bootstrap()
