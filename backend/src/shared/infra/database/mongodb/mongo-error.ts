export enum EMongoErrorCode {
  NamespaceExists = 48,
  DuplicateKey = 11000,
}

export function isMongoDuplicateKeyError(error: unknown): boolean {
  return mongoErrorCode(error) === EMongoErrorCode.DuplicateKey;
}

export function isMongoNamespaceExistsError(error: unknown): boolean {
  return mongoErrorCode(error) === EMongoErrorCode.NamespaceExists;
}

function mongoErrorCode(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return undefined;
  }
  return typeof error.code === 'number' ? error.code : undefined;
}
