import { Client } from '../domain/models/client';
import { IClientPersistent } from '../infra/database/mongodb/client.model';
import { UniqueEntityID } from '../domain/UniqueEntityID';

export class ClientMapper {
  public static toDomain(raw: IClientPersistent): Client {
    const clientOrError = Client.create(
      {
        userId: raw.userId,
        syncTime: raw.syncTime,
      },
      new UniqueEntityID(raw._id)
    );

    clientOrError.isFailure ? console.log(clientOrError.error) : '';

    return clientOrError.isSuccess ? clientOrError.getValue() : null;
  }

  public static toPersistence(client: Client): IClientPersistent {
    return {
      _id: client.id.toString(),
      userId: client.userId,
      syncTime: client.syncTime,
    };
  }
}
