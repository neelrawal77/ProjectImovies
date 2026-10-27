import { Outlet } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Sidebar from './Sidebar.jsx';

export default function AdminLayout() {
  return (
    <Container className="py-4">
      <div className="im-admin-grid">
        <Sidebar />
        <section className="im-admin-main"><Outlet /></section>
      </div>
    </Container>
  );
}
