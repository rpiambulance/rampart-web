import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { applySlackLinks } from './actions';

export type SlackLinks = {
  linked: number;
  unlinked: Array<{
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  }>;
};

export type LinkProposal = {
  memberId: number;
  memberName: string;
  memberEmail: string;
  slackId: string;
  slackName: string;
  matchedOn: string;
};

/**
 * Which members Slack can actually reach.
 *
 * A member with no Slack account against them gets no direct messages
 * however their notification settings read, is named rather than mentioned on
 * the crew post, and presses Done on a chore without their name being
 * recorded — none of which announces itself. The count is here for that
 * reason as much as the matching is.
 */
export function SlackLinksCard({
  links,
  proposals,
  matched,
}: {
  links: SlackLinks;
  proposals: LinkProposal[];
  /** How many were linked by the last run, if there was one. */
  matched?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Slack accounts</CardTitle>
        <CardDescription>
          {links.linked} member{links.linked === 1 ? '' : 's'} linked
          {links.unlinked.length
            ? `, ${links.unlinked.length} not. Those ${
                links.unlinked.length === 1 ? 'one gets' : 'ones get'
              } no Slack messages at all, whatever their notification settings say.`
            : '. Everyone active can be reached.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {matched ? (
          <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
            Linked {matched}.
          </p>
        ) : null}

        {proposals.length ? (
          <form action={applySlackLinks} className="space-y-2">
            <input
              type="hidden"
              name="pairs"
              value={JSON.stringify(
                proposals.map((proposal) => ({
                  memberId: proposal.memberId,
                  slackId: proposal.slackId,
                })),
              )}
            />
            <p className="text-sm">
              Matching on email address would link these:
            </p>
            <div className="rounded-md border">
              {proposals.map((proposal) => (
                <div
                  key={proposal.memberId}
                  className="flex flex-wrap items-center gap-2 border-b px-3 py-2 text-sm last:border-b-0"
                >
                  <span className="font-medium">{proposal.memberName}</span>
                  <span aria-hidden className="text-muted-foreground">
                    →
                  </span>
                  <span>{proposal.slackName}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {proposal.matchedOn}
                  </Badge>
                </div>
              ))}
            </div>
            <Button type="submit" size="sm">
              Link {proposals.length}{' '}
              {proposals.length === 1 ? 'account' : 'accounts'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Shown before it happens because this writes to member records in
              bulk off Slack&apos;s data. Anyone whose Slack address differs
              from both of theirs will not appear, and can be linked by hand on
              their profile or by running <code>/linkme</code> in Slack.
            </p>
          </form>
        ) : links.unlinked.length ? (
          <p className="text-sm text-muted-foreground">
            No email addresses match. Link them by hand on their profile, or
            ask them to run <code>/linkme</code> in Slack — that matches on the
            address Slack holds, which is often the one they actually used.
          </p>
        ) : null}

        {links.unlinked.length ? (
          <details>
            <summary className="cursor-pointer text-sm text-muted-foreground">
              Who is not linked ({links.unlinked.length})
            </summary>
            <ul className="mt-2 space-y-1 text-sm">
              {links.unlinked.map((member) => (
                <li key={member.id}>
                  {member.lastName}, {member.firstName}{' '}
                  <span className="text-xs text-muted-foreground">
                    {member.email}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </CardContent>
    </Card>
  );
}
