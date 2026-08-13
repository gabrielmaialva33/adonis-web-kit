import {
  DiskSpaceCheck,
  HealthChecks,
  MemoryHeapCheck,
  MemoryRSSCheck,
} from '@adonisjs/core/health'
import { DbCheck, DbConnectionCountCheck } from '@adonisjs/lucid/database'
import db from '@adonisjs/lucid/services/db'

export const healthChecks = new HealthChecks().register([
  new DiskSpaceCheck(),

  /**
   * The stock thresholds are absolute (fail above ~350 MB of RSS), which any
   * real Node process blows past — a dev server with HMR and source maps sits
   * around 1.5 GB, so `/api/v1/health` answered 503 permanently. Percentages
   * scale with the host instead, and are what actually indicates trouble.
   */
  new MemoryHeapCheck().warnWhenExceedsPercentage(80).failWhenExceedsPercentage(90),
  new MemoryRSSCheck().warnWhenExceedsPercentage(70).failWhenExceedsPercentage(85),

  new DbCheck(db.connection()),
  new DbConnectionCountCheck(db.connection()),
])
