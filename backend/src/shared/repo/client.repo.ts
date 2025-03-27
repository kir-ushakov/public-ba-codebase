import { Client } from '../domain/models/client.js';
import { IClientPersistent } from '../infra/database/mongodb/client.model.js';
import { IDbModels } from '../infra/database/mongodb/index.js';
import { ClientDocument } from '../infra/database/mongodb/client.model.js';
import { ClientMapper } from '../mappers/client.mapper.js';

export class ClientRepo {
  private _models: IDbModels;

  constructor(models: IDbModels) {
    this._models = models;
  }

  public async create(client: Client): Promise<ClientDocument> {
    const clientData: IClientPersistent = ClientMapper.toPersistence(client);

    const ClientModel = this._models.ClientModel;

    const newClient = await ClientModel.create(clientData);

    return newClient;
  }

  public async find(userId: string, clientId: string): Promise<Client> {
    const clientModel = this._models.ClientModel;
    let clientDocument: ClientDocument;

    clientDocument = await clientModel.findOne({
      userId: userId,
      _id: clientId,
    });
    const found = !!clientDocument === true;
    if (!found)
      throw new Error(
        `Client not found for userId=${userId} and clientId=${clientId}`
      );

    const client: Client = ClientMapper.toDomain(clientDocument);
    return client;
  }

  public async save(client: Client): Promise<ClientDocument> {
    const clientModel = this._models.ClientModel;

    const clientPersistent: IClientPersistent =
      ClientMapper.toPersistence(client);
    const clientId = client.id.toString();

    const filter = { _id: clientId };
    const update = { ...clientPersistent };

    const updatedClient: ClientDocument = await clientModel.findOneAndUpdate(
      filter,
      update,
      { useFindAndModify: false }
    );

    return updatedClient;
  }
}
