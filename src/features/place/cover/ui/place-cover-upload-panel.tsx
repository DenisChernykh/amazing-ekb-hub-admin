import { useUploadPlaceCoverPhotoMutation } from '@/entities/place/model/place-mutations'
import { getPlaceCoverUploadApiError } from '@/features/place/model/place-errors'
import type { UploadProps } from 'antd'
import { Alert, App as AntdApp, Card, Flex, Typography, Upload } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { getPlaceCoverUploadError } from '../model/place-cover-upload'
import { PlaceCoverPreview } from './place-cover-preview'
import { PlaceCoverUploadActions } from './place-cover-upload-actions'

/**
 * Props панели загрузки cover-фото места.
 */
export type PlaceCoverUploadPanelProps = {
  coverImageUrl: string | null
  placeId: string
}

/**
 * Панель просмотра, локального preview и загрузки cover-фото места.
 *
 * @remarks Требует AntD `App` provider и React Query provider через entity mutation bridge.
 * `useEffect` очищает browser object URL при размонтировании компонента.
 */
export function PlaceCoverUploadPanel({
  coverImageUrl,
  placeId,
}: PlaceCoverUploadPanelProps) {
  const { message } = AntdApp.useApp()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [errorMessages, setErrorMessages] = useState<string[]>([])
  const previewObjectUrlRef = useRef<string | null>(null)

  const clearPreviewUrl = () => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current)
      previewObjectUrlRef.current = null
    }

    setPreviewUrl(null)
  }

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current)
      }
    }
  }, [])

  const uploadMutation = useUploadPlaceCoverPhotoMutation({
    onError: (error) => {
      const errorMessage = getPlaceCoverUploadApiError(error)
      setErrorMessages([errorMessage])
      void message.error(errorMessage)
    },
    onSuccess: () => {
      setSelectedFile(null)
      clearPreviewUrl()
      setErrorMessages([])
      message.success('Cover-фото обновлено')
    },
  })

  const handleBeforeUpload: UploadProps['beforeUpload'] = (file) => {
    const validationError = getPlaceCoverUploadError(file)

    if (validationError) {
      setErrorMessages([validationError])
      message.error(validationError)
      return Upload.LIST_IGNORE
    }

    clearPreviewUrl()
    const objectUrl = URL.createObjectURL(file)
    previewObjectUrlRef.current = objectUrl
    setSelectedFile(file)
    setPreviewUrl(objectUrl)
    setErrorMessages([])
    return false
  }

  const handleUpload = () => {
    if (!selectedFile) {
      return
    }

    uploadMutation.mutate({
      data: { photo: selectedFile },
      pathParams: { placeId },
    })
  }

  const handleReset = () => {
    setSelectedFile(null)
    clearPreviewUrl()
    setErrorMessages([])
  }

  return (
    <Card title="Cover-фото">
      <Flex gap={16} vertical>
        {Boolean(errorMessages.length) && (
          <Alert
            message="Не удалось загрузить cover-фото"
            showIcon
            type="error"
            description={
              <Flex gap={4} vertical>
                {errorMessages.map((errorMessage) => (
                  <Typography.Text key={errorMessage}>
                    {errorMessage}
                  </Typography.Text>
                ))}
              </Flex>
            }
          />
        )}

        <PlaceCoverPreview
          currentCoverImageUrl={coverImageUrl}
          previewUrl={previewUrl}
        />

        <PlaceCoverUploadActions
          hasSelectedFile={Boolean(selectedFile)}
          isPending={uploadMutation.isPending}
          onBeforeUpload={handleBeforeUpload}
          onReset={handleReset}
          onUpload={handleUpload}
        />

        {selectedFile && (
          <Typography.Text type="secondary">
            Выбран файл: {selectedFile.name}
          </Typography.Text>
        )}
      </Flex>
    </Card>
  )
}
