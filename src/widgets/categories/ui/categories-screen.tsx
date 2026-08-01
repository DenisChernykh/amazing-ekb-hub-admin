import { usePlaceCategoriesQuery } from '@/entities/category/model/category-hooks'
import type { PlaceCategoryListResponseDto } from '@/shared/api'
import { DocumentTitle } from '@/shared/ui/document-title/document-title'
import {
  ScreenApiErrorState,
  ScreenLoadingState,
} from '@/shared/ui/screen-state/screen-state'
import { Card, Flex, theme, Typography } from 'antd'
import type { CSSProperties } from 'react'
import { useState } from 'react'
import { CategoriesDrawers } from './categories-drawers'
import { CategoriesHeader } from './categories-header'
import styles from './categories-screen.module.css'
import { CategoriesTable } from './categories-table'

const emptyCategoriesResponse: PlaceCategoryListResponseDto = {
  items: [],
}

type CategoriesScreenVariables = CSSProperties & {
  '--categories-border': string
}

/**
 * Виджет управления категориями мест.
 *
 * @remarks Загружает справочник через entity-level hook и управляет create/edit drawers локальным state.
 */
export function CategoriesScreen() {
  const { token } = theme.useToken()
  const categoriesQuery = usePlaceCategoriesQuery()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<
    PlaceCategoryListResponseDto['items'][number] | null
  >(null)
  const data = categoriesQuery.data ?? emptyCategoriesResponse
  const style: CategoriesScreenVariables = {
    '--categories-border': token.colorBorderSecondary,
  }

  if (categoriesQuery.isPending) {
    return (
      <Flex gap={16} style={style} vertical>
        <DocumentTitle title="Категории" />
        <Typography.Title className={styles.title} level={2}>
          Категории
        </Typography.Title>
        <ScreenLoadingState title="Загружаем категории" />
      </Flex>
    )
  }

  if (categoriesQuery.isError) {
    return (
      <Flex gap={16} style={style} vertical>
        <DocumentTitle title="Категории" />
        <Typography.Title className={styles.title} level={2}>
          Категории
        </Typography.Title>
        <ScreenApiErrorState
          error={categoriesQuery.error}
          forbiddenAction={{ label: 'На главную', to: '/' }}
          notFoundAction={{ label: 'К категориям', to: '/categories' }}
        />
      </Flex>
    )
  }

  return (
    <Flex gap={16} style={style} vertical>
      <DocumentTitle title="Категории" />
      <CategoriesHeader
        onCreate={() => {
          setIsCreateOpen(true)
        }}
        total={data.items.length}
      />

      <Card className={styles.card}>
        <CategoriesTable
          categories={data.items}
          isFetching={categoriesQuery.isFetching}
          onEdit={setEditingCategory}
        />
      </Card>

      <CategoriesDrawers
        editingCategory={editingCategory}
        isCreateOpen={isCreateOpen}
        onCloseCreate={() => {
          setIsCreateOpen(false)
        }}
        onCloseEdit={() => {
          setEditingCategory(null)
        }}
      />
    </Flex>
  )
}
