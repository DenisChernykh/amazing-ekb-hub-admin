import { setupServer } from 'msw/node'

import { handlers } from './handlers'

/** Общий MSW server для transport и router integration tests. */
export const server = setupServer(...handlers)
