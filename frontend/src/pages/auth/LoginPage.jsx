import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../../api/authApi';
import useNotification from '../../components/common/useNotification';
import { useAuthStore } from '../../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { notify } = useNotification();
  const [form, setForm] = useState({ email: '', password: '', remember: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await loginUser(form);
      const { user, token } = response.data.data;
      setAuth(user, token);
      navigate('/dashboard');
    } catch (apiError) {
      const message = apiError.response?.data?.message || 'Login gagal. Silakan coba lagi.';
      notify(message, { title: 'Login gagal', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page d-flex align-items-center justify-content-center px-3">
      <div className="auth-card card border-0 shadow-lg rounded-4 w-100">
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <div className="app-logo mx-auto mb-3">CP</div>
            <h2 className="fw-bold mb-1">Selamat Datang</h2>
            <p className="text-muted mb-0">Masuk ke aplikasi CPNS Nasional</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                className="form-control form-control-lg"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                className="form-control form-control-lg"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="d-flex align-items-center justify-content-between mb-4">
              <label className="form-check-label text-muted">
                <input
                  className="form-check-input me-2"
                  type="checkbox"
                  name="remember"
                  checked={form.remember}
                  onChange={handleChange}
                />
                Ingat saya
              </label>
              <Link to="/register" className="text-decoration-none fw-semibold">
                Daftar
              </Link>
            </div>

            <button className="btn btn-primary btn-lg w-100 rounded-pill" disabled={isSubmitting}>
              {isSubmitting ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
