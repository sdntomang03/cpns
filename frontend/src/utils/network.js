import { Network } from '@capacitor/network';

export async function checkConnection() {
  const status = await Network.getStatus();

  return status.connected;
}

export function watchConnection(callback) {
  return Network.addListener('networkStatusChange', (status) => {
    callback(status.connected);
  });
}
