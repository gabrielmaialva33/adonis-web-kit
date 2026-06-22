import vine from '@vinejs/vine'

/**
 * Validates the "Profile" form on the Settings page. Only the fields a user is
 * allowed to change about themselves are accepted; `email` is intentionally
 * excluded because it is a login uid and is rendered read-only on the client.
 */
export const updateProfileValidator = vine.withMetaData<{ userId: number }>().compile(
  vine.object({
    full_name: vine.string().trim().minLength(1),
    username: vine
      .string()
      .trim()
      .minLength(3)
      .unique(async (db, value, field) => {
        const user = await db
          .from('users')
          .whereNot('id', field.meta.userId)
          .where('username', value)
          .first()
        return !user
      }),
  })
)
