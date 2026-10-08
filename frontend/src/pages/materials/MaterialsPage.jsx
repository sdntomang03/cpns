import { useCallback, useEffect, useState } from 'react';
import MathContent from '../../components/common/MathContent';
import useNotification from '../../components/common/useNotification';
import { getMaterials } from '../../database/repositories/materialRepository';
import {
  getMaterialsSyncErrorMessage,
  syncMaterials,
} from '../../services/SyncService';
import { checkConnection, watchConnection } from '../../utils/network';

const LOCAL_READ_TIMEOUT = 2000;

function readLocalMaterials(category) {
  return Promise.race([
    getMaterials(category || undefined),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('SQLite local read timed out.')), LOCAL_READ_TIMEOUT);
    }),
  ]);
}

const categoryOptions = [
  { slug: '', label: 'Semua' },
  { slug: 'twk', label: 'TWK' },
  { slug: 'tiu', label: 'TIU' },
  { slug: 'tkp', label: 'TKP' },
];

export default function MaterialsPage() {
  const { notify } = useNotification();
  const [materials, setMaterials] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [localCacheAvailable, setLocalCacheAvailable] = useState(true);

  const loadMaterials = useCallback(async () => {
    const cachedMaterials = await readLocalMaterials(selectedCategory);
    setMaterials(cachedMaterials);
  }, [selectedCategory]);

  const syncAndRefresh = useCallback(async ({ showResult = false } = {}) => {
    setIsLoading(true);

    try {
      const connected = await checkConnection();
      setIsOnline(connected);

      if (connected) {
        setIsSyncing(true);
        let forceFullSync = false;

        try {
          const cachedMaterials = await readLocalMaterials(selectedCategory);
          setMaterials(cachedMaterials);
        } catch (error) {
          forceFullSync = true;
          setLocalCacheAvailable(false);
          console.warn('Local material cache could not be opened.', error);
        }

        const result = await syncMaterials({ forceFullSync });

        if (result.synced) {
          setMaterials((currentMaterials) =>
            mergeMaterials(
              currentMaterials,
              selectedCategory
                ? result.materials.filter((material) => material.category === selectedCategory)
                : result.materials,
            ),
          );

          if (!result.cacheAvailable) {
            setLocalCacheAvailable(false);
            if (showResult) {
              notify('Materi berhasil diambil, tetapi belum dapat disimpan di perangkat.', {
                title: 'Materi belum tersimpan',
                type: 'warning',
              });
            }
          } else {
            setLocalCacheAvailable(true);
            if (showResult) {
              notify(
                result.count > 0
                  ? `${result.count} materi baru tersimpan di perangkat dan siap dibaca tanpa internet.`
                  : 'Materi di perangkat sudah terbaru.',
                { title: 'Materi diperbarui', type: 'success' },
              );
            }
            await loadMaterials();
          }
        } else if (showResult) {
          notify('Materi yang tersimpan di perangkat tetap bisa dibaca.', {
            title: 'Tidak ada koneksi',
            type: 'warning',
          });
        }
      } else {
        await loadMaterials();
        if (showResult) {
          notify('Materi yang tersimpan di perangkat tetap bisa dibaca.', {
            title: 'Tidak ada koneksi',
            type: 'warning',
          });
        }
      }
    } catch (error) {
      console.error('Failed to load or sync materials', error);
      if (showResult) {
        notify(getMaterialsSyncErrorMessage(error), { title: 'Gagal memperbarui materi', type: 'error' });
      }
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, [loadMaterials, notify, selectedCategory]);

  useEffect(() => {
    let active = true;
    let networkListener;
    const initialSyncTimer = window.setTimeout(() => {
      syncAndRefresh();
    }, 0);

    watchConnection((connected) => {
      if (!active) {
        return;
      }

      setIsOnline(connected);
      if (connected) {
        syncAndRefresh();
      }
    })
      .then((listener) => {
        networkListener = listener;
      })
      .catch((error) => {
        console.error('Failed to observe network status', error);
      });

    return () => {
      active = false;
      window.clearTimeout(initialSyncTimer);
      networkListener?.remove();
    };
  }, [syncAndRefresh]);

  if (selectedMaterial) {
    return (
      <div className="container py-4 pb-5">
        <button
          className="btn btn-link p-0 mb-3 text-decoration-none"
          type="button"
          onClick={() => setSelectedMaterial(null)}
        >
          <i className="bi bi-arrow-left me-1" />
          Kembali ke daftar materi
        </button>
        <div className="card border-0 rounded-4 shadow-sm">
          <div className="card-body p-4 p-md-5">
            <div className="small text-primary fw-semibold mb-1">
              {selectedMaterial.category_name}
            </div>
            <h3 className="fw-bold mb-4">{selectedMaterial.title}</h3>
            <MathContent content={selectedMaterial.content} className="material-content" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4 pb-5">
      <div className="page-heading d-flex justify-content-between align-items-center mb-3">
        <div>
          <span className="small text-primary fw-semibold text-uppercase">Pusat belajar</span>
          <h3 className="fw-bold mb-1 mt-1">Materi</h3>
        </div>
        <button
          className="btn btn-outline-primary btn-sm rounded-pill"
          type="button"
          onClick={() => syncAndRefresh({ showResult: true })}
          disabled={!isOnline || isSyncing}
        >
          <i className="bi bi-arrow-repeat me-1" />
          {isSyncing ? 'Memperbarui...' : 'Perbarui'}
        </button>
      </div>

      <div className="d-flex flex-wrap gap-2 mb-3">
        {categoryOptions.map((category) => (
          <button
            key={category.slug || 'all'}
            type="button"
            className={`btn btn-sm rounded-pill ${
              selectedCategory === category.slug ? 'btn-primary' : 'btn-light border'
            }`}
            onClick={() => setSelectedCategory(category.slug)}
          >
            {category.label}
          </button>
        ))}
      </div>

      {isLoading && materials.length === 0 ? (
        <div className="card border-0 rounded-4 shadow-sm">
          <div className="card-body placeholder-glow">
            <span className="placeholder col-5 mb-3" />
            <span className="placeholder col-9" />
          </div>
        </div>
      ) : null}

      {!isLoading && materials.length === 0 ? (
        <div className="card border-0 rounded-4 shadow-sm">
          <div className="card-body text-center py-5">
            <i className="bi bi-journal-x fs-1 text-muted" />
            <h5 className="fw-bold mt-3">Belum ada materi tersimpan</h5>
            <p className="text-muted mb-0">Hubungkan ke internet lalu sinkronkan materi.</p>
          </div>
        </div>
      ) : null}

      <div className="row g-3">
        {materials.map((material) => (
          <div className="col-12 col-md-6" key={material.id}>
            <button
              className="card border-0 rounded-4 shadow-sm h-100 w-100 text-start"
              type="button"
              onClick={() => setSelectedMaterial(material)}
            >
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="badge bg-primary-subtle text-primary">
                    {material.category_name || material.category.toUpperCase()}
                  </span>
                  {localCacheAvailable ? (
                    <i
                      className="bi bi-phone text-success"
                      title="Tersimpan di perangkat"
                      aria-label="Tersimpan di perangkat"
                    />
                  ) : null}
                </div>
                <h5 className="fw-bold mb-1">{material.title}</h5>
              </div>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function mergeMaterials(currentMaterials, apiMaterials) {
  const materialsById = new Map(currentMaterials.map((material) => [material.id, material]));

  for (const material of apiMaterials) {
    if (material.deleted_at || !material.is_published) {
      materialsById.delete(material.id);
    } else {
      materialsById.set(material.id, material);
    }
  }

  return [...materialsById.values()].sort(
    (left, right) =>
      left.category.localeCompare(right.category) ||
      (left.order ?? left.sort_order ?? 0) - (right.order ?? right.sort_order ?? 0) ||
      left.title.localeCompare(right.title),
  );
}
