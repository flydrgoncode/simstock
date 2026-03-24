import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { ZodError, type ZodSchema } from 'zod'

export class AppError extends Error {
  statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.statusCode = statusCode
  }
}

export function asyncHandler(
  handler: (
    request: Request,
    response: Response,
    next: NextFunction
  ) => Promise<void>
): RequestHandler {
  return (request, response, next) => {
    void handler(request, response, next).catch(next)
  }
}

export function parseOrThrow<T>(schema: ZodSchema<T>, value: unknown) {
  return schema.parse(value)
}

export function sendNoContent(response: Response) {
  response.status(204).send()
}

export function errorMiddleware(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
) {
  if (error instanceof ZodError) {
    response.status(400).json({
      message: 'Validation failed',
      issues: error.flatten(),
    })
    return
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({ message: error.message })
    return
  }

  console.error(error)
  response.status(500).json({ message: 'Internal server error' })
}
