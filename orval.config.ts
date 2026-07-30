import { defineConfig } from 'orval'

const apiClientSnapshotPath = './openapi.yaml'
const validationSnapshotPath = './openapi/openapi.json'

export default defineConfig({
  amazingEkbHub: {
    input: {
      target: apiClientSnapshotPath,
    },
    output: {
      target: './src/shared/api/generated/index.ts',
      schemas: './src/shared/api/generated/model',
      operationSchemas: './src/shared/api/generated/operation',
      client: 'react-query',
      httpClient: 'axios',
      mode: 'tags-split',
      clean: true,
      urlEncodeParameters: true,
      override: {
        mutator: {
          path: './src/shared/api/client/orval-mutator.ts',
          name: 'apiMutator',
        },
        useNamedParameters: true,
        useTypeOverInterfaces: true,
        enumGenerationType: 'union',
        query: {
          version: 5,
          signal: true,
          useQuery: true,
          useMutation: true,
        },
      },
    },
  },

  amazingEkbHubZod: {
    input: {
      target: validationSnapshotPath,
    },
    output: {
      target: './src/shared/api/generated-zod/index.ts',
      client: 'zod',
      mode: 'tags-split',
      fileExtension: '.zod.ts',
      clean: true,
      override: {
        zod: {
          strict: {
            response: true,
            body: true,
            query: true,
            param: true,
            header: true,
          },
          generate: {
            response: true,
            body: true,
            query: true,
            param: true,
            header: true,
          },
          generateEachHttpStatus: true,
        },
      },
    },
  },
})
