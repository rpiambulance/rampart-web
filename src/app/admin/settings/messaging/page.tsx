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
  SlackLinksCard,
  type LinkProposal,
  type SlackLinks,
} from '../slack-links-card';
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
    matched?: string;
    testTo?: string;
    testOk?: string;
    testDetail?: string;
    testHint?: string;
  }>;
}) {
  const { error, matched, testTo, testOk, testDetail, testHint } =
    await searchParams;
  const testResult = testTo
    ? { ok: testOk === 'true', detail: testDetail, hint: testHint, to: testTo }
    : undefined;

  let emailSettings: EmailSettings;
  let messageTypes: MessageTypeSetting[];
  let slackSettings: SlackSettings;
  // Asking Slack costs a round trip per channel, so a failure here must not
  // take the page with it — the settings are still editable without it.
  let slackChecks: ChannelCheck[] = [];
  let slackLinks: SlackLinks = { linked: 0, unlinked: [] };
  let slackProposals: LinkProposal[] = [];
  try {
    [emailSettings, messageTypes, slackSettings] = await Promise.all([
      api<EmailSettings>('/v1/settings/email'),
      api<MessageTypeSetting[]>('/v1/settings/notifications'),
      api<SlackSettings>('/v1/settings/slack'),
    ]);
    // Each of these calls Slack, so a workspace being unreachable must not
    // take the settings page with it.
    [slackChecks, slackLinks, slackProposals] = await Promise.all([
      api<ChannelCheck[]>('/v1/settings/slack/check').catch(() => []),
      api<SlackLinks>('/v1/settings/slack/links').catch(() => ({
        linked: 0,
        unlinked: [],
      })),
      api<LinkProposal[]>('/v1/settings/slack/links/proposals').catch(() => []),
    ]);
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
      <SlackLinksCard
        links={slackLinks}
        proposals={slackProposals}
        matched={matched}
      />
      <NotificationsCard types={messageTypes} />
    </div>
  );
}
