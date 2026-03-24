export const dropletStudioSections = [
  { key: 'overview', label: 'Overview', to: '/droplet-studio' },
  { key: 'droplets', label: 'Droplets', to: '/droplet-studio/droplets' },
  { key: 'catalog', label: 'Catalog', to: '/droplet-studio/catalog' },
  { key: 'preview-lab', label: 'Preview Lab', to: '/droplet-studio/preview-lab' },
  {
    key: 'prompt-templates',
    label: 'Prompt Templates',
    to: '/droplet-studio/prompt-templates',
  },
  { key: 'dummy-data', label: 'Dummy Data', to: '/droplet-studio/dummy-data' },
  { key: 'versions', label: 'Versions', to: '/droplet-studio/versions' },
] as const

export type DropletStudioSectionKey =
  (typeof dropletStudioSections)[number]['key']
