import { BaseSchema } from '@adonisjs/lucid/schema'

const defaultPermissionActions: Record<string, readonly string[]> = {
  users: ['create', 'read', 'update', 'delete', 'list', 'export'],
  roles: ['create', 'read', 'update', 'delete', 'list', 'assign', 'revoke'],
  permissions: ['create', 'read', 'update', 'delete', 'list', 'assign', 'revoke'],
  files: ['create', 'read', 'delete', 'list'],
  tenants: ['create', 'read', 'update', 'delete', 'list'],
  settings: ['read', 'update'],
  reports: ['read', 'create', 'export'],
  audit: ['read', 'list', 'export'],
  dashboard: ['read'],
}

const globalPermissions = Object.entries(defaultPermissionActions).flatMap(([resource, actions]) =>
  actions.map((action) => ({
    name: `${resource}.${action}`,
    resource,
    action,
    context: 'any',
    description: `${action.charAt(0).toUpperCase()}${action.slice(1)} ${resource}`,
  }))
)

const contextualPermissions = [
  {
    name: 'files.delete.own',
    resource: 'files',
    action: 'delete',
    context: 'own',
    description: 'Delete own files',
  },
]

const defaultPermissions = [...globalPermissions, ...contextualPermissions]
const defaultPermissionNames = defaultPermissions.map((permission) => permission.name)

const userPermissionNames = new Set([
  'dashboard.read',
  'files.create',
  'files.read',
  'files.list',
  'files.delete.own',
  'tenants.create',
  'tenants.read',
  'tenants.list',
])

export default class extends BaseSchema {
  async up() {
    await this.db.transaction(async (trx) => {
      const now = new Date()

      await trx.table('permissions').multiInsert(
        defaultPermissions.map((permission) => ({
          ...permission,
          created_at: now,
          updated_at: now,
        }))
      )

      const permissions = await trx
        .from('permissions')
        .whereIn('name', defaultPermissionNames)
        .select(['id', 'name', 'resource', 'action'])
      const roles = await trx
        .from('roles')
        .whereIn('slug', ['root', 'admin', 'user'])
        .select(['id', 'slug'])

      const roleIds = new Map(roles.map((role) => [role.slug, role.id]))
      const pivotRows: Array<{
        role_id: number
        permission_id: number
        created_at: Date
        updated_at: Date
      }> = []

      const rootRoleId = roleIds.get('root')
      const adminRoleId = roleIds.get('admin')
      const userRoleId = roleIds.get('user')

      for (const permission of permissions) {
        if (rootRoleId) {
          pivotRows.push({
            role_id: rootRoleId,
            permission_id: permission.id,
            created_at: now,
            updated_at: now,
          })
        }

        const adminCanUsePermission =
          permission.resource !== 'permissions' || ['read', 'list'].includes(permission.action)
        if (adminRoleId && adminCanUsePermission) {
          pivotRows.push({
            role_id: adminRoleId,
            permission_id: permission.id,
            created_at: now,
            updated_at: now,
          })
        }

        if (userRoleId && userPermissionNames.has(permission.name)) {
          pivotRows.push({
            role_id: userRoleId,
            permission_id: permission.id,
            created_at: now,
            updated_at: now,
          })
        }
      }

      if (pivotRows.length > 0) {
        await trx.table('role_permissions').multiInsert(pivotRows)
      }
    })
  }

  async down() {
    await this.db.from('permissions').whereIn('name', defaultPermissionNames).delete()
  }
}
