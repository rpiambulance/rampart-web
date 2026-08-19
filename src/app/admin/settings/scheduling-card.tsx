import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  updateDayOfUnlockTime,
  updateDropDeadline,
  updateMinAgeYears,
  updateProbationaryRequiresTrainer,
  updateRiderSignupOpen,
  updateRotationWeeks,
} from './actions';
import { INPUT_CLS as inputCls, WEEKDAYS, type SchedulingKnobs } from './types';

export function SchedulingCard({ knobs }: { knobs: SchedulingKnobs }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scheduling</CardTitle>
        <CardDescription>
          Crew scheduling knobs. Each setting saves independently.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          key={`age-${knobs.minAgeYears}`}
          action={updateMinAgeYears}
          className="flex flex-wrap items-end gap-2"
        >
          <label className="grid gap-1 text-xs text-muted-foreground">
            Minimum rider age (years)
            <input
              type="number"
              name="value"
              required
              min={0}
              defaultValue={knobs.minAgeYears}
              className={`${inputCls} w-24`}
            />
          </label>
          <Button type="submit" size="sm" variant="outline">
            Save
          </Button>
        </form>

        <form
          key={`open-${knobs.riderSignupOpen.weekday}-${knobs.riderSignupOpen.time}`}
          action={updateRiderSignupOpen}
          className="flex flex-wrap items-end gap-2"
        >
          <label className="grid gap-1 text-xs text-muted-foreground">
            Rider signup opens (weekday)
            <select
              name="weekday"
              defaultValue={knobs.riderSignupOpen.weekday}
              className={inputCls}
            >
              {WEEKDAYS.map((day, i) => (
                <option key={day} value={i}>
                  {day}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Time
            <input
              type="time"
              name="time"
              required
              defaultValue={knobs.riderSignupOpen.time}
              className={inputCls}
            />
          </label>
          <Button type="submit" size="sm" variant="outline">
            Save
          </Button>
        </form>

        <form
          key={`rot-${knobs.rotationWeeks}`}
          action={updateRotationWeeks}
          className="flex flex-wrap items-end gap-2"
        >
          <label className="grid gap-1 text-xs text-muted-foreground">
            Rotation length (weeks)
            <input
              type="number"
              name="value"
              required
              min={1}
              defaultValue={knobs.rotationWeeks}
              className={`${inputCls} w-24`}
            />
          </label>
          <Button type="submit" size="sm" variant="outline">
            Save
          </Button>
        </form>

        <form
          key={`unlock-${knobs.dayOfUnlockTime}`}
          action={updateDayOfUnlockTime}
          className="flex flex-wrap items-end gap-2"
        >
          <label className="grid gap-1 text-xs text-muted-foreground">
            Day-of unlock time
            <input
              type="time"
              name="value"
              required
              defaultValue={knobs.dayOfUnlockTime}
              className={inputCls}
            />
          </label>
          <Button type="submit" size="sm" variant="outline">
            Save
          </Button>
        </form>

        <form
          key={`prob-${knobs.probationaryRequiresTrainer}`}
          action={updateProbationaryRequiresTrainer}
          className="flex flex-wrap items-end gap-2"
        >
          <label className="flex items-center gap-2 pb-1 text-sm">
            <input
              type="checkbox"
              name="value"
              defaultChecked={knobs.probationaryRequiresTrainer}
            />
            Probationary members require a trainer on crew
          </label>
          <Button type="submit" size="sm" variant="outline">
            Save
          </Button>
        </form>

        <form
          key={`drop-${knobs.dropDeadline.daysBefore}-${knobs.dropDeadline.time}`}
          action={updateDropDeadline}
          className="flex flex-wrap items-end gap-2"
        >
          <label className="grid gap-1 text-xs text-muted-foreground">
            Drop deadline (days before shift)
            <input
              type="number"
              name="daysBefore"
              required
              min={0}
              defaultValue={knobs.dropDeadline.daysBefore}
              className={`${inputCls} w-24`}
            />
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            Time
            <input
              type="time"
              name="time"
              required
              defaultValue={knobs.dropDeadline.time}
              className={inputCls}
            />
          </label>
          <Button type="submit" size="sm" variant="outline">
            Save
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
