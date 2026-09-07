import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { saveSlackSettings } from './actions';

export type SlackChannelSetting = {
  key: string;
  label: string;
  description: string;
  envVar: string;
  value: string;
};

export type SlackSettings = {
  channels: SlackChannelSetting[];
  hasBotToken: boolean;
  hasSigningSecret: boolean;
};

export type ChannelCheck = {
  key: string;
  channel: string;
  ok: boolean;
  detail: string;
};

const FIELD = 'h-8 rounded-md border border-input bg-background px-2 text-sm';

/**
 * Slack, configured here rather than in the environment.
 *
 * Channels move as a workspace is reorganized, and "redeploy the API to
 * change where a message lands" is the wrong shape of task. Secrets are
 * write-only: the form says whether one is set, never what it is, because a
 * token that can be read back out of a console is a token that leaves in a
 * screenshot.
 */
export function SlackCard({
  settings,
  checks = [],
}: {
  settings: SlackSettings;
  /** What Slack says about each configured channel. */
  checks?: ChannelCheck[];
}) {
  const checkFor = (key: string) => checks.find((check) => check.key === key);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Slack</CardTitle>
        <CardDescription>
          Where each kind of message is posted. Leave a channel blank to send
          nothing there. Channel IDs (C0123456789) are steadier than names —
          a renamed channel keeps its ID.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={saveSlackSettings} className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1 text-xs text-muted-foreground">
              Bot token
              <input
                name="botToken"
                type="password"
                autoComplete="new-password"
                placeholder={settings.hasBotToken ? 'unchanged' : 'xoxb-…'}
                className={`${FIELD} w-64`}
              />
            </label>
            <label className="grid gap-1 text-xs text-muted-foreground">
              Signing secret
              <input
                name="signingSecret"
                type="password"
                autoComplete="new-password"
                placeholder={settings.hasSigningSecret ? 'unchanged' : 'from the app'}
                className={`${FIELD} w-64`}
              />
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            The app needs <code>chat:write</code> to post and{' '}
            <code>channels:join</code> to let itself into a public channel.
            A private channel cannot be joined by a bot at all — invite it
            with <code>/invite</code> in the channel itself.
          </p>
          <p className="text-xs text-muted-foreground">
            The signing secret is what proves an inbound request — a slash
            command, a button press — really came from Slack. Without it those
            are refused.
          </p>

          <div className="rounded-md border">
            {settings.channels.map((channel) => (
              <div
                key={channel.key}
                className="flex flex-wrap items-center gap-3 border-b px-3 py-2 last:border-b-0"
              >
                <div className="min-w-64 flex-1">
                  <p className="text-sm font-medium">{channel.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {channel.description}
                  </p>
                </div>
                <div className="grid gap-1">
                  <input
                    name={`channel:${channel.key}`}
                    defaultValue={channel.value}
                    placeholder="C0123456789"
                    className={`${FIELD} w-56`}
                    aria-label={`${channel.label} channel`}
                  />
                  {/* What Slack says, rather than what the form assumes: a
                      channel that is set but unreachable looks identical to
                      one that works until a message goes missing. */}
                  {checkFor(channel.key) ? (
                    <p
                      className={`max-w-56 text-xs ${
                        checkFor(channel.key)!.ok
                          ? 'text-emerald-700 dark:text-emerald-500'
                          : 'text-destructive'
                      }`}
                    >
                      {checkFor(channel.key)!.detail}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <Button type="submit" size="sm">
            Save Slack settings
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
