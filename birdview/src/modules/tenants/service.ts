import type { Prisma } from '@prisma/client'

import { prisma } from '../../lib/db/prisma'
import { ensureExists } from '../../server/utils'
import { createAuditLog } from '../shared/audit'

export async function listTenants() {
  return prisma.tenant.findMany({
    orderBy: { createdAt: 'asc' },
    include: { settings: true },
  })
}

export async function createTenant(data: Prisma.TenantCreateInput) {
  const tenant = await prisma.tenant.create({
    data: {
      ...data,
      settings: {
        create: {
          configJson: {
            theme: 'system',
            locale: 'en-US',
            seededDemoData: false,
          },
        },
      },
    },
    include: { settings: true },
  })

  await createAuditLog({
    tenantId: tenant.id,
    entityType: 'Tenant',
    entityId: tenant.id,
    action: 'created',
    payloadJson: { name: tenant.name, slug: tenant.slug },
  })

  return tenant
}

export async function getTenant(tenantId: string) {
  return ensureExists(
    await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { settings: true },
    }),
    'Tenant not found'
  )
}

export async function updateTenant(
  tenantId: string,
  data: Prisma.TenantUpdateInput
) {
  await getTenant(tenantId)

  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data,
    include: { settings: true },
  })

  await createAuditLog({
    tenantId,
    entityType: 'Tenant',
    entityId: tenantId,
    action: 'updated',
    payloadJson: data as Prisma.InputJsonValue,
  })

  return tenant
}

export async function getTenantSettings(tenantId: string) {
  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
  })

  if (settings) {
    return settings
  }

  await getTenant(tenantId)

  return prisma.tenantSettings.create({
    data: {
      tenantId,
      configJson: {},
    },
  })
}

export async function upsertTenantSettings(
  tenantId: string,
  configJson: Prisma.InputJsonValue
) {
  await getTenant(tenantId)

  const settings = await prisma.tenantSettings.upsert({
    where: { tenantId },
    create: { tenantId, configJson },
    update: { configJson },
  })

  await createAuditLog({
    tenantId,
    entityType: 'TenantSettings',
    entityId: settings.id,
    action: 'updated',
    payloadJson: { configJson },
  })

  return settings
}

export async function listPeople(tenantId: string) {
  await getTenant(tenantId)

  return prisma.person.findMany({
    where: { tenantId },
    orderBy: [{ active: 'desc' }, { name: 'asc' }],
  })
}

export async function createPerson(
  tenantId: string,
  data: Prisma.PersonUncheckedCreateInput
) {
  await getTenant(tenantId)

  const person = await prisma.person.create({
    data: { ...data, tenantId },
  })

  await createAuditLog({
    tenantId,
    entityType: 'Person',
    entityId: person.id,
    action: 'created',
    payloadJson: { name: person.name },
  })

  return person
}

export async function updatePerson(
  personId: string,
  data: Prisma.PersonUpdateInput
) {
  const existing = ensureExists(
    await prisma.person.findUnique({ where: { id: personId } }),
    'Person not found'
  )

  const person = await prisma.person.update({
    where: { id: personId },
    data,
  })

  await createAuditLog({
    tenantId: existing.tenantId,
    entityType: 'Person',
    entityId: personId,
    action: 'updated',
    payloadJson: data as Prisma.InputJsonValue,
  })

  return person
}
