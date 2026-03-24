import type { Prisma } from '@prisma/client'

import { prisma } from '../../lib/db/prisma'
import { AppError } from '../../server/http'
import { ensureExists } from '../../server/utils'
import { createAuditLog } from '../shared/audit'
import { previewDropletDefinition } from './explore'
import { canPublishDroplet, runShadowSkillDefinition } from './studio'

function normalizeAliases(value: Prisma.JsonValue) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }
  return []
}

export async function listVerticalDroplets(verticalId: string) {
  return prisma.verticalDroplet.findMany({
    where: { verticalId },
    orderBy: [{ createdAt: 'desc' }],
  })
}

export async function createVerticalDroplet(
  verticalId: string,
  data: Omit<Prisma.VerticalDropletUncheckedCreateInput, 'verticalId'>
) {
  const aliases = normalizeAliases(data.commandAliasesJson as Prisma.JsonValue)
  const existing = await prisma.verticalDroplet.findMany({ where: { verticalId } })
  const taken = new Set<string>()
  for (const droplet of existing) {
    taken.add(droplet.command)
    for (const alias of normalizeAliases(droplet.commandAliasesJson)) {
      taken.add(alias)
    }
  }
  if (taken.has(String(data.command))) {
    throw new AppError(400, `Command collision detected for ${data.command}.`)
  }
  const collidingAlias = aliases.find((alias) => taken.has(alias))
  if (collidingAlias) {
    throw new AppError(400, `Command collision detected for ${collidingAlias}.`)
  }
  if (aliases.length !== new Set(aliases).size) {
    throw new AppError(400, 'Command aliases must be unique.')
  }
  const droplet = await prisma.verticalDroplet.create({
    data: {
      ...data,
      verticalId,
    },
  })
  await createAuditLog({
    entityType: 'VerticalDroplet',
    entityId: droplet.id,
    action: 'created',
    payloadJson: { verticalId, name: droplet.name, command: droplet.command },
  })
  return droplet
}

export async function updateVerticalDroplet(
  id: string,
  data: Prisma.VerticalDropletUpdateInput
) {
  const existing = ensureExists(
    await prisma.verticalDroplet.findUnique({ where: { id } }),
    'Droplet not found'
  )
  const droplet = await prisma.verticalDroplet.update({
    where: { id },
    data,
  })
  await createAuditLog({
    entityType: 'VerticalDroplet',
    entityId: id,
    action: 'updated',
    payloadJson: data as Prisma.InputJsonValue,
  })
  return { ...droplet, verticalId: existing.verticalId }
}

export async function publishVerticalDroplet(id: string) {
  await canPublishDroplet(id)
  return updateVerticalDroplet(id, { status: 'PUBLISHED' })
}

export async function deprecateVerticalDroplet(id: string) {
  return updateVerticalDroplet(id, { status: 'DEPRECATED' })
}

export async function deleteVerticalDroplet(id: string) {
  const droplet = ensureExists(
    await prisma.verticalDroplet.findUnique({
      where: { id },
      include: { assignments: true },
    }),
    'Droplet not found'
  )
  if (droplet.assignments.length > 0) {
    throw new AppError(400, 'Droplet cannot be deleted while tenants are using it.')
  }
  await prisma.verticalDroplet.delete({ where: { id } })
  await createAuditLog({
    entityType: 'VerticalDroplet',
    entityId: id,
    action: 'deleted',
  })
  return { ok: true }
}

export async function getTenantCatalog(tenantId: string) {
  const shell = ensureExists(
    await prisma.tenantShell.findFirst({
      where: { tenantId, status: 'ACTIVE' },
      include: { vertical: true, verticalDefinition: true },
      orderBy: { createdAt: 'asc' },
    }),
    'Tenant shell not found'
  )

  const [catalog, assignments] = await Promise.all([
    prisma.verticalDroplet.findMany({
      where: {
        verticalId: shell.verticalId,
        status: 'PUBLISHED',
      },
      orderBy: [{ name: 'asc' }],
    }),
    prisma.tenantDropletAssignment.findMany({
      where: { tenantId },
      orderBy: [{ createdAt: 'asc' }],
    }),
  ])

  const assignmentsByDroplet = new Map(
    assignments.map((assignment) => [assignment.verticalDropletId, assignment])
  )

  return {
    shell,
    droplets: catalog.map((droplet) => {
      const assignment = assignmentsByDroplet.get(droplet.id) ?? null
      return {
        ...droplet,
        assignment,
      }
    }),
  }
}

