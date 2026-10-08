import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../../api/authApi';
import useNotification from '../../components/common/useNotification';
import { useAuthStore } from '../../store/authStore';

const initialState = {
  name: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: '',
  institution: '',
  target_position: '',
  province: '',
  city: '',
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { notify } = useNotification();
  const [form, setForm] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await registerUser(form);
      const { user, token } = response.data.data;
      setAuth(user, token);
      navigate('/dashboard');
    } catch (apiError) {
      const validation = apiError.response?.data?.errors;
      const message = validation
        ? Object.values(validation).flat().join(' ')
        : apiError.response?.data?.message || 'Registrasi gagal.';
      notify(message, { title: 'Registrasi gagal', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page d-flex align-items-center justify-content-center px-3 py-4">
      <div className="auth-card card border-0 shadow-lg rounded-4 w-100">
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <div className="app-logo mx-auto mb-3">CP</div>
            <h2 className="fw-bold mb-1">Buat Akun</h2>
            <p className="text-muted mb-0">Daftar untuk memulai latihan CPNS</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Nama lengkap</label>
                <input className="form-control" name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Nomor HP</label>
                <input className="form-control" name="phone" value={form.phone} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Instansi yang dituju</label>
                <input className="form-control" name="institution" value={form.institution} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Jabatan yang dituju</label>
                <input
                  className="form-control"
                  name="target_position"
                  value={form.target_position}
                  onChange={handleChange}
                  placeholder="Contoh: Analis Kebijakan"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Password</label>
                <input className="form-control" type="password" name="password" value={form.password} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Konfirmasi password</label>
                <input className="form-control" type="password" name="password_confirmation" value={form.password_confirmation} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Provinsi</label>
                <input className="form-control" name="province" value={form.province} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Kota / Kabupaten</label>
                <input className="form-control" name="city" value={form.city} onChange={handleChange} required />
              </div>
            </div>

            <button className="btn btn-primary btn-lg w-100 rounded-pill mt-4" disabled={isSubmitting}>
              {isSubmitting ? 'Mendaftar...' : 'Daftar'}
            </button>
          </form>

          <div className="text-center mt-3 text-muted small">
            Sudah punya akun? <Link to="/login" className="fw-semibold text-decoration-none">Masuk</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
