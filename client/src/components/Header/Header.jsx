import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { FiFilm, FiLogOut } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Header() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.info('You have been logged out');
    navigate('/');
  };

  return (
    <Navbar expand="lg" variant="dark" className="im-header" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to={user ? '/home' : '/'} className="im-brand">
          <FiFilm aria-hidden="true" /> i<span>Movies</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/home">Home</Nav.Link>
            <Nav.Link as={NavLink} to="/movies">Movies</Nav.Link>
            {user && !isAdmin && <Nav.Link as={NavLink} to="/favorites">Favorites</Nav.Link>}
            {user && !isAdmin && <Nav.Link as={NavLink} to="/bookings">My bookings</Nav.Link>}
            {isAdmin && <Nav.Link as={NavLink} to="/admin">Admin</Nav.Link>}
          </Nav>
          <Nav className="align-items-lg-center gap-2">
            {user ? (
              <>
                <span className="im-hello">{user.username}{isAdmin && <em> · admin</em>}</span>
                <Button variant="outline-light" size="sm" onClick={handleLogout}><FiLogOut /> Log out</Button>
              </>
            ) : (
              <>
                <Button as={Link} to="/login" variant="outline-light" size="sm">Log in</Button>
                <Button as={Link} to="/register" variant="danger" size="sm">Sign up</Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
