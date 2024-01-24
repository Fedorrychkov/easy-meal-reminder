import { init, track, Types } from '@amplitude/analytics-node'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class AnalyticsService {
  private logger: Logger = new Logger(AnalyticsService.name)

  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {
    const token = this.configService.get<string>('AMPLITUDE_API_KEY')

    if (!token) {
      this.logger.error('Токен аналитики не установлен')
    }

    init(token, {
      serverZone: Types.ServerZone.US,
      logLevel: Types.LogLevel.Warn,
    })
  }

  public trackEvent(
    eventName: string,
    options: { eventProperties?: Record<string, any>; eventOptions?: Record<string, any> },
  ): any {
    const { eventProperties, eventOptions } = options || {}

    this.logger.log({ eventName, options })

    return track(eventName, eventProperties, eventOptions)
  }
}
