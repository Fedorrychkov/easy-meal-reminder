import { Module } from '@nestjs/common'
import { SettingsEntity } from 'src/entities'
import { SettingsHelper } from './settings.helper'
import { SettingsService } from './settings.service'

@Module({
  imports: [],
  controllers: [],
  providers: [SettingsService, SettingsEntity, SettingsHelper],
  exports: [SettingsService, SettingsEntity, SettingsHelper],
})
export class SettingsModule {}
