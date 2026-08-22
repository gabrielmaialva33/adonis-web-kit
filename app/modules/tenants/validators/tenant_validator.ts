import vine from '@vinejs/vine'

export const createTenantValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(120),
  })
)
