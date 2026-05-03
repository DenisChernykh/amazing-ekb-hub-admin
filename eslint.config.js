import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import jsdoc from 'eslint-plugin-jsdoc'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tsdoc from 'eslint-plugin-tsdoc'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

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
  globalIgnores([
    'dist',
    'coverage',
    'src/shared/api/generated/**/*',
    'src/shared/api/generated-zod/**/*',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
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
      'tsdoc/syntax': 'error',
      'jsdoc/require-jsdoc': [
        'error',
        {
          contexts: exportedApiContexts,
          exemptEmptyFunctions: false,
          enableFixer: false,
          require: {
            FunctionDeclaration: false,
          },
        },
      ],
      'jsdoc/require-description': 'error',
    },
  },
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    plugins: {
      tsdoc,
    },
    rules: {
      'tsdoc/syntax': 'error',
    },
  },
  {
    files: ['*.config.{js,ts}', 'eslint.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  prettier,
])
