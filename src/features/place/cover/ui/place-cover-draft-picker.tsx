import { UploadOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import {
  Alert,
  App as AntdApp,
  Button,
  Flex,
  Form,
  Space,
  Typography,
  Upload,
} from 'antd'
import { useEffect, useRef, useState } from 'react'
import {
  getPlaceCoverUploadError,
  PLACE_COVER_UPLOAD_ACCEPT,
} from '../model/place-cover-upload'
import { PlaceCoverPreview } from './place-cover-preview'

/**
 * Props выбора cover-фото до создания места.
 */
export type PlaceCoverDraftPickerProps = {
  disabled?: boolean
  onChange: (file: File | null) => void
  selectedFile: File | null
}

/**
 * Выбирает и валидирует локальный cover-файл до появления `placeId`.
 *
 * @remarks Требует AntD `App` provider для сообщения о локальных ошибках.
 * `useEffect` нужен только для очистки browser object URL при размонтировании.
 */
export function PlaceCoverDraftPicker({
  disabled = false,
  onChange,
  selectedFile,
}: PlaceCoverDraftPickerProps) {
  const { message } = AntdApp.useApp()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [draftFileName, setDraftFileName] = useState<string | null>(null)
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

  const handleBeforeUpload: UploadProps['beforeUpload'] = (file) => {
    const validationError = getPlaceCoverUploadError(file)

    if (validationError) {
      setErrorMessages([validationError])
      void message.error(validationError)
      return Upload.LIST_IGNORE
    }

    clearPreviewUrl()
    const objectUrl = URL.createObjectURL(file)
    previewObjectUrlRef.current = objectUrl
    setPreviewUrl(objectUrl)
    setDraftFileName(file.name)
    setErrorMessages([])
    onChange(file)
    return false
  }

  const handleReset = () => {
    clearPreviewUrl()
    setDraftFileName(null)
    setErrorMessages([])
    onChange(null)
  }

  const hasSelectedDraft = Boolean(selectedFile || previewUrl)
  const fileName = selectedFile?.name ?? draftFileName

  return (
    <Form.Item label="Cover-фото" layout="vertical">
      <Flex gap={12} vertical>
        {Boolean(errorMessages.length) && (
          <Alert
            description={
              <Flex gap={4} vertical>
                {errorMessages.map((errorMessage) => (
                  <Typography.Text key={errorMessage}>
                    {errorMessage}
                  </Typography.Text>
                ))}
              </Flex>
            }
            message="Не удалось выбрать cover-фото"
            showIcon
            type="error"
          />
        )}

        <PlaceCoverPreview
          currentCoverImageUrl={null}
          previewUrl={previewUrl}
        />

        <Space align="center" wrap>
          <Upload
            accept={PLACE_COVER_UPLOAD_ACCEPT}
            beforeUpload={handleBeforeUpload}
            disabled={disabled}
            showUploadList={false}
          >
            <Button disabled={disabled} icon={<UploadOutlined />}>
              Выбрать файл
            </Button>
          </Upload>

          <Button
            disabled={!hasSelectedDraft || disabled}
            onClick={handleReset}
          >
            Сбросить выбор
          </Button>
        </Space>

        {fileName && (
          <Typography.Text type="secondary">
            Выбран файл: {fileName}
          </Typography.Text>
        )}
      </Flex>
    </Form.Item>
  )
}
