import 'dotenv/config'

import { PrismaClient, TenantStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

import {
  resetTenantDemoData,
  seedPlatformCatalog,
  seedTenantDemoData,
} from '../src/modules/backoffice/demo'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is required for seeding')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

async function main() {
  await seedPlatformCatalog(prisma)

  const tenants = [
    {
      name: 'Northstar Holdings',
      slug: 'northstar',
      status: TenantStatus.ACTIVE,
      defaultCurrency: 'USD',
      defaultTimezone: 'America/New_York',
    },
    {
      name: 'Solstice Labs',
      slug: 'solstice',
      status: TenantStatus.ACTIVE,
      defaultCurrency: 'EUR',
      defaultTimezone: 'Europe/Lisbon',
    },
  ]

  for (const tenantData of tenants) {
    const tenant = await prisma.tenant.upsert({
      where: { slug: tenantData.slug },
      update: tenantData,
      create: tenantData,
    })

    await resetTenantDemoData(prisma, tenant.id)
    await seedTenantDemoData(prisma, tenant.id)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
