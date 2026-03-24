import { Router } from 'express'

import { idParamSchema } from '../../lib/validation/common'
import { asyncHandler, parseOrThrow } from '../../server/http'
import { getWorkspaceContext } from './service'

export const workspaceRouter = Router()

workspaceRouter.get(
  '/workspace/companies/:companyId/context',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, { id: request.params.companyId })
    response.json(await getWorkspaceContext(id))
  })
)
