import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

import RefreshToken from '#modules/auth/models/refresh_token'
import LucidRepository from '#shared/lucid/lucid_repository'

export default class RefreshTokenRepository extends LucidRepository<typeof RefreshToken> {
  constructor() {
    super(RefreshToken)
  }

  async findByHashForUpdate(
    tokenHash: string,
    client: TransactionClientContract
  ): Promise<RefreshToken | null> {
    return this.model.query({ client }).where('token_hash', tokenHash).forUpdate().first()
  }
}
