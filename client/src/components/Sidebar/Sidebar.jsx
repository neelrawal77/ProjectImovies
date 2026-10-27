import { NavLink } from 'react-router-dom';
import { FiGrid, FiFilm, FiMapPin, FiClock, FiList } from 'react-icons/fi';

const links = [
  { to: '/admin', label: 'Dashboard', icon: FiGrid, end: true },
  { to: '/admin/movies/new', label: 'Add movie', icon: FiFilm },
  { to: '/admin/theatres/new', label: 'Add theatre', icon: FiMapPin },
  { to: '/admin/shows/new', label: 'Add show', icon: FiClock },
  { to: '/admin/bookings', label: 'Bookings', icon: FiList },
];

export default function Sidebar() {
  return (
    <aside className="im-sidebar" aria-label="Admin navigation">
      <p className="im-sidebar-title">Admin</p>
      <nav>
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="im-side-link">
            <Icon aria-hidden="true" /> {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
