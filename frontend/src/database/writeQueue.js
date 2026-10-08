let writeQueue = Promise.resolve();

export function serializeDatabaseWrite(operation) {
  const result = writeQueue.then(operation, operation);
  writeQueue = result.catch(() => {});

  return result;
}
