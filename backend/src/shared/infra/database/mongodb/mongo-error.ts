export enum EMongoErrorCode {
  DuplicateKey = 11000,
}

export function isMongoDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === EMongoErrorCode.DuplicateKey
  );
}
