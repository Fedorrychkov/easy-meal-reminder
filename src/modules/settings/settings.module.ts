import { Module } from '@nestjs/common'
import { SettingsEntity } from 'src/entities'
import { SettingsService } from './settings.service'

@Module({
  imports: [],
  controllers: [],
  providers: [SettingsService, SettingsEntity],
  exports: [SettingsService, SettingsEntity],
})
export class SettingsModule {}
