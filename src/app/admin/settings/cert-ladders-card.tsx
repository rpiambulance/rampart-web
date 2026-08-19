import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CertLadder } from './cert-ladder';
import { type CertType } from './types';

export function CertLaddersCard({ types }: { types: CertType[] }) {
  const edges = types.flatMap((type) =>
    (type.supersedes ?? []).map((s) => ({
      higher: type.id,
      lower: s.lowerTypeId,
    })),
  );
  const below = new Map(edges.map((e) => [e.higher, e.lower]));
  const hasAbove = new Set(edges.map((e) => e.lower));

  // Walk each chain from its top down; anything ranked has exactly one step.
  const ladders: number[][] = [];
  const seen = new Set<number>();
  for (const type of types) {
    if (hasAbove.has(type.id) || !below.has(type.id)) continue;
    const chain: number[] = [];
    let cursor: number | undefined = type.id;
    while (cursor !== undefined && !seen.has(cursor)) {
      chain.push(cursor);
      seen.add(cursor);
      cursor = below.get(cursor);
    }
    ladders.push(chain);
  }
  const unranked = types.filter((type) => !seen.has(type.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Certification ladders</CardTitle>
        <CardDescription>
          Order a ladder from the highest certification down. Ranking carries
          all the way down, so Paramedic over AEMT over EMT means a Paramedic
          satisfies an EMT requirement — you never pair every certification
          with every other.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {ladders.map((chain) => (
          <CertLadder
            key={chain.join('-')}
            types={types}
            initial={chain}
            title={chain
              .map((id) => types.find((t) => t.id === id)?.abbreviation ?? id)
              .join(' → ')}
          />
        ))}
        <CertLadder types={types} initial={[]} title="New ladder" />
        {unranked.length ? (
          <p className="text-xs text-muted-foreground">
            Not on a ladder: {unranked.map((t) => t.abbreviation).join(', ')}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
