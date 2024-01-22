import { Injectable } from '@nestjs/common'
import { StorageEntity } from './scenarios.types'

@Injectable()
export class ScenariosStorage {
  private store: Record<StorageEntity, Record<string, unknown> | null | undefined>
  private lastUsedEntity: StorageEntity | undefined

  constructor() {
    this.store = undefined
  }

  public updateStore<T>(entity: StorageEntity, value: T) {
    if (typeof value !== 'object') {
      throw new Error('Storage value must be an object')
    }

    this._clearEntities(entity)

    this.lastUsedEntity = entity

    this.store = {
      ...this.store,
      [entity]: {
        ...this.store?.[entity],
        ...value,
      },
    }
  }

  public getStore(entity: StorageEntity) {
    return this.store?.[entity] || {}
  }

  public clearStore(entity: StorageEntity) {
    this.store[entity] = null
  }

  public checkIsLastEntity(entity: StorageEntity) {
    return this.lastUsedEntity === entity
  }

  private _clearEntities(entity: StorageEntity) {
    Object.values(StorageEntity).forEach((key: StorageEntity) => {
      if (key !== entity) {
        this.store[key as StorageEntity] = null
      }
    })
  }
}
