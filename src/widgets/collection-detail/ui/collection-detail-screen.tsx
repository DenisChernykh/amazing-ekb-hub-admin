import { useCollectionDetailQuery } from '@/entities/collection'
import { CollectionCoverPanel } from '@/features/collection/cover/ui/collection-cover-panel'
import { DocumentTitle } from '@/shared/ui/document-title/document-title'
import {
  ScreenApiErrorState,
  ScreenLoadingState,
} from '@/shared/ui/screen-state/screen-state'
import { Alert, Card, Flex, theme, Typography } from 'antd'
import type { CSSProperties } from 'react'
import { CollectionDetailHeader } from './collection-detail-header'
import styles from './collection-detail.module.css'
import {
  CollectionMembersOrder,
  CollectionMembersTable,
} from './collection-members-table'
import { CollectionPlacePickerWithAction } from './collection-place-picker'

/** Screen detail подборки с cover, membership, order и targeted import link. */
export function CollectionDetailScreen({
  addedPlaceId,
  collectionId,
}: {
  addedPlaceId?: string | null
  collectionId: string
}) {
  const { token } = theme.useToken()
  const query = useCollectionDetailQuery(collectionId)
  const style = {
    '--collection-highlight': token.colorWarningBg,
  } as CSSProperties
  if (query.isPending)
    return (
      <Flex gap={16} style={style} vertical>
        <DocumentTitle title="Подборка" />
        <ScreenLoadingState title="Загружаем подборку" />
      </Flex>
    )
  if (query.isError || !query.data)
    return (
      <Flex gap={16} style={style} vertical>
        <DocumentTitle title="Подборка" />
        <ScreenApiErrorState
          error={query.error}
          forbiddenAction={{ label: 'К подборкам', to: '/collections' }}
          notFoundAction={{ label: 'К подборкам', to: '/collections' }}
        />
      </Flex>
    )
  const collection = query.data
  return (
    <Flex gap={16} style={style} vertical>
      <DocumentTitle title={collection.title} />
      <CollectionDetailHeader collection={collection} />
      {collection.status === 'active' && collection.activePlaceCount === 0 && (
        <Alert
          className={styles.warning}
          showIcon
          message="Подборка активна, но в ней нет активных мест: публичная выдача останется пустой."
          type="warning"
        />
      )}
      <Typography.Paragraph type="secondary">
        {collection.description || 'Описание не задано'}
      </Typography.Paragraph>
      <CollectionCoverPanel
        collectionId={collection.id}
        coverImageUrl={collection.coverImageUrl}
      />
      <Card title="Добавить существующее место">
        <CollectionPlacePickerWithAction
          collection={collection}
          onAdded={() => void query.refetch()}
        />
      </Card>
      <Card title="Места подборки">
        <CollectionMembersTable
          addedPlaceId={addedPlaceId}
          collection={collection}
        />
        <CollectionMembersOrder collection={collection} />
      </Card>
    </Flex>
  )
}
