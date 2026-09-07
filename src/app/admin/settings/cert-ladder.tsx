'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { saveCertificationLadder } from './actions';

export type LadderType = { id: number; name: string; abbreviation: string };

const SELECT =
  'h-8 rounded-md border border-input bg-background px-2 text-sm';

/**
 * Builds one ladder: an ordered chain from the highest certification down to
 * the lowest. Only certifications not already on this ladder are offered, and
 * the ranking is stored as the neighboring steps — the rest follows, so a
 * Paramedic satisfies an EMT requirement without anyone linking those two.
 */
export function CertLadder({
  types,
  initial,
  title,
}: {
  types: LadderType[];
  /** Existing rungs, highest first. Empty for a new ladder. */
  initial: number[];
  title: string;
}) {
  const [rungs, setRungs] = useState<number[]>(initial);
  const [picked, setPicked] = useState('');

  const byId = new Map(types.map((type) => [type.id, type]));
  const available = types.filter((type) => !rungs.includes(type.id));

  const move = (index: number, by: -1 | 1) => {
    const target = index + by;
    if (target < 0 || target >= rungs.length) return;
    const next = [...rungs];
    [next[index], next[target]] = [next[target], next[index]];
    setRungs(next);
  };

  return (
    <form
      action={saveCertificationLadder}
      className="space-y-3 rounded-md border p-3"
    >
      {rungs.map((id) => (
        <input key={id} type="hidden" name="typeIds" value={id} />
      ))}
      <p className="text-sm font-medium">{title}</p>

      {rungs.length ? (
        <ol className="space-y-1">
          {rungs.map((id, index) => (
            <li key={id} className="flex items-center gap-2 text-sm">
              <span className="w-6 text-xs text-muted-foreground">
                {index === 0 ? 'top' : index === rungs.length - 1 ? 'base' : ''}
              </span>
              <span className="font-medium">{byId.get(id)?.abbreviation}</span>
              <span className="text-muted-foreground">
                {byId.get(id)?.name}
              </span>
              <span className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Move up"
                  className="h-6 rounded border px-2 text-xs disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === rungs.length - 1}
                  aria-label="Move down"
                  className="h-6 rounded border px-2 text-xs disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => setRungs(rungs.filter((r) => r !== id))}
                  className="h-6 rounded border px-2 text-xs text-destructive"
                >
                  remove
                </button>
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">
          No rungs yet — add the highest certification first.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={picked}
          onChange={(event) => setPicked(event.target.value)}
          className={SELECT}
          aria-label="Certification to add"
        >
          <option value="">Add a rung…</option>
          {available.map((type) => (
            <option key={type.id} value={type.id}>
              {type.abbreviation} — {type.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!picked}
          onClick={() => {
            setRungs([...rungs, Number(picked)]);
            setPicked('');
          }}
          className="h-8 rounded-md border px-3 text-sm hover:bg-muted disabled:opacity-40"
        >
          Add to bottom
        </button>

        <Button
          type="submit"
          size="sm"
          disabled={rungs.length < 2}
          className="ml-auto"
        >
          Save ladder
        </Button>
        {initial.length ? (
          <Button
            type="submit"
            name="unlink"
            value="true"
            size="sm"
            variant="outline"
            className="text-destructive"
          >
            Break ladder
          </Button>
        ) : null}
      </div>
    </form>
  );
}
