import { inject } from '@adonisjs/core'
import { Database } from '@adonisjs/lucid/database'

import User from '#modules/users/models/user'
import IOwnership from '#shared/interfaces/ownership_interface'

@inject()
export default class OwnershipService {
  private ownershipConfig: IOwnership.OwnershipConfig = {
    users: {
      table: 'users',
      ownerField: 'id',
      transferable: false,
    },
    files: {
      table: 'files',
      ownerField: 'owner_id',
      transferable: true,
    },
  }

  constructor(private db: Database) {}

  async checkOwnership(data: IOwnership.OwnershipCheck): Promise<boolean> {
    if (data.context !== 'own') {
      return false
    }

    const rule = this.ownershipConfig[data.resource]
    if (!rule) {
      return false
    }

    return this.checkDirectOwnership(data.userId, data.resourceId, rule)
  }

  async getOwnershipLevel(
    userId: number,
    resource: string,
    resourceId: number
  ): Promise<IOwnership.OwnershipLevel | null> {
    const rule = this.ownershipConfig[resource]
    if (!rule) {
      return null
    }

    const isOwner = await this.checkDirectOwnership(userId, resourceId, rule)
    return isOwner ? IOwnership.OwnershipLevel.OWNER : null
  }

  async getUserOwnedResources(
    userId: number,
    resource: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<Record<string, unknown>[]> {
    const rule = this.ownershipConfig[resource]
    if (!rule) {
      return []
    }

    let query = this.db.from(rule.table).where(rule.ownerField, userId)

    if (options.limit !== undefined) {
      query = query.limit(options.limit)
    }
    if (options.offset !== undefined) {
      query = query.offset(options.offset)
    }

    return query
  }

  async transferOwnership(
    currentOwnerId: number,
    newOwnerId: number,
    resource: string,
    resourceId: number
  ): Promise<boolean> {
    const rule = this.ownershipConfig[resource]
    if (!rule?.transferable) {
      return false
    }

    const [isOwner, newOwner] = await Promise.all([
      this.checkDirectOwnership(currentOwnerId, resourceId, rule),
      User.find(newOwnerId),
    ])

    if (!isOwner || !newOwner) {
      return false
    }

    const updated = await this.db
      .from(rule.table)
      .where('id', resourceId)
      .where(rule.ownerField, currentOwnerId)
      .update({ [rule.ownerField]: newOwnerId })

    return Array.isArray(updated) ? updated.length > 0 : updated > 0
  }

  addOwnershipRule(resource: string, rule: IOwnership.OwnershipRule): void {
    this.ownershipConfig[resource] = rule
  }

  private async checkDirectOwnership(
    userId: number,
    resourceId: number,
    rule: IOwnership.OwnershipRule
  ): Promise<boolean> {
    if (rule.customCheck) {
      return rule.customCheck(userId, resourceId)
    }

    const record = await this.db
      .from(rule.table)
      .where('id', resourceId)
      .where(rule.ownerField, userId)
      .first()

    return Boolean(record)
  }
}
