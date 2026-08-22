import vine from '@vinejs/vine'

export const refreshSessionValidator = vine.compile(
  vine.object({
    refresh_token: vine.string().trim().minLength(32),
  })
)
