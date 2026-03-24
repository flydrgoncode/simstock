export * from './runner'
export * from './schemas'

export const dummyDataRunnerStatus = {
  phase: 'implemented',
  status: 'ready',
  message:
    'Dummy-data preview runner validates shadowSkillDefinitionJson, executes preview logic, and returns a structured execution log.',
} as const
