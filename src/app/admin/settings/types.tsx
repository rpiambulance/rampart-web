import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export type SchedulingKnobs = {
  minAgeYears: number;
  riderSignupOpen: { weekday: number; time: string };
  rotationWeeks: number;
  dayOfUnlockTime: string;
  probationaryRequiresTrainer: boolean;
  dropDeadline: { daysBefore: number; time: string };
};

export type CertType = {
  id: number;
  name: string;
  abbreviation: string;
  issuingOrg: string | null;
  defaultValidityMonths: number | null;
  active?: boolean;
  /** Certifications this one outranks. */
  supersedes?: Array<{ lowerTypeId: number }>;
};

export type EventKind = { id: number; name: string; active?: boolean };

export type Requirement = {
  id: number;
  kind: 'CERTIFICATION' | 'EVALUATION_COUNT' | 'CLASS' | 'CHECKLIST';
  /** Requirements sharing a label are alternatives: any one of them will do. */
  alternativeGroup: string | null;
  count: number | null;
  certificationType: { id: number; name: string } | null;
  evalTemplate: { id: number; name: string } | null;
  class: { id: number; name: string } | null;
};

export type CredentialType = {
  id: number;
  key: string;
  name: string;
  requirements: Requirement[];
  linkedRoles: Array<{ role: { id: number; name: string } }>;
};

export type RoleOption = { id: number; name: string };

export type EvalTemplate = {
  id: number;
  name: string;
  version: number;
  kind?: 'EVALUATION' | 'CHECKLIST';
};

export type TrainingClass = { id: number; name: string };

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const INPUT_CLS =
  'h-8 rounded-md border border-input bg-background px-2 text-sm';


export function NoAccess() {
  return (
    <Card className="mx-auto mt-12 max-w-md">
      <CardHeader>
        <CardTitle>You don&apos;t have access</CardTitle>
        <CardDescription>
          These settings require additional permissions. If you think you
          should have access, contact an officer.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

export function Dash() {
  return <span className="text-muted-foreground">&mdash;</span>;
}

export function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge>Active</Badge>
  ) : (
    <Badge variant="secondary">Retired</Badge>
  );
}
