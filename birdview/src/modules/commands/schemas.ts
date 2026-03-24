import { z } from 'zod'

export const birdviewCommandBodySchema = z.object({
  command: z.string().trim().min(1),
})