export async function activateTenantDroplet(
  tenantId: string,
  verticalDropletId: string,
  options?: {
    placement?: string | null
    configOverrideJson?: Prisma.InputJsonValue
  }
) {
  const [shell, company] = await Promise.all([
    prisma.tenantShell.findFirst({
      where: { tenantId, status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.company.findUnique({ where: { tenantId } }),
  ])
  ensureExists(shell, 'Tenant shell not found')

  const droplet = ensureExists(
    await prisma.verticalDroplet.findFirst({
      where: {
        id: verticalDropletId,
        verticalId: shell!.verticalId,
      },
    }),
    'Droplet not found for tenant vertical'
  )

  const assignment = await prisma.tenantDropletAssignment.upsert({
    where: {
      tenantId_verticalDropletId: {
        tenantId,
        verticalDropletId,
      },
    },
    update: {
      companyId: company?.id ?? null,
      active: true,
      placement: options?.placement ?? null,
      configOverrideJson: options?.configOverrideJson ?? {},
    },
    create: {
      tenantId,
      companyId: company?.id ?? null,
      verticalDropletId,
      placement: options?.placement ?? null,
      configOverrideJson: options?.configOverrideJson ?? {},
      active: true,
    },
    include: { verticalDroplet: true },
  })

  await createAuditLog({
    tenantId,
    entityType: 'TenantDropletAssignment',
    entityId: assignment.id,
    action: 'activated',
    payloadJson: { dropletId: droplet.id, command: droplet.command },
  })

  return assignment
}

export async function deactivateTenantDroplet(
  tenantId: string,
  verticalDropletId: string
) {
  const assignment = ensureExists(
    await prisma.tenantDropletAssignment.findUnique({
      where: {
        tenantId_verticalDropletId: {
          tenantId,
          verticalDropletId,
        },
      },
    }),
    'Tenant droplet assignment not found'
  )

  const updated = await prisma.tenantDropletAssignment.update({
    where: { id: assignment.id },
    data: { active: false },
    include: { verticalDroplet: true },
  })

  await createAuditLog({
    tenantId,
    entityType: 'TenantDropletAssignment',
    entityId: assignment.id,
    action: 'deactivated',
  })

  return updated
}

export async function updateTenantDropletAssignment(
  id: string,
  data: Prisma.TenantDropletAssignmentUpdateInput
) {
  const existing = ensureExists(
    await prisma.tenantDropletAssignment.findUnique({ where: { id } }),
    'Tenant droplet assignment not found'
  )
  const assignment = await prisma.tenantDropletAssignment.update({
    where: { id },
    data,
    include: { verticalDroplet: true },
  })
  await createAuditLog({
    tenantId: existing.tenantId,
    entityType: 'TenantDropletAssignment',
    entityId: id,
    action: 'updated',
    payloadJson: data as Prisma.InputJsonValue,
  })
  return assignment
}

export async function listActiveTenantDroplets(tenantId: string) {
  const assignments = await prisma.tenantDropletAssignment.findMany({
    where: {
      tenantId,
      active: true,
      verticalDroplet: {
        status: 'PUBLISHED',
      },
    },
    include: {
      verticalDroplet: true,
    },
    orderBy: [{ placement: 'asc' }, { createdAt: 'asc' }],
  })

  return assignments.map((assignment) => ({
    id: assignment.id,
    tenantId: assignment.tenantId,
    verticalDropletId: assignment.verticalDropletId,
    name: assignment.nameOverride || assignment.verticalDroplet.name,
    command: assignment.verticalDroplet.command,
    aliases: normalizeAliases(assignment.verticalDroplet.commandAliasesJson),
    helpText: assignment.verticalDroplet.commandHelpText,
    type: assignment.verticalDroplet.dropletType.toLowerCase(),
    dropletDefinitionJson:
      assignment.verticalDroplet.dropletDefinitionJson as Prisma.JsonValue,
    shadowSkillDefinitionJson:
      assignment.verticalDroplet.shadowSkillDefinitionJson as Prisma.JsonValue,
    status: assignment.verticalDroplet.status,
    active: assignment.active,
    placement: assignment.placement,
    configOverrideJson: assignment.configOverrideJson,
  }))
}

export async function executeTenantCommand(tenantId: string, commandText: string) {
  const trimmed = commandText.trim()
  if (!trimmed.startsWith('/')) {
    throw new AppError(400, 'Commands must start with /.')
  }

  const activeDroplets = await listActiveTenantDroplets(tenantId)

  if (trimmed === '/help') {
    return {
      summaryText:
        ['Global commands:', '/help', '/droplet list', '/open droplet <name>']
          .concat(
            activeDroplets.map(
              (droplet) => `${droplet.command} — ${droplet.helpText}`
            )
          )
          .join('\n'),
      preview: null,
    }
  }

  if (trimmed === '/droplet list') {
    return {
      summaryText:
        activeDroplets.length > 0
          ? activeDroplets
              .map((droplet) => `${droplet.command} — ${droplet.name}`)
              .join('\n')
          : 'No active droplets for this tenant.',
      preview: null,
    }
  }

  if (trimmed.startsWith('/open droplet ')) {
    const identifier = trimmed.replace('/open droplet ', '').trim().replace(/^["']|["']$/g, '')
    const droplet = activeDroplets.find(
      (item) =>
        item.id === identifier ||
        item.name.toLowerCase() === identifier.toLowerCase()
    )
    if (!droplet) {
      throw new AppError(404, `No active droplet found for "${identifier}".`)
    }
    const fallbackPreview = await previewDropletDefinition(
      tenantId,
      droplet.dropletDefinitionJson as never
    )
    const preview = droplet.shadowSkillDefinitionJson
      ? await runShadowSkillDefinition(
          tenantId,
          droplet.shadowSkillDefinitionJson as never
        ).catch(() => fallbackPreview)
      : fallbackPreview
    return {
      summaryText: `Opened ${droplet.name}.`,
      preview,
      matchedDroplet: droplet,
    }
  }

  const droplet = activeDroplets.find((item) => {
    if (item.command === trimmed) {
      return true
    }
    return item.aliases.includes(trimmed)
  })

  if (!droplet) {
    throw new AppError(400, 'Unknown command. Use /help to see available commands.')
  }

  const preview = await previewDropletDefinition(
    tenantId,
    droplet.dropletDefinitionJson as never
  )

  const structuredPreview = droplet.shadowSkillDefinitionJson
    ? await runShadowSkillDefinition(
        tenantId,
        droplet.shadowSkillDefinitionJson as never
      ).catch(() => preview)
    : preview

  return {
    summaryText: `${droplet.name} opened from ${trimmed}.`,
    preview: structuredPreview,
    matchedDroplet: droplet,
  }
}
