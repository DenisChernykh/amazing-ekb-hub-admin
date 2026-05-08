import { UploadOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { Button, Space, Upload } from 'antd'
import { PLACE_COVER_UPLOAD_ACCEPT } from '../model/place-cover-upload'

/**
 * Props панели действий для cover upload.
 */
export type PlaceCoverUploadActionsProps = {
  hasSelectedFile: boolean
  isPending: boolean
  onBeforeUpload: UploadProps['beforeUpload']
  onReset: () => void
  onUpload: () => void
}

/**
 * Рендерит выбор файла, отправку и сброс локального выбора cover-фото.
 */
export function PlaceCoverUploadActions({
  hasSelectedFile,
  isPending,
  onBeforeUpload,
  onReset,
  onUpload,
}: PlaceCoverUploadActionsProps) {
  return (
    <Space align="center" wrap>
      <Upload
        accept={PLACE_COVER_UPLOAD_ACCEPT}
        beforeUpload={onBeforeUpload}
        disabled={isPending}
        showUploadList={false}
      >
        <Button disabled={isPending} icon={<UploadOutlined />}>
          Выбрать файл
        </Button>
      </Upload>

      <Button
        disabled={!hasSelectedFile || isPending}
        loading={isPending}
        onClick={onUpload}
        type="primary"
      >
        Загрузить
      </Button>

      <Button disabled={!hasSelectedFile || isPending} onClick={onReset}>
        Сбросить выбор
      </Button>
    </Space>
  )
}
