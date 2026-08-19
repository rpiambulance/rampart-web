import { api, ApiError } from '@/lib/api';
import { ErrorBanner } from '@/components/error-banner';
import { PageHeader } from '@/components/page-header';
import { EmailCard, type EmailSettings } from '../email-card';
import {
  SlackCard,
  type ChannelCheck,
  type SlackSettings,
} from '../slack-card';
import {
  NotificationsCard,
  type MessageTypeSetting,
} from '../notifications-card';
import { NoAccess } from '../types';

/**
 * Everything about how the portal reaches people: the two transports, and
 * which messages travel on each. They belong together because the third
 * card's switches are meaningless until the first two are configured.
 */
export default async function MessagingSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    testTo?: string;
    testOk?: string;
    testDetail?: string;
    testHint?: string;
  }>;
}) {
  const { error, testTo, testOk, testDetail, testHint } = await searchParams;
  const testResult = testTo
    ? { ok: testOk === 'true', detail: testDetail, hint: testHint, to: testTo }
    : undefined;

  let emailSettings: EmailSettings;
  let messageTypes: MessageTypeSetting[];
  let slackSettings: SlackSettings;
  // Asking Slack costs a round trip per channel, so a failure here must not
  // take the page with it — the settings are still editable without it.
  let slackChecks: ChannelCheck[] = [];
  try {
    [emailSettings, messageTypes, slackSettings] = await Promise.all([
      api<EmailSettings>('/v1/settings/email'),
      api<MessageTypeSetting[]>('/v1/settings/notifications'),
      api<SlackSettings>('/v1/settings/slack'),
    ]);
    slackChecks = await api<ChannelCheck[]>('/v1/settings/slack/check').catch(
      () => [],
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return <NoAccess />;
    throw err;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messaging"
        description="Mail server, Slack, and which messages go out on each."
      />
      <ErrorBanner message={error} />
      <EmailCard settings={emailSettings} testResult={testResult} />
      <SlackCard settings={slackSettings} checks={slackChecks} />
      <NotificationsCard types={messageTypes} />
    </div>
  );
}
