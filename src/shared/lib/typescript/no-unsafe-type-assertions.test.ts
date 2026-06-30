/// <reference types="node" />

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const sourceRoot = join(process.cwd(), 'src')
const generatedPathParts = [
  `${join('src', 'shared', 'api', 'generated')}${sep}`,
  `${join('src', 'shared', 'api', 'generated-zod')}${sep}`,
]

type TypeAssertionUsage = {
  file: string
  line: number
  text: string
}

const isGeneratedFile = (filePath: string) => {
  const normalizedPath = relative(process.cwd(), filePath)

  return generatedPathParts.some((pathPart) =>
    normalizedPath.startsWith(pathPart),
  )
}

const collectSourceFiles = (directory: string): string[] => {
  return readdirSync(directory).flatMap((entry) => {
    const filePath = join(directory, entry)
    const stat = statSync(filePath)

    if (stat.isDirectory()) {
      return collectSourceFiles(filePath)
    }

    if (
      isGeneratedFile(filePath) ||
      filePath.includes('.test.') ||
      !/\.tsx?$/.test(filePath)
    ) {
      return []
    }

    return [filePath]
  })
}

const collectUnsafeTypeAssertions = () => {
  return collectSourceFiles(sourceRoot).flatMap((filePath) => {
    const sourceText = readFileSync(filePath, 'utf8')
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    )
    const usages: TypeAssertionUsage[] = []

    const visit = (node: ts.Node) => {
      if (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) {
        const typeText = node.type.getText(sourceFile)

        if (typeText !== 'const') {
          const position = sourceFile.getLineAndCharacterOfPosition(
            node.getStart(sourceFile),
          )

          usages.push({
            file: relative(process.cwd(), filePath),
            line: position.line + 1,
            text: node.getText(sourceFile).replace(/\s+/g, ' '),
          })
        }
      }

      ts.forEachChild(node, visit)
    }

    visit(sourceFile)

    return usages
  })
}

describe('production type assertions', () => {
  it('keeps hand-written production code free from unsafe type assertions', () => {
    expect(collectUnsafeTypeAssertions()).toEqual([])
  })
})
