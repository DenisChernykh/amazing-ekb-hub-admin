import {
  useRemoveCollectionPhotoMutation,
  useUploadCollectionPhotoMutation,
} from '@/entities/collection'
import { getCollectionCoverUploadError } from '@/features/collection/cover/model/collection-cover-upload'
import { getCollectionFormError } from '@/features/collection/model/collection-errors'
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Flex,
  Image,
  Upload,
  type UploadProps,
} from 'antd'
import { useEffect, useRef, useState } from 'react'

/** Панель cover lifecycle с preview cleanup и отдельным remove mutation. */
export function CollectionCoverPanel({
  collectionId,
  coverImageUrl,
}: {
  collectionId: string
  coverImageUrl: string | null
}) {
  const { message } = AntdApp.useApp()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const previewRef = useRef<string | null>(null)
  const clearPreview = () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = null
    setPreview(null)
    setFile(null)
  }
  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    },
    [],
  )
  const upload = useUploadCollectionPhotoMutation({
    onError: (apiError) => setError(getCollectionFormError(apiError)),
    onSuccess: () => {
      clearPreview()
      setError(null)
      void message.success('Cover-фото обновлено')
    },
  })
  const remove = useRemoveCollectionPhotoMutation({
    onError: (apiError) => setError(getCollectionFormError(apiError)),
    onSuccess: () => void message.success('Cover-фото удалено'),
  })
  const beforeUpload: UploadProps['beforeUpload'] = (selected) => {
    const validation = getCollectionCoverUploadError(selected)
    if (validation) {
      setError(validation)
      return Upload.LIST_IGNORE
    }
    clearPreview()
    const url = URL.createObjectURL(selected)
    previewRef.current = url
    setFile(selected)
    setPreview(url)
    setError(null)
    return false
  }
  return (
    <Card title="Cover-фото">
      <Flex gap={12} vertical>
        {error && <Alert showIcon title={error} type="error" />}
        {(preview ?? coverImageUrl) && (
          <Image
            alt="Cover подборки"
            height={180}
            preview
            src={preview ?? coverImageUrl ?? undefined}
            width={280}
          />
        )}
        {!preview && (
          <Upload
            accept="image/jpeg,image/png,image/webp"
            beforeUpload={beforeUpload}
            maxCount={1}
            showUploadList={false}
          >
            <Button>Выбрать фото</Button>
          </Upload>
        )}
        {file && (
          <Flex gap={8}>
            <Button
              loading={upload.isPending}
              onClick={() =>
                upload.mutate({ collectionId, data: { photo: file } })
              }
              type="primary"
            >
              Загрузить
            </Button>
            <Button onClick={clearPreview}>Отменить</Button>
          </Flex>
        )}
        {coverImageUrl && !file && (
          <Button
            danger
            loading={remove.isPending}
            onClick={() => remove.mutate({ collectionId })}
          >
            Удалить cover
          </Button>
        )}
      </Flex>
    </Card>
  )
}
