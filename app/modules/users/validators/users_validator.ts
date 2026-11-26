import vine from '@vinejs/vine'

export const createUserValidator = vine.compile(
  vine.object({
    full_name: vine.string().trim().maxLength(255),
    email: vine
      .string()
      .email()
      .trim()
      .toLowerCase()
      .maxLength(254)
      .unique(async (db, value) => {
        const user = await db.from('users').where('email', value).first()
        return !user
      }),
    username: vine
      .string()
      .trim()
      .toLowerCase()
      .maxLength(80)
      .minLength(3)
      .unique(async (db, value) => {
        const user = await db.from('users').where('username', value).first()
        return !user
      })
      .optional(),
    password: vine.string().minLength(8).confirmed({ confirmationField: 'password_confirmation' }),
  })
)

export const editUserValidator = vine.withMetaData<{ userId: number }>().compile(
  vine.object({
    full_name: vine.string().trim().maxLength(255).optional(),
    password: vine
      .string()
      .minLength(8)
      .confirmed({ confirmationField: 'password_confirmation' })
      .optional(),
  })
)

export const signInValidator = vine.compile(
  vine.object({
    uid: vine.string().trim(),
    password: vine.string(),
  })
)
