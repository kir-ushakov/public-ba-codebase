import { AggregateRoot } from '../AggregateRoot.js';
import { UniqueEntityID } from '../UniqueEntityID.js';

export class DomainEvents {
  private static markedAggregates: AggregateRoot<unknown>[] = [];

  public static markAggregateForDispatch(aggregate: AggregateRoot<unknown>): void {
    const aggregateFound = !!this.findMarkedAggregateByID(aggregate.id);

    if (!aggregateFound) {
      this.markedAggregates.push(aggregate);
    }
  }

  private static findMarkedAggregateByID(id: UniqueEntityID): AggregateRoot<unknown> {
    let found: AggregateRoot<unknown> = null;
    for (const aggregate of this.markedAggregates) {
      if (aggregate.id.equals(id)) {
        found = aggregate;
      }
    }

    return found;
  }
}
