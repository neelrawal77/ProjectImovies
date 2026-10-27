
import {
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';

import { useEffect } from 'react';

import Header from './components/Header/Header.jsx';
import Footer from './components/Footer/Footer.jsx';
import AdminLayout from './components/Sidebar/AdminLayout.jsx';

import ProtectedRoute from './components/protection/ProtectedRoute.jsx';
import AdminRoute from './components/protection/AdminRoute.jsx';

import Landing from './pages/landing/Landing.jsx';
import Login from './pages/login/Login.jsx';
import Register from './pages/register/Register.jsx';
import Home from './pages/home/Home.jsx';
import Movies from './pages/movies/Movies.jsx';
import MovieDetails from './pages/movieDetails/MovieDetails.jsx';
import MovieShows from './pages/movieShows/MovieShows.jsx';
import Favorites from './pages/favorites/Favorites.jsx';
import Bookings from './pages/bookings/Bookings.jsx';

import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AddMovie from './pages/addMovie/AddMovie.jsx';
import AddTheatre from './pages/addTheatre/AddTheatre.jsx';
import AddShow from './pages/addShow/AddShow.jsx';
import AdminBookings from './pages/adminBookings/AdminBookings.jsx';

// Common layout for public and user pages
function Shell() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="im-shell">
      <Header />

      <main className="im-main">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

// Fallback page for unknown URLs
function NotFound() {
  return (
    <div className="im-state my-5">
      <h2>Page not found</h2>
      <p>The page you are looking for does not exist.</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        {/* Public pages */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/movies" element={<Movies />} />
        <Route
          path="/movies/:id"
          element={<MovieDetails />}
        />

        {/* Pages requiring user authentication */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/movies/:movieId/shows"
            element={<MovieShows />}
          />

          <Route
            path="/favorites"
            element={<Favorites />}
          />

          <Route
            path="/bookings"
            element={<Bookings />}
          />
        </Route>

        {/* Admin-only pages */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route
              path="/admin"
              element={<AdminDashboard />}
            />

            <Route
              path="/admin/movies/new"
              element={<AddMovie />}
            />

            <Route
              path="/admin/movies/:id/edit"
              element={<AddMovie />}
            />

            <Route
              path="/admin/theatres/new"
              element={<AddTheatre />}
            />

            <Route
              path="/admin/theatres/:id/edit"
              element={<AddTheatre />}
            />

            <Route
              path="/admin/shows/new"
              element={<AddShow />}
            />

            <Route
              path="/admin/shows/:id/edit"
              element={<AddShow />}
            />

            <Route
              path="/admin/bookings"
              element={<AdminBookings />}
            />
          </Route>
        </Route>

        {/* Legacy URL redirect */}
        <Route
          path="/index.html"
          element={<Navigate to="/" replace />}
        />

        {/* Unknown routes */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}