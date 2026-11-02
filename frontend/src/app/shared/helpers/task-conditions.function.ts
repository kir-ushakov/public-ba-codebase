import { ETaskCondition, ETaskStatus, ETaskType } from '@brainassistant/contracts';

/**
 * Keep in step with backend/src/shared/domain/models/task-conditions.ts.
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

export function taskConditions(task: {
  status: ETaskStatus;
  type: ETaskType;
  conditions?: readonly ETaskCondition[] | undefined;
}): ETaskCondition[] {
  if (task.status === ETaskStatus.Notes) {
    return [];
  }
  return parseTaskConditions(task.conditions) ?? deriveTaskConditions(task.type);
}

export function taskHasTodoCondition(task: {
  status: ETaskStatus;
  type: ETaskType;
  conditions?: readonly ETaskCondition[] | undefined;
}): boolean {
  return taskConditions(task).includes(ETaskCondition.Todo);
}

export function normalizeTaskRecord<
  T extends {
    status: ETaskStatus;
    type: ETaskType;
    conditions?: ETaskCondition[];
  },
>(task: T): T {
  if (task.status === ETaskStatus.Notes) {
    if (task.conditions === undefined) {
      return task;
    }
    const rest = { ...task };
    delete rest.conditions;
    return rest;
  }

  const conditions = parseTaskConditions(task.conditions) ?? deriveTaskConditions(task.type);
  return {
    ...task,
    conditions,
    type: projectTaskType(conditions),
  };
}

function parseTaskConditions(
  raw: readonly ETaskCondition[] | undefined,
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
    parsed.push(item);
  }
  return parsed;
}
