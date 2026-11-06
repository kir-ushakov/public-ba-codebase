import { ETaskCondition, ETaskStatus, ETaskType } from '@brainassistant/contracts';

/**
 * Keep in step with backend/src/shared/domain/models/task-conditions.ts.
 * Contracts cannot hold functions, so each app owns this copy.
 */

const EXTRA_CONDITION_FOR_TYPE: ReadonlyMap<string, ETaskCondition> = new Map([
  [ETaskType.Calendar, ETaskCondition.Calendar],
  [ETaskType.Location, ETaskCondition.Location],
]);

const TYPE_FOR_CONDITION: ReadonlyArray<readonly [ETaskCondition, ETaskType]> = [
  [ETaskCondition.Location, ETaskType.Location],
  [ETaskCondition.Calendar, ETaskType.Calendar],
];

const KNOWN_CONDITIONS: ReadonlySet<string> = new Set(Object.values(ETaskCondition));

export function deriveTaskConditions(type: ETaskType | string): ETaskCondition[] {
  const extra = EXTRA_CONDITION_FOR_TYPE.get(type);
  return extra === undefined ? [ETaskCondition.Todo] : [ETaskCondition.Todo, extra];
}

export function projectTaskType(conditions: readonly ETaskCondition[]): ETaskType {
  for (const [condition, projected] of TYPE_FOR_CONDITION) {
    if (conditions.includes(condition)) {
      return projected;
    }
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
  if (raw === undefined || raw.length === 0) {
    return undefined;
  }
  if (new Set(raw).size !== raw.length) {
    return undefined;
  }
  if (raw.some(item => !KNOWN_CONDITIONS.has(item))) {
    return undefined;
  }
  return [...raw];
}
