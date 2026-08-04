import jsdoc from 'eslint-plugin-jsdoc'
import tsdoc from 'eslint-plugin-tsdoc'
import { defineConfig } from 'eslint/config'

import baseConfig from './eslint.config.js'

const exportedApiContexts = [
  'ExportNamedDeclaration[declaration.type="FunctionDeclaration"]',
  'ExportDefaultDeclaration[declaration.type="FunctionDeclaration"]',
  'ExportNamedDeclaration[declaration.type="ClassDeclaration"]',
  'ExportNamedDeclaration[declaration.type="TSInterfaceDeclaration"]',
  'ExportNamedDeclaration[declaration.type="TSTypeAliasDeclaration"]',
  'ExportNamedDeclaration[declaration.type="TSEnumDeclaration"]',
  'ExportNamedDeclaration[declaration.type="VariableDeclaration"]',
]

export default defineConfig([
  ...baseConfig,
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/**/*.test.{ts,tsx}',
      'src/test/**/*.{ts,tsx}',
      'src/shared/api/generated/**/*',
      'src/shared/api/generated-zod/**/*',
    ],
    plugins: {
      tsdoc,
      jsdoc,
    },
    settings: {
      jsdoc: {
        mode: 'typescript',
      },
    },
    rules: {
      'tsdoc/syntax': 'warn',
      'jsdoc/require-jsdoc': [
        'warn',
        {
          contexts: exportedApiContexts,
          exemptEmptyFunctions: false,
          enableFixer: false,
          require: {
            FunctionDeclaration: false,
          },
        },
      ],
      'jsdoc/require-description': 'warn',
    },
  },
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    plugins: {
      tsdoc,
    },
    rules: {
      'tsdoc/syntax': 'warn',
    },
  },
])
