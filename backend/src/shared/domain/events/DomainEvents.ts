import { AggregateRoot } from "../AggregateRoot";
import { UniqueEntityID } from "../UniqueEntityID";

export class DomainEvents {
  private static markedAggregates: AggregateRoot<any>[] = [];
  
  public static markAggregateForDispatch (aggregate: AggregateRoot<any>): void {
    
    const aggregateFound = !!this.findMarkedAggregateByID(aggregate.id);

    if (!aggregateFound) {
      this.markedAggregates.push(aggregate);
    }
  }

  private static findMarkedAggregateByID (id: UniqueEntityID): AggregateRoot<any> {
    let found: AggregateRoot<any> = null;
    for (let aggregate of this.markedAggregates) {
      if (aggregate.id.equals(id)) {
        found = aggregate;
      }
    }

    return found;
  }
}
