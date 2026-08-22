import vine from '@vinejs/vine'

export const deleteOwnAccountValidator = vine.compile(
  vine.object({
    current_password: vine.string(),
    confirmation: vine.string().trim(),
  })
)
