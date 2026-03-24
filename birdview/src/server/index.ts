import 'dotenv/config'

import { createApp } from './app'

const port = Number(process.env.PORT ?? 3011)
const app = createApp()

app.listen(port, () => {
  console.log(`Birdview API listening on http://localhost:${port}`)
})
