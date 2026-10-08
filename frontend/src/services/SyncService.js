import axios from 'axios';
import api from '../api/axios';
import { getMaterials as fetchMaterials } from '../api/materialApi';
import {
  cacheMaterials,
  getMetadata,
  setMetadata,
} from '../database/repositories/materialRepository';
import { checkConnection } from '../utils/network';

const MATERIAL_SYNC_KEY = 'materials_last_synced_at';
const MATERIALS_API_COUNT_KEY = 'materials_api_count';
const LOCAL_OPERATION_TIMEOUT = 2500;
let activeSync = null;

function withTimeout(promise, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out.`)), LOCAL_OPERATION_TIMEOUT);
    }),
  ]);
}

export function getMaterialsSyncErrorMessage(error) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;

    if (status === 401) {
      return 'Sesi login tidak valid atau sudah berakhir. Silakan keluar lalu login kembali.';
    }

    if (status === 404) {
      return `Alamat layanan materi tidak ditemukan (${api.defaults.baseURL}). Pastikan layanan CPNS berjalan.`;
    }

    if (status) {
      return `Layanan belum dapat mengambil materi (kode ${status}). Materi di perangkat tetap bisa dibaca.`;
    }

    return `Tidak dapat terhubung ke layanan materi ${api.defaults.baseURL}. Periksa internet dan alamat layanan. Materi yang tersimpan tetap bisa dibaca.`;
  }

  return `Materi gagal diperbarui: ${error instanceof Error ? error.message : 'terjadi kesalahan lokal'}. Materi yang tersimpan tetap bisa dibaca.`;
}

async function performMaterialsSync({ forceFullSync = false } = {}) {
  if (!(await checkConnection())) {
    return {
      synced: false,
      reason: 'offline',
      count: 0,
      materials: [],
      cacheAvailable: false,
    };
  }

  let updatedSince = null;

  if (!forceFullSync) {
    try {
      updatedSince = await withTimeout(
        getMetadata(MATERIAL_SYNC_KEY),
        'Membaca metadata sinkronisasi lokal',
      );
    } catch (error) {
      console.warn('Local sync metadata unavailable; using full API sync.', error);
    }
  }

  let page = 1;
  let syncedCount = 0;
  let syncWatermark = null;
  let apiCount = null;
  let cacheAvailable = true;
  let cacheError = null;
  const syncedMaterials = [];

  do {
    const response = await fetchMaterials({
      ...(updatedSince ? { updated_since: updatedSince } : {}),
      page,
      per_page: 100,
    });
    const { data, meta } = response.data;

    if (!Array.isArray(data) || !meta?.server_time) {
      throw new Error('Respons sinkronisasi materi tidak valid.');
    }

    if (syncWatermark === null) {
      syncWatermark = meta.server_time;
      apiCount = meta.published_total;
    }

    if (!Number.isInteger(apiCount) || apiCount < 0) {
      throw new Error('Jumlah materi dari API tidak valid.');
    }

    syncedMaterials.push(...data);
    syncedCount += data.length;

    try {
      await withTimeout(cacheMaterials(data), 'Menyimpan materi ke SQLite lokal');
    } catch (error) {
      cacheAvailable = false;
      cacheError = error;
      console.warn('Could not cache API materials locally.', error);
    }

    page = meta.next_page;
  } while (page);

  if (syncWatermark) {
    try {
      await withTimeout(
        Promise.all([
          setMetadata(MATERIAL_SYNC_KEY, syncWatermark),
          setMetadata(MATERIALS_API_COUNT_KEY, String(apiCount)),
        ]),
        'Menyimpan metadata sinkronisasi',
      );
    } catch (error) {
      cacheAvailable = false;
      cacheError = error;
      console.warn('Could not save material sync metadata locally.', error);
    }
  }

  return {
    synced: true,
    reason: null,
    count: syncedCount,
    apiCount,
    syncedAt: syncWatermark,
    materials: syncedMaterials,
    cacheAvailable,
    cacheError,
  };
}

export function syncMaterials(options = {}) {
  if (!activeSync) {
    activeSync = performMaterialsSync(options).finally(() => {
      activeSync = null;
    });
  }

  return activeSync;
}
