import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createEventKind, deactivateEventKind } from './actions';
import { INPUT_CLS as inputCls, StatusBadge, type EventKind } from './types';

export function EventKindsCard({ kinds }: { kinds: EventKind[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Event kinds</CardTitle>
        <CardDescription>Categories for events on the calendar.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {kinds.length ? (
          <ul className="space-y-1">
            {kinds.map((kind) => (
              <li key={kind.id} className="flex items-center gap-2 text-sm">
                <span>{kind.name}</span>
                {kind.active === false ? (
                  <Badge variant="secondary">Inactive</Badge>
                ) : (
                  <form action={deactivateEventKind.bind(null, kind.id)}>
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-destructive"
                    >
                      deactivate
                    </Button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No event kinds yet.</p>
        )}
        <form action={createEventKind} className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-xs text-muted-foreground">
            Name
            <input type="text" name="name" required className={`${inputCls} w-48`} />
          </label>
          <Button type="submit" size="sm">
            Add kind
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
