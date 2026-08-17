'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { saveEmailSettings, sendTestEmail } from './actions';

export type EmailSettings = {
  configured: boolean;
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string | null;
  from?: string;
  hasPassword?: boolean;
};

const FIELD = 'h-8 rounded-md border border-input bg-background px-2 text-sm';

/**
 * Mail server settings, and a way to prove they work before relying on them.
 *
 * The password is never sent to the browser, so the field is left blank and
 * only submitted when someone types a new one — saving with it empty keeps
 * whatever is stored.
 */
export function EmailCard({
  settings,
  testResult,
}: {
  settings: EmailSettings;
  testResult?: { ok: boolean; detail?: string; to?: string };
}) {
  const [secure, setSecure] = useState(settings.secure ?? false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Email</CardTitle>
        <CardDescription>
          Used for coverage confirmations, approvals and follow-ups, and member
          notifications. Until this is set, messages are written to the API log
          instead of being sent.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {settings.configured ? null : (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            No mail server configured — nothing is reaching anyone&apos;s inbox.
          </p>
        )}

        <form action={saveEmailSettings} className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-xs text-muted-foreground">
            Host
            <input
              name="host"
              required
              defaultValue={settings.host ?? ''}
              placeholder="smtp.example.com"
              className={`${FIELD} w-56`}
            />
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Port
            <input
              name="port"
              type="number"
              required
              min={1}
              max={65535}
              defaultValue={settings.port ?? 587}
              className={`${FIELD} w-24`}
            />
          </label>
          <label className="flex h-8 items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              name="secure"
              checked={secure}
              onChange={(event) => setSecure(event.target.checked)}
              className="size-3.5"
            />
            Implicit TLS
            <span className="text-muted-foreground/70">
              ({secure ? 'port 465' : 'STARTTLS, usually 587'})
            </span>
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Username (optional)
            <input
              name="user"
              defaultValue={settings.user ?? ''}
              className={`${FIELD} w-48`}
            />
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Password
            <input
              name="pass"
              type="password"
              autoComplete="new-password"
              placeholder={settings.hasPassword ? 'unchanged' : ''}
              className={`${FIELD} w-48`}
            />
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            From
            <input
              name="from"
              required
              defaultValue={settings.from ?? ''}
              placeholder="RPI Ambulance <no-reply@rpiambulance.com>"
              className={`${FIELD} w-80`}
            />
          </label>
          <Button type="submit" size="sm">
            Save
          </Button>
        </form>

        <div className="border-t pt-4">
          <form action={sendTestEmail} className="flex flex-wrap items-end gap-2">
            <label className="grid gap-1 text-xs text-muted-foreground">
              Send a test message to
              <input
                name="to"
                type="email"
                required
                placeholder="you@rpiambulance.com"
                className={`${FIELD} w-72`}
              />
            </label>
            <Button type="submit" size="sm" variant="outline">
              Send test
            </Button>
          </form>

          {testResult ? (
            <p
              className={`mt-2 rounded-md px-3 py-2 text-sm ${
                testResult.ok
                  ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100'
                  : 'bg-destructive/10 text-destructive'
              }`}
            >
              {testResult.ok
                ? `Sent to ${testResult.to}. If it does not arrive, check the spam folder and the From address.`
                : `Could not send: ${testResult.detail}`}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
