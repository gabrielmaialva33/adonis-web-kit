import LucidRepository from '#shared/lucid/lucid_repository'
import IPermission from '#modules/permissions/interfaces/permission_interface'
import Permission from '#modules/permissions/models/permission'
import { type TransactionClientContract } from '@adonisjs/lucid/types/database'
import { type PaginateResult } from '#shared/lucid/lucid_repository_interface'

export default class PermissionRepository
  extends LucidRepository<typeof Permission>
  implements IPermission.Repository
{
  constructor() {
    super(Permission)
  }

  async findByName(name: string): Promise<Permission | null> {
    return this.model.findBy('name', name)
  }

  async findByResourceAction(
    resource: string,
    action: string,
    context: string = IPermission.Contexts.ANY
  ): Promise<Permission | null> {
    return this.model
      .query()
      .where('resource', resource)
      .where('action', action)
      .where('context', context)
      .first()
  }

  async syncPermissions(
    permissions: IPermission.SyncPermissionData[],
    trx?: TransactionClientContract
  ): Promise<void> {
    for (const permissionData of permissions) {
      await this.model.firstOrCreate(
        {
          resource: permissionData.resource,
          action: permissionData.action,
          context: permissionData.context ?? IPermission.Contexts.ANY,
        },
        {
          name: permissionData.name,
          description: permissionData.description,
        },
        { client: trx }
      )
    }
  }

  /**
   * Paginate permissions with optional resource/action filters, ordered by
   * resource then action.
   */
  async paginateFiltered(
    page: number,
    perPage: number,
    resource?: string,
    action?: string
  ): Promise<PaginateResult<typeof Permission>> {
    const query = this.model.query()

    if (resource) {
      query.where('resource', resource)
    }

    if (action) {
      query.where('action', action)
    }

    return query.orderBy('resource', 'asc').orderBy('action', 'asc').paginate(page, perPage)
  }

  /**
   * List every permission ordered by resource, action and context (read model
   * for the web permissions page).
   */
  async listOrderedByResource(): Promise<Permission[]> {
    return this.model
      .query()
      .orderBy('resource', 'asc')
      .orderBy('action', 'asc')
      .orderBy('context', 'asc')
  }

  /**
   * All permission ids (used to grant every permission to the ROOT role).
   */
  async findAllIds(trx?: TransactionClientContract): Promise<number[]> {
    const rows = await this.model.query({ client: trx }).select('id')
    return rows.map((row) => row.id)
  }

  /**
   * Permission ids granted to the ADMIN role: everything except permission
   * management, plus read/list on permissions.
   */
  async findAdminPermissionIds(trx?: TransactionClientContract): Promise<number[]> {
    const rows = await this.model
      .query({ client: trx })
      .whereNot('resource', IPermission.Resources.PERMISSIONS)
      .orWhere((query) => {
        query
          .where('resource', IPermission.Resources.PERMISSIONS)
          .whereIn('action', [IPermission.Actions.READ, IPermission.Actions.LIST])
      })
      .select('id')

    return rows.map((row) => row.id)
  }

  /**
   * The default USER role is intentionally narrow: it can enter the dashboard
   * and work with files, but cannot enumerate or mutate platform users/roles.
   * Own-profile operations use dedicated authenticated endpoints instead of
   * global user-management permissions.
   */
  async findUserPermissionIds(trx?: TransactionClientContract): Promise<number[]> {
    const rows = await this.model
      .query({ client: trx })
      .where((query) => {
        query
          .where('resource', IPermission.Resources.FILES)
          .whereIn('action', [
            IPermission.Actions.CREATE,
            IPermission.Actions.READ,
            IPermission.Actions.LIST,
          ])
      })
      .orWhere((query) => {
        query
          .where('resource', IPermission.Resources.FILES)
          .where('action', IPermission.Actions.DELETE)
          .where('context', IPermission.Contexts.OWN)
      })
      .orWhere((query) => {
        query
          .where('resource', IPermission.Resources.TENANTS)
          .whereIn('action', [
            IPermission.Actions.CREATE,
            IPermission.Actions.READ,
            IPermission.Actions.LIST,
          ])
      })
      .orWhere((query) => {
        query
          .where('resource', IPermission.Resources.DASHBOARD)
          .where('action', IPermission.Actions.READ)
      })
      .select('id')

    return rows.map((row) => row.id)
  }

  /**
   * GUEST is a neutral role by default. Applications may opt in to public or
   * guest capabilities explicitly instead of inheriting broad global reads.
   */
  async findGuestPermissionIds(_trx?: TransactionClientContract): Promise<number[]> {
    return []
  }

  /**
   * Permissions owned (directly or via roles) whose role slug is in the given
   * list. Used to resolve inherited permissions across the role hierarchy.
   */
  async findByRoleSlugs(slugs: string[]): Promise<Permission[]> {
    return this.model
      .query()
      .whereHas('roles', (query) => {
        query.whereIn('slug', slugs)
      })
      .distinct()
  }
}
