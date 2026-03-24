import cors from 'cors'
import express from 'express'

import { backofficeRouter } from '../modules/backoffice/routes'
import { commandsRouter } from '../modules/commands/routes'
import { customersRouter } from '../modules/customers/routes'
import { dropletsRouter } from '../modules/droplets/routes'
import { headcountRouter } from '../modules/headcount/routes'
import { opportunitiesRouter } from '../modules/opportunities/routes'
import { ordersRouter } from '../modules/orders/routes'
import { platformRouter } from '../modules/platform/routes'
import { revenueRouter } from '../modules/revenue/routes'
import { runtimeRouter } from '../modules/runtime/routes'
import { v2momPipelineRouter } from '../modules/v2mom-pipeline/routes'
import { workspaceRouter } from '../modules/workspace/routes'
import { errorMiddleware } from './http'

export function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json({ limit: '2mb' }))

  app.get('/api/health', (_request, response) => {
    response.json({ ok: true })
  })

  app.use('/api', platformRouter)
  app.use('/api', commandsRouter)
  app.use('/api', revenueRouter)
  app.use('/api', headcountRouter)
  app.use('/api', customersRouter)
  app.use('/api', ordersRouter)
  app.use('/api', opportunitiesRouter)
  app.use('/api', dropletsRouter)
  app.use('/api', runtimeRouter)
  app.use('/api', v2momPipelineRouter)
  app.use('/api', workspaceRouter)
  app.use('/api', backofficeRouter)

  app.use(errorMiddleware)

  return app
}
