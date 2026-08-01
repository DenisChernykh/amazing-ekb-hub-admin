import type { PlaceImportOperationResponseDto } from '@/shared/api'
import { Alert, Button, Flex, Statistic, Typography } from 'antd'
import { useCaptchaViewer } from '../model/use-captcha-viewer'

/** Действия и TTL one-time CAPTCHA popup. */
export function PlaceImportCaptchaPanel({
  operation,
}: {
  operation: PlaceImportOperationResponseDto
}) {
  const viewer = useCaptchaViewer(operation.id)
  const expiresAt = viewer.expiresAt ?? operation.captchaExpiresAt

  return (
    <Flex gap={12} vertical>
      <Alert
        description="Откройте изолированное окно viewer и решите CAPTCHA до истечения TTL. Доступ одноразовый и не содержит capability в server logs или query string."
        showIcon
        title="Яндекс запросил CAPTCHA"
        type="warning"
      />

      {expiresAt && (
        <Statistic.Countdown
          format="mm:ss"
          title="Доступ истекает через"
          value={new Date(expiresAt).getTime()}
        />
      )}

      {viewer.errorMessage && (
        <Typography.Text type="danger">{viewer.errorMessage}</Typography.Text>
      )}

      <Flex gap={8} wrap>
        <Button
          disabled={Boolean(viewer.expiresAt) || viewer.isRevoking}
          loading={viewer.isOpening}
          onClick={viewer.open}
          type="primary"
        >
          Открыть CAPTCHA
        </Button>
        <Button
          danger
          disabled={viewer.isOpening}
          loading={viewer.isRevoking}
          onClick={viewer.revoke}
        >
          Отозвать доступ
        </Button>
      </Flex>
    </Flex>
  )
}
