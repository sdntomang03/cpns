import { NavLink } from 'react-router-dom';

const menuItems = [
  { to: '/dashboard', label: 'Home', icon: 'bi-house-door' },
  { to: '/materials', label: 'Materi', icon: 'bi-journal-bookmark' },
  { to: '/practice', label: 'Latihan', icon: 'bi-pencil-square' },
  { to: '/tryout', label: 'Try Out', icon: 'bi-check2-square' },
  { to: '/news', label: 'Berita', icon: 'bi-newspaper' },
  { to: '/statistics', label: 'Statistik', icon: 'bi-bar-chart-line' },
  { to: '/profile', label: 'Profil', icon: 'bi-person-circle' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <div className="d-flex justify-content-around align-items-center h-100">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `bottom-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <i className={`bi ${item.icon}`} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
