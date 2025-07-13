import stringHelpers from '@adonisjs/core/helpers/string'
import { HttpContext } from '@adonisjs/core/http'
import { BaseModel } from '@adonisjs/lucid/orm'
import { Database } from '@adonisjs/lucid/database'
import { ModelAttributes, ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import LucidRepositoryInterface, {
  DefaultOptions,
  ModelKeys,
  OrderDirection,
  PaginateOptions,
  PaginateResult,
} from '#shared/lucid_repository_interface'
import { TransactionClientContract } from '@adonisjs/lucid/types/database'

import ValidationException from '#exceptions/validation_exception'

/**
 * Enhanced options with advanced features
 */
export interface RepositoryOptions<T extends typeof BaseModel> extends DefaultOptions<T> {
  /**
   * Transaction to use for the query
   */
  transaction?: TransactionClientContract

  /**
   * Include soft deleted records
   */
  withTrashed?: boolean

  /**
   * Only include soft deleted records
   */
  onlyTrashed?: boolean

  /**
   * Fields to select
   */
  select?: string[]

  /**
   * Relations to preload
   */
  preload?: Record<string, (query: any) => void>

  /**
   * Use cache for the query
   */
  cache?: {
    key: string
    ttl?: number
  }

  /**
   * Lock for update
   */
  lockForUpdate?: boolean
}

/**
 * Filter criteria for complex queries
 */
export interface FilterCriteria<T extends typeof BaseModel> {
  field: ModelKeys<T>
  operator:
    | 'eq'
    | 'neq'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'like'
    | 'in'
    | 'nin'
    | 'between'
    | 'notBetween'
  value: any
}

/**
 * Batch operation result
 */
export interface BatchResult {
  success: number
  failed: number
  errors?: Array<{ index: number; error: string }>
}

export default class LucidRepository<T extends typeof BaseModel>
  implements LucidRepositoryInterface<T>
{
  static ORDER_ASC = 'asc' as const
  static ORDER_DESC = 'desc' as const
  protected DEFAULT_PAGE = 1
  protected DEFAULT_PER_PAGE = 10
  protected DEFAULT_SORT = 'id'
  protected DEFAULT_DIRECTION: OrderDirection = 'asc'

  // Cache storage (in production, use Redis or similar)
  protected static cacheStorage = new Map<string, { data: any; expires: number }>()

  constructor(
    protected model: T,
    protected database?: Database
  ) {}

  /**
   * ------------------------------------------------------
   * CRUD Operations
   * ------------------------------------------------------
   */
  async create(
    payload: Partial<ModelAttributes<InstanceType<T>>>,
    opts?: RepositoryOptions<T>
  ): Promise<InstanceType<T>> {
    const instance = await this.model.create(payload, { client: opts?.transaction })

    // Clear cache after creation
    this.clearCache()

    return instance
  }

  async createMany(
    payload: Partial<ModelAttributes<InstanceType<T>>>[],
    opts?: RepositoryOptions<T>
  ): Promise<InstanceType<T>[]> {
    const instances = await this.model.createMany(payload, { client: opts?.transaction })

    // Clear cache after bulk creation
    this.clearCache()

    return instances
  }

  /**
   * Create records in batches with error handling
   */
  async createInBatches(
    payload: Partial<ModelAttributes<InstanceType<T>>>[],
    batchSize: number = 1000,
    opts?: RepositoryOptions<T>
  ): Promise<BatchResult> {
    const result: BatchResult = { success: 0, failed: 0, errors: [] }

    const trx = opts?.transaction || (await this.database?.transaction())

    try {
      for (let i = 0; i < payload.length; i += batchSize) {
        const batch = payload.slice(i, i + batchSize)

        try {
          await this.createMany(batch, { ...opts, transaction: trx })
          result.success += batch.length
        } catch (error) {
          result.failed += batch.length
          result.errors?.push({
            index: i,
            error: error.message,
          })
        }
      }

      if (!opts?.transaction) {
        await trx?.commit()
      }
    } catch (error) {
      if (!opts?.transaction) {
        await trx?.rollback()
      }
      throw error
    }

    return result
  }

  async findBy<K extends ModelKeys<T>>(
    field: K,
    value: ModelAttributes<InstanceType<T>>[K],
    opts?: RepositoryOptions<T>
  ): Promise<InstanceType<T> | null> {
    // Check cache first
    if (opts?.cache) {
      const cached = this.getFromCache(opts.cache.key)
      if (cached) return cached
    }

    const result = await this.buildQuery({ field, value, opts }).first()

    // Store in cache
    if (opts?.cache && result) {
      this.setCache(opts.cache.key, result, opts.cache.ttl)
    }

    return result
  }

  /**
   * Find multiple records by field values
   */
  async findManyBy<K extends ModelKeys<T>>(
    field: K,
    values: ModelAttributes<InstanceType<T>>[K][],
    opts?: RepositoryOptions<T>
  ): Promise<InstanceType<T>[]> {
    const query = this.buildQuery({ opts })
    query.whereIn(field as string, values as any[])
    return query
  }

  /**
   * Find records using complex filters
   */
  async findWhere(
    filters: FilterCriteria<T>[],
    opts?: RepositoryOptions<T>
  ): Promise<InstanceType<T>[]> {
    const query = this.buildQuery({ opts })

    filters.forEach((filter) => {
      this.applyFilter(query, filter)
    })

    return query.exec()
  }

  async list(opts?: RepositoryOptions<T>): Promise<InstanceType<T>[]> {
    const query = this.buildQuery({ opts })

    query.orderBy(opts?.sortBy || this.DEFAULT_SORT, opts?.direction || this.DEFAULT_DIRECTION)

    return query.exec()
  }

  async paginate(options: PaginateOptions<T> & RepositoryOptions<T>): Promise<PaginateResult<T>> {
    const query = this.buildQuery({ opts: options })

    query.orderBy(options.sortBy || this.DEFAULT_SORT, options.direction || this.DEFAULT_DIRECTION)

    return query.paginate(
      options.page || this.DEFAULT_PAGE,
      options.perPage || this.DEFAULT_PER_PAGE
    )
  }

  async first(opts?: RepositoryOptions<T>): Promise<InstanceType<T> | null> {
    return this.buildQuery({ opts }).first()
  }

  async count(opts?: RepositoryOptions<T>): Promise<number> {
    const query = this.buildQuery({ opts })
    const rows = await query.count('* as count')
    return +rows[0].$extras.count
  }

  /**
   * Check if records exist
   */
  async exists(opts?: RepositoryOptions<T>): Promise<boolean> {
    const count = await this.count(opts)
    return count > 0
  }

  async firstOrCreate(
    search: Partial<ModelAttributes<InstanceType<T>>>,
    payload: Partial<ModelAttributes<InstanceType<T>>>,
    opts?: RepositoryOptions<T>
  ): Promise<InstanceType<T>> {
    if (opts?.transaction) {
      const existing = await this.buildQuery({ opts })
        .where(search as any)
        .first()

      if (existing) return existing

      return this.create({ ...search, ...payload }, opts)
    }
    return this.model.firstOrCreate(search, payload)
  }

  /**
   * Update by field - Implementation of interface method
   */
  async update<K extends ModelKeys<T>>(
    field: K,
    value: ModelAttributes<InstanceType<T>>[K],
    payload: Partial<ModelAttributes<InstanceType<T>>>,
    opts?: RepositoryOptions<T>
  ): Promise<InstanceType<T> | null> {
    const instance = await this.findBy(field, value, opts)

    if (!instance) {
      return null
    }

    if (opts?.transaction) {
      instance.useTransaction(opts.transaction)
    }

    instance.merge(payload)
    await instance.save()

    // Clear cache after update
    this.clearCache()

    return instance
  }

  /**
   * Update multiple records
   */
  async updateMany(
    criteria: Partial<ModelAttributes<InstanceType<T>>>,
    payload: Partial<ModelAttributes<InstanceType<T>>>,
    opts?: RepositoryOptions<T>
  ): Promise<number> {
    const query = this.buildQuery({ opts })

    Object.entries(criteria).forEach(([key, value]) => {
      query.where(key, value as any)
    })

    const result = await query.update(payload)

    // Clear cache after bulk update
    this.clearCache()

    return Array.isArray(result) ? result[0] : result
  }

  /**
   * Update or create a record
   */
  async updateOrCreate(
    search: Partial<ModelAttributes<InstanceType<T>>>,
    payload: Partial<ModelAttributes<InstanceType<T>>>,
    opts?: RepositoryOptions<T>
  ): Promise<InstanceType<T>> {
    if (opts?.transaction) {
      const existing = await this.buildQuery({ opts })
        .where(search as any)
        .first()

      if (existing) {
        existing.merge(payload)
        await existing.save()
        return existing
      }

      return this.create({ ...search, ...payload }, opts)
    }
    return this.model.updateOrCreate(search, payload)
  }

  /**
   * Destroy implementation - Fixed to return number
   */
  async destroy<K extends ModelKeys<T>>(
    field: K,
    value: ModelAttributes<InstanceType<T>>[K],
    opts?: RepositoryOptions<T>
  ): Promise<number> {
    const query = this.buildQuery({ field, value, opts })
    const result = await query.delete()

    // Clear cache after delete
    this.clearCache()

    return Array.isArray(result) ? result[0] : result
  }

  /**
   * Soft delete records
   */
  async softDelete<K extends ModelKeys<T>>(
    field: K,
    value: ModelAttributes<InstanceType<T>>[K],
    opts?: RepositoryOptions<T>
  ): Promise<number> {
    // Assuming the model has a deletedAt field
    return this.update(field, value, { deletedAt: new Date() } as any, opts).then((result) =>
      result ? 1 : 0
    )
  }

  /**
   * Restore soft deleted records
   */
  async restore<K extends ModelKeys<T>>(
    field: K,
    value: ModelAttributes<InstanceType<T>>[K],
    opts?: RepositoryOptions<T>
  ): Promise<number> {
    const enhancedOpts = { ...opts, onlyTrashed: true }
    return this.update(field, value, { deletedAt: null } as any, enhancedOpts).then((result) =>
      result ? 1 : 0
    )
  }

  /**
   * ------------------------------------------------------
   * Advanced Query Features
   * ------------------------------------------------------
   */

  /**
   * Execute raw SQL query
   */
  async raw(sql: string, bindings?: any[]): Promise<any> {
    if (!this.database) {
      throw new Error('Database instance not provided')
    }
    return this.database.rawQuery(sql, bindings)
  }

  /**
   * Find records and lock for update
   */
  async findAndLock<K extends ModelKeys<T>>(
    field: K,
    value: ModelAttributes<InstanceType<T>>[K],
    opts?: RepositoryOptions<T>
  ): Promise<InstanceType<T> | null> {
    return this.findBy(field, value, { ...opts, lockForUpdate: true })
  }

  /**
   * Chunk processing for large datasets
   */
  async chunk(
    chunkSize: number,
    callback: (instances: InstanceType<T>[]) => Promise<void>,
    opts?: RepositoryOptions<T>
  ): Promise<void> {
    const query = this.buildQuery({ opts })

    let page = 1
    let hasMore = true

    while (hasMore) {
      const results = await query
        .clone()
        .limit(chunkSize)
        .offset((page - 1) * chunkSize)
        .exec()

      if (results.length === 0) {
        hasMore = false
      } else {
        await callback(results)
        page++
        hasMore = results.length === chunkSize
      }
    }
  }

  /**
   * ------------------------------------------------------
   * Aggregation Methods
   * ------------------------------------------------------
   */

  /**
   * Get a sum of a column
   */
  async sum(column: string, opts?: RepositoryOptions<T>): Promise<number> {
    const query = this.buildQuery({ opts })
    const result = await query.sum(column + ' as total')
    return result[0]?.$extras?.total || 0
  }

  /**
   * Get average of a column
   */
  async avg(column: string, opts?: RepositoryOptions<T>): Promise<number> {
    const query = this.buildQuery({ opts })
    const result = await query.avg(column + ' as average')
    return result[0]?.$extras?.average || 0
  }

  /**
   * Get min value of a column
   */
  async min(column: string, opts?: RepositoryOptions<T>): Promise<number> {
    const query = this.buildQuery({ opts })
    const result = await query.min(column + ' as minimum')
    return result[0]?.$extras?.minimum || 0
  }

  /**
   * Get max value of a column
   */
  async max(column: string, opts?: RepositoryOptions<T>): Promise<number> {
    const query = this.buildQuery({ opts })
    const result = await query.max(column + ' as maximum')
    return result[0]?.$extras?.maximum || 0
  }

  /**
   * ------------------------------------------------------
   * Helper Methods
   * ------------------------------------------------------
   */
  protected validateSortBy(sort: string): void {
    const modelKeys = Array.from(this.model.$columnsDefinitions.keys())
    const modelKeysToSnakeCase = modelKeys.map((key) => stringHelpers.snakeCase(key))
    const allKeys = modelKeys.concat(modelKeysToSnakeCase)

    if (!allKeys.includes(sort)) {
      let message = `Invalid sort key: ${sort}. Must be one of: ${allKeys.join(', ')}`
      try {
        const { i18n } = HttpContext.getOrFail()
        message = i18n.t('errors.invalid_sort_key', {
          key: sort,
          available: allKeys.join(', '),
        })
      } catch {
        // HttpContext not available, use a default message
      }
      throw new ValidationException(message)
    }
  }

  protected validateDirection(direction: string): void {
    if (direction !== LucidRepository.ORDER_ASC && direction !== LucidRepository.ORDER_DESC) {
      let message = `Invalid direction. Must be "${LucidRepository.ORDER_ASC}" or "${LucidRepository.ORDER_DESC}".`
      try {
        const { i18n } = HttpContext.getOrFail()
        message = i18n.t('errors.invalid_sort_direction', {
          asc: LucidRepository.ORDER_ASC,
          desc: LucidRepository.ORDER_DESC,
        })
      } catch {
        // HttpContext not available, use a default message
      }
      throw new ValidationException(message)
    }
  }

  /**
   * Build a query with optional modifiers and scopes
   */
  protected buildQuery<K extends ModelKeys<T>>({
    field,
    value,
    opts,
  }: {
    field?: K
    value?: ModelAttributes<InstanceType<T>>[K]
    opts?: RepositoryOptions<T>
  }): ModelQueryBuilderContract<T, InstanceType<T>> {
    let query = this.model.query()

    // Apply transaction if provided
    if (opts?.transaction) {
      query = query.model.query({ client: opts.transaction })
    }

    if (field && value !== undefined) {
      query.where({ [field]: value })
    }

    if (opts) {
      const {
        modifyQuery,
        scopes,
        withTrashed,
        onlyTrashed,
        select,
        preload,
        lockForUpdate,
        sortBy,
        direction,
      } = opts

      // Handle soft deletes
      if (withTrashed && 'withTrashed' in query) {
        ;(query as any).withTrashed()
      }

      if (onlyTrashed && 'onlyTrashed' in query) {
        ;(query as any).onlyTrashed()
      }

      // Handle select
      if (select && select.length > 0) {
        query.select(select)
      }

      // Handle preloads
      if (preload) {
        Object.entries(preload).forEach(([relation, callback]) => {
          query.preload(relation as any, callback)
        })
      }

      // Handle locking
      if (lockForUpdate) {
        query.forUpdate()
      }

      // Handle sorting
      if (sortBy) {
        this.validateSortBy(sortBy)
        if (direction) {
          this.validateDirection(direction)
        }
      }

      // Apply custom query modifications
      if (modifyQuery) modifyQuery(query)

      // Apply scopes
      if (scopes) query.withScopes(scopes)
    }

    return query
  }

  /**
   * Apply filter to query
   */
  protected applyFilter(
    query: ModelQueryBuilderContract<T, InstanceType<T>>,
    filter: FilterCriteria<T>
  ): void {
    const { field, operator, value } = filter
    const fieldName = field as string

    switch (operator) {
      case 'eq':
        query.where(fieldName, value)
        break
      case 'neq':
        query.whereNot(fieldName, value)
        break
      case 'gt':
        query.where(fieldName, '>', value)
        break
      case 'gte':
        query.where(fieldName, '>=', value)
        break
      case 'lt':
        query.where(fieldName, '<', value)
        break
      case 'lte':
        query.where(fieldName, '<=', value)
        break
      case 'like':
        query.whereLike(fieldName, value)
        break
      case 'in':
        query.whereIn(fieldName, value)
        break
      case 'nin':
        query.whereNotIn(fieldName, value)
        break
      case 'between':
        query.whereBetween(fieldName, value)
        break
      case 'notBetween':
        query.whereNotBetween(fieldName, value)
        break
    }
  }

  /**
   * ------------------------------------------------------
   * Cache Methods
   * ------------------------------------------------------
   */

  /**
   * Get from cache
   */
  protected getFromCache(key: string): any {
    const cached = LucidRepository.cacheStorage.get(key)
    if (cached && cached.expires > Date.now()) {
      return cached.data
    }
    LucidRepository.cacheStorage.delete(key)
    return null
  }

  /**
   * Set cache
   */
  protected setCache(key: string, data: any, ttl: number = 3600): void {
    LucidRepository.cacheStorage.set(key, {
      data,
      expires: Date.now() + ttl * 1000,
    })
  }

  /**
   * Clear all cache
   */
  protected clearCache(): void {
    // In production, clear only relevant cache keys
    LucidRepository.cacheStorage.clear()
  }
}
