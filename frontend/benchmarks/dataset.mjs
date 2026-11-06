/**
 * Deterministic task/tag fixture for the benchmark only.
 * Ids are stable (`task-00001`), not uuid, so two runs with the same seed match.
 * Shapes follow Task and Tag. Home has no Notes status in this set: the product
 * distribution asked for To do, Active, Done and Cancelled.
 */
export const BENCH_SEED = 20261031;
export const BENCH_USER_ID = 'bench-user';

const SENTENCE = 'Buy milk and write the note. ';

export function generateDataset(count, seed = BENCH_SEED) {
  const rng = createRng(seed);
  const buckets = statusBuckets(count);
  const tags = Array.from({ length: 20 }, (_, index) => tagAt(index));
  const tasks = [];
  let cursor = 0;

  for (const bucket of buckets) {
    for (let index = 0; index < bucket.count; index += 1) {
      tasks.push(taskAt(cursor, bucket.status, tags, rng));
      cursor += 1;
    }
  }

  const jsonBytes = new TextEncoder().encode(JSON.stringify({ tasks, tags })).length;
  return {
    seed,
    userId: BENCH_USER_ID,
    tasks,
    tags,
    jsonBytes,
    counts: Object.fromEntries(buckets.map(bucket => [bucket.status, bucket.count])),
  };
}

function statusBuckets(total) {
  const todo = Math.round(total * 0.5);
  const active = Math.round(total * 0.2);
  const done = Math.round(total * 0.25);
  const cancel = total - todo - active - done;
  return [
    { status: 'TASK_STATUS_TODO', count: todo },
    { status: 'TASK_STATUS_ACTIVE', count: active },
    { status: 'TASK_STATUS_DONE', count: done },
    { status: 'TASK_STATUS_CANCEL', count: cancel },
  ];
}

function tagAt(index) {
  const number = String(index + 1).padStart(2, '0');
  const createdAt = new Date(Date.UTC(2024, 0, index + 1)).toISOString();
  return {
    id: `tag-${number}`,
    userId: BENCH_USER_ID,
    name: `Tag ${number}`,
    color: '#00a991',
    createdAt,
    modifiedAt: createdAt,
  };
}

function taskAt(index, status, tags, rng) {
  const createdMs = Date.UTC(2023, 0, 1) + Math.floor(rng() * 400) * 86_400_000;
  const modifiedMs = createdMs + Math.floor(rng() * 30) * 86_400_000;
  const createdAt = new Date(createdMs).toISOString();
  const modifiedAt = new Date(modifiedMs).toISOString();
  const typeRoll = rng();
  const type =
    typeRoll < 0.1 ? 'TASK_TYPE_LOCATION' : typeRoll < 0.2 ? 'TASK_TYPE_CALENDAR' : 'TASK_TYPE_BASIC';
  const task = {
    id: `task-${String(index + 1).padStart(5, '0')}`,
    userId: BENCH_USER_ID,
    type,
    title: `Task ${index + 1}`,
    status,
    createdAt,
    modifiedAt,
  };

  if (rng() < 0.6) {
    const tagCount = 1 + Math.floor(rng() * 4);
    const chosen = new Set();
    while (chosen.size < tagCount) {
      chosen.add(tags[Math.floor(rng() * tags.length)].id);
    }
    task.tagIds = [...chosen];
  }

  const descriptionRoll = rng();
  if (descriptionRoll < 0.3) {
    task.description = doc(textOfLength(40 + Math.floor(rng() * 41)));
  } else if (descriptionRoll < 0.8) {
    task.description = doc(textOfLength(500 + Math.floor(rng() * 1501)));
  } else {
    task.description = doc(textOfLength(5000 + Math.floor(rng() * 5001)));
  }

  if (rng() < 0.1) {
    const imageId = `img-${task.id}`;
    task.imageId = imageId;
    task.images = [imageId];
  }

  return task;
}

function textOfLength(length) {
  let text = '';
  while (text.length < length) {
    text += SENTENCE;
  }
  return text.slice(0, length);
}

function doc(text) {
  const paragraphs = [];
  for (let offset = 0; offset < text.length; offset += 500) {
    paragraphs.push({
      type: 'paragraph',
      content: [{ type: 'text', text: text.slice(offset, offset + 500) }],
    });
  }
  return { type: 'doc', content: paragraphs };
}

function createRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
