import {
  useCreatePlaceMutation,
  useUploadPlaceCoverPhotoMutation,
} from '@/entities/place/model/place-mutations'
import { PlaceCoverDraftPicker } from '@/features/place/cover/ui/place-cover-draft-picker'
import {
  toCreatePlaceRequest,
  type PlaceFormValues,
} from '@/features/place/form/model/place-form'
import { PlaceFormErrorAlert } from '@/features/place/form/ui/place-form-error-alert'
import { PlaceFormFields } from '@/features/place/form/ui/place-form-fields'
import { normalizeApiError } from '@/shared/api/client/api-error'
import { Alert, App as AntdApp, Button, Flex, Form, Typography } from 'antd'
import { useState } from 'react'
import { Link } from 'react-router'

type CreatePlaceFormProps = {
  onCancel: () => void
  onCreated: (placeId: string) => void
}

type PartialSuccessState = {
  messages: string[]
  placeId: string
}

/**
 * Ant Design форма создания места через entity-level admin mutations.
 *
 * @remarks Создает место JSON-запросом, затем при наличии выбранного файла
 * загружает cover-фото отдельным multipart-запросом. Требует AntD `App`
 * provider для сообщений об успехе и ошибках и React Router context для
 * перехода к созданному месту после частичного успеха.
 */
export function CreatePlaceForm({ onCancel, onCreated }: CreatePlaceFormProps) {
  const { message } = AntdApp.useApp()
  const [errorMessages, setErrorMessages] = useState<string[]>([])
  const [partialSuccess, setPartialSuccess] =
    useState<PartialSuccessState | null>(null)
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null)
  const createPlaceMutation = useCreatePlaceMutation()
  const uploadCoverMutation = useUploadPlaceCoverPhotoMutation()

  const isPending =
    createPlaceMutation.isPending || uploadCoverMutation.isPending
  const isCreateLocked = Boolean(partialSuccess)

  const handleFinish = async (values: PlaceFormValues) => {
    if (partialSuccess) {
      return
    }

    setErrorMessages([])
    setPartialSuccess(null)

    let createdPlaceId: string | null = null

    try {
      const createdPlace = await createPlaceMutation.mutateAsync({
        data: toCreatePlaceRequest(values),
      })
      createdPlaceId = createdPlace.id

      if (selectedCoverFile) {
        await uploadCoverMutation.mutateAsync({
          data: { photo: selectedCoverFile },
          pathParams: { placeId: createdPlace.id },
        })
        void message.success('Место создано, cover-фото загружено')
      } else {
        void message.success('Место создано')
      }

      onCreated(createdPlace.id)
    } catch (error) {
      const apiError = normalizeApiError(error)

      if (createdPlaceId) {
        setPartialSuccess({
          messages: apiError.messages,
          placeId: createdPlaceId,
        })
        void message.error(apiError.message)
        return
      }

      setErrorMessages(apiError.messages)
      void message.error(apiError.message)
    }
  }

  return (
    <Form<PlaceFormValues>
      layout="vertical"
      name="create-place"
      onFinish={handleFinish}
      requiredMark={false}
    >
      {Boolean(errorMessages.length) && (
        <Form.Item>
          <PlaceFormErrorAlert
            messages={errorMessages}
            title="Не удалось создать место"
          />
        </Form.Item>
      )}

      {partialSuccess && (
        <Form.Item>
          <Alert
            description={
              <Flex gap={8} vertical>
                <Flex gap={4} vertical>
                  {partialSuccess.messages.map((errorMessage) => (
                    <Typography.Text key={errorMessage}>
                      {errorMessage}
                    </Typography.Text>
                  ))}
                </Flex>
                <Link to={`/places/${partialSuccess.placeId}`}>
                  <Button>Открыть созданное место</Button>
                </Link>
              </Flex>
            }
            message="Место создано, но cover-фото не загрузилось"
            showIcon
            type="warning"
          />
        </Form.Item>
      )}

      <PlaceFormFields disabled={isPending || isCreateLocked} />

      <PlaceCoverDraftPicker
        disabled={isPending || isCreateLocked}
        onChange={setSelectedCoverFile}
        selectedFile={selectedCoverFile}
      />

      <Flex gap={8} justify="end" wrap>
        <Button disabled={isPending} onClick={onCancel}>
          Отмена
        </Button>
        <Button
          aria-label="Создать"
          disabled={isCreateLocked}
          htmlType="submit"
          loading={isPending}
          type="primary"
        >
          Создать
        </Button>
      </Flex>
    </Form>
  )
}
