import { useCollectionsQuery } from '@/entities/collection'
import { CreateCollectionDrawer } from '@/features/collection/create/ui/create-collection-drawer'
import { EditCollectionDrawer } from '@/features/collection/edit/ui/edit-collection-drawer'
import { CollectionOrderActions } from '@/features/collection/reorder/ui/collection-order-actions'
import type { AdminCollectionSummaryResponseDto } from '@/shared/api'
import { DocumentTitle } from '@/shared/ui/document-title/document-title'
import {
  ScreenApiErrorState,
  ScreenLoadingState,
} from '@/shared/ui/screen-state/screen-state'
import { Card, Flex, theme } from 'antd'
import type { CSSProperties } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { CollectionsHeader } from './collections-header'
import styles from './collections-screen.module.css'
import { CollectionsTable } from './collections-table'

type CollectionsScreenVariables = CSSProperties & {
  '--collections-border': string
}

/** Экран списка подборок, CRUD drawers и глобального ручного порядка. */
export function CollectionsScreen() {
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const query = useCollectionsQuery()
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] =
    useState<AdminCollectionSummaryResponseDto | null>(null)
  const data = query.data?.items ?? []
  const style: CollectionsScreenVariables = {
    '--collections-border': token.colorBorderSecondary,
  }
  const header = (
    <>
      <DocumentTitle title="Подборки" />
      <CollectionsHeader
        onCreate={() => setCreateOpen(true)}
        total={data.length}
      />
    </>
  )
  if (query.isPending)
    return (
      <Flex gap={16} style={style} vertical>
        {header}
        <ScreenLoadingState title="Загружаем подборки" />
      </Flex>
    )
  if (query.isError)
    return (
      <Flex gap={16} style={style} vertical>
        {header}
        <ScreenApiErrorState
          error={query.error}
          forbiddenAction={{ label: 'На главную', to: '/' }}
          notFoundAction={{ label: 'К подборкам', to: '/collections' }}
        />
      </Flex>
    )
  return (
    <Flex gap={16} style={style} vertical>
      {header}
      <Card className={styles.card}>
        <CollectionsTable
          collections={data}
          loading={query.isFetching}
          onEdit={setEditing}
        />
      </Card>
      <Card className={styles.orderPanel} title="Порядок подборок">
        <CollectionOrderActions
          collections={data}
          onOrderConfirmed={() => undefined}
        />
      </Card>
      <CreateCollectionDrawer
        onClose={() => setCreateOpen(false)}
        onCreated={(collection) => navigate(`/collections/${collection.id}`)}
        open={createOpen}
      />
      <EditCollectionDrawer
        collection={editing}
        onClose={() => setEditing(null)}
      />
    </Flex>
  )
}
