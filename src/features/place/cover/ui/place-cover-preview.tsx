import { Empty, Image } from 'antd'
import styles from './place-cover-upload-panel.module.css'

/**
 * Props preview блока cover-фото.
 */
export type PlaceCoverPreviewProps = {
  currentCoverImageUrl: string | null
  previewUrl: string | null
}

/**
 * Показывает выбранное preview cover-фото, текущее фото или empty state.
 */
export function PlaceCoverPreview({
  currentCoverImageUrl,
  previewUrl,
}: PlaceCoverPreviewProps) {
  const previewSrc = previewUrl ?? currentCoverImageUrl

  return (
    <div className={styles.preview}>
      {previewSrc ? (
        <Image
          alt={previewUrl ? 'Новое cover-фото' : 'Текущее cover-фото'}
          className={styles.previewImage}
          src={previewSrc}
        />
      ) : (
        <Empty description="Cover-фото не загружено" />
      )}
    </div>
  )
}
