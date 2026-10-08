import { useEffect, useState } from 'react';
import { logoutUser, updateProfile } from '../../api/authApi';
import useNotification from '../../components/common/useNotification';
import { useAuthStore } from '../../store/authStore';

export default function ProfilePage() {
  const { user, token, setAuth, logout } = useAuthStore();
  const { notify } = useNotification();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.profile?.phone || '',
    institution: user?.profile?.institution || '',
    target_position: user?.profile?.target_position || '',
    province: user?.profile?.province || '',
    city: user?.profile?.city || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const response = await updateProfile(form);
      setAuth(response.data.data, token);
      notify('Profil berhasil diperbarui.', { title: 'Berhasil', type: 'success' });
    } catch (error) {
      console.error('Failed to update profile', error);
      const errors = error.response?.data?.errors;
      notify(errors
        ? Object.values(errors).flat().join(' ')
        : error.response?.data?.message || 'Profil gagal diperbarui. Coba lagi.',
      { title: 'Profil gagal diperbarui', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.warn('Logout API failed, clearing local session anyway.', error);
    } finally {
      logout();
    }
  };

  useEffect(() => {
    if (!showAbout) {
      return undefined;
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        setShowAbout(false);
      }
    }

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [showAbout]);

  return (
    <div className="container py-4 pb-5">
      <div className="page-heading">
        <span className="small text-primary fw-semibold text-uppercase">Akun</span>
        <h3 className="fw-bold mb-0 mt-1">Profil saya</h3>
      </div>
      <div className="card border-0 rounded-4 shadow-sm mb-4">
        <div className="card-body text-center p-4">
          <div className="app-logo rounded-circle mx-auto mb-3" style={{ width: 76, height: 76, fontSize: 28 }}>
            {user?.name?.substring(0, 2).toUpperCase() || 'CP'}
          </div>
          <h4 className="fw-bold mb-1">{user?.name || 'Peserta CPNS'}</h4>
          <div className="text-muted">{user?.email || 'peserta@cpnsnasional.id'}</div>
        </div>
      </div>

      <div className="card border-0 rounded-4 shadow-sm mb-3">
        <div className="card-body">
          <h5 className="fw-bold mb-3">Data pendaftaran CPNS</h5>
          <form onSubmit={handleSave}>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label" htmlFor="profile-name">Nama lengkap</label>
                <input id="profile-name" className="form-control" name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="profile-phone">Nomor HP</label>
                <input id="profile-phone" className="form-control" name="phone" value={form.phone} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="profile-institution">Instansi yang dituju</label>
                <input id="profile-institution" className="form-control" name="institution" value={form.institution} onChange={handleChange} placeholder="Contoh: Kementerian Keuangan" />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="profile-position">Jabatan yang dituju</label>
                <input id="profile-position" className="form-control" name="target_position" value={form.target_position} onChange={handleChange} placeholder="Contoh: Analis Kebijakan" />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="profile-province">Provinsi</label>
                <input id="profile-province" className="form-control" name="province" value={form.province} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="profile-city">Kota / Kabupaten</label>
                <input id="profile-city" className="form-control" name="city" value={form.city} onChange={handleChange} required />
              </div>
            </div>
            <button className="btn btn-primary rounded-pill px-4 mt-3" type="submit" disabled={isSaving}>
              {isSaving ? 'Menyimpan...' : 'Simpan perubahan'}
            </button>
            </form>
        </div>
      </div>

      <div className="d-grid gap-2">
        <button
          className="btn btn-outline-secondary w-100 rounded-pill"
          type="button"
          onClick={() => setShowAbout(true)}
        >
          <i className="bi bi-info-circle me-2" />
          Tentang aplikasi
        </button>
        <button className="btn btn-outline-danger w-100 rounded-pill" type="button" onClick={handleLogout}>
        Keluar
        </button>
      </div>

      {showAbout ? (
        <>
          <div className="modal-backdrop show" onMouseDown={() => setShowAbout(false)} />
          <div
            className="modal d-block"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-app-title"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setShowAbout(false);
              }
            }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 rounded-4 shadow">
                <div className="modal-header border-0">
                  <h5 className="modal-title fw-bold" id="about-app-title">Tentang aplikasi</h5>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Tutup"
                    onClick={() => setShowAbout(false)}
                  />
                </div>
                <div className="modal-body text-center pt-0 pb-4">
                  <div className="app-logo rounded-circle mx-auto mb-3" style={{ width: 64, height: 64, fontSize: 24 }}>
                    <i className="bi bi-mortarboard-fill" aria-hidden="true" />
                  </div>
                  <h4 className="fw-bold mb-2">CPNS Nasional</h4>
                  <p className="text-muted mb-0">
                    Aplikasi persiapan CPNS untuk mempelajari materi, berlatih soal,
                    dan mengukur kesiapan melalui Try Out.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
