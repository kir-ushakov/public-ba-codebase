import { ETaskCondition, ETaskStatus, ETaskType } from '@brainassistant/contracts';

/**
 * Keep in step with frontend/src/app/shared/helpers/task-conditions.function.ts.
 * Contracts cannot hold functions, so each app owns this copy.
 */

const KNOWN_CONDITIONS = new Set<string>(Object.values(ETaskCondition));

export function deriveTaskConditions(type: ETaskType | string): ETaskCondition[] {
  const conditions: ETaskCondition[] = [ETaskCondition.Todo];
  if (type === ETaskType.Calendar) {
    conditions.push(ETaskCondition.Calendar);
  }
  if (type === ETaskType.Location) {
    conditions.push(ETaskCondition.Location);
  }
  return conditions;
}

export function projectTaskType(conditions: readonly ETaskCondition[]): ETaskType {
  if (conditions.includes(ETaskCondition.Location)) {
    return ETaskType.Location;
  }
  if (conditions.includes(ETaskCondition.Calendar)) {
    return ETaskType.Calendar;
  }
  return ETaskType.Basic;
}

/** Undefined when the list is empty, unknown, or contains a duplicate. */
export function parseTaskConditions(
  raw: readonly string[] | undefined,
): ETaskCondition[] | undefined {
  if (!raw || raw.length === 0) {
    return undefined;
  }

  const seen = new Set<string>();
  const parsed: ETaskCondition[] = [];
  for (const item of raw) {
    if (!KNOWN_CONDITIONS.has(item) || seen.has(item)) {
      return undefined;
    }
    seen.add(item);
    parsed.push(item as ETaskCondition);
  }
  return parsed;
}

/** Read path for documents written before `conditions` existed. */
export function storedTaskConditions(
  status: string,
  type: string,
  raw: readonly string[] | undefined,
): ETaskCondition[] | undefined {
  if (status === ETaskStatus.Notes) {
    return undefined;
  }
  return parseTaskConditions(raw) ?? deriveTaskConditions(type);
}
