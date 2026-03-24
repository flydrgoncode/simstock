import 'dotenv/config'

import { runV2momPipelineByTenantName } from '../src/modules/v2mom-pipeline/executor'

function readTenantName() {
  const flagIndex = process.argv.findIndex((entry) => entry === '--tenant' || entry === '--tenant-name')
  if (flagIndex >= 0) {
    return process.argv[flagIndex + 1] ?? ''
  }

  return process.argv[2] ?? ''
}

async function main() {
  const tenantName = readTenantName().trim()
  if (!tenantName) {
    throw new Error('Missing tenant name. Use: npm run v2mom:generate -- --tenant-name "Tenant Name"')
  }

  const result = await runV2momPipelineByTenantName(tenantName)
  console.log(
    JSON.stringify(
      {
        ok: true,
        executionId: result.executionId,
        tenantId: result.tenantId,
        companyId: result.companyId,
        persisted: {
          values: result.persisted.values.length,
          methods: result.persisted.methods.length,
          subMethods: result.persisted.subMethods.length,
          actions: result.persisted.actions.length,
          metrics: result.persisted.metrics.length,
          obstacles: result.persisted.obstacles.length,
        },
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
