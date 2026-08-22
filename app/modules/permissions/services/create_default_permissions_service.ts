import { inject } from '@adonisjs/core'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

import IPermission from '#modules/permissions/interfaces/permission_interface'
import PermissionRepository from '#modules/permissions/repositories/permission_repository'

export const DEFAULT_PERMISSION_ACTIONS: Partial<
  Record<IPermission.Resources, IPermission.Actions[]>
> = {
  [IPermission.Resources.USERS]: [
    IPermission.Actions.CREATE,
    IPermission.Actions.READ,
    IPermission.Actions.UPDATE,
    IPermission.Actions.DELETE,
    IPermission.Actions.LIST,
    IPermission.Actions.EXPORT,
  ],
  [IPermission.Resources.ROLES]: [
    IPermission.Actions.CREATE,
    IPermission.Actions.READ,
    IPermission.Actions.UPDATE,
    IPermission.Actions.DELETE,
    IPermission.Actions.LIST,
    IPermission.Actions.ASSIGN,
    IPermission.Actions.REVOKE,
  ],
  [IPermission.Resources.PERMISSIONS]: [
    IPermission.Actions.CREATE,
    IPermission.Actions.READ,
    IPermission.Actions.UPDATE,
    IPermission.Actions.DELETE,
    IPermission.Actions.LIST,
    IPermission.Actions.ASSIGN,
    IPermission.Actions.REVOKE,
  ],
  [IPermission.Resources.FILES]: [
    IPermission.Actions.CREATE,
    IPermission.Actions.READ,
    IPermission.Actions.DELETE,
    IPermission.Actions.LIST,
  ],
  [IPermission.Resources.SETTINGS]: [IPermission.Actions.READ, IPermission.Actions.UPDATE],
  [IPermission.Resources.REPORTS]: [
    IPermission.Actions.READ,
    IPermission.Actions.CREATE,
    IPermission.Actions.EXPORT,
  ],
  [IPermission.Resources.AUDIT]: [
    IPermission.Actions.READ,
    IPermission.Actions.LIST,
    IPermission.Actions.EXPORT,
  ],
  [IPermission.Resources.DASHBOARD]: [IPermission.Actions.READ],
}

export function getDefaultPermissionNames(): string[] {
  return Object.entries(DEFAULT_PERMISSION_ACTIONS).flatMap(([resource, actions]) =>
    (actions ?? []).map((action) => `${resource}.${action}`)
  )
}

@inject()
export default class CreateDefaultPermissionsService {
  constructor(private permissionRepository: PermissionRepository) {}

  async run(trx?: TransactionClientContract): Promise<void> {
    await this.permissionRepository.syncPermissions(this.getDefaultPermissions(), trx)
  }

  private getDefaultPermissions(): IPermission.SyncPermissionData[] {
    return Object.entries(DEFAULT_PERMISSION_ACTIONS).flatMap(([resource, actions]) =>
      (actions ?? []).map((action) => ({
        name: `${resource}.${action}`,
        resource,
        action,
        context: IPermission.Contexts.ANY,
        description: `${this.capitalize(action)} ${resource}`,
      }))
    )
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1)
  }
}
