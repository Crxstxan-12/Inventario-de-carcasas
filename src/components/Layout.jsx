import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Navbar, Nav, Container, Button, Dropdown } from 'react-bootstrap'
import { useAuth } from '../hooks/useAuth'

export default function Layout() {
  const { user, profile, signOut, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (err) {
      console.error('Error al cerrar sesión:', err)
    }
  }

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/inventario', label: 'Inventario', icon: '📦' },
    { path: '/entradas', label: 'Entradas', icon: '➕' },
    { path: '/ventas', label: 'Ventas', icon: '💰' },
    { path: '/movimientos', label: 'Movimientos', icon: '📋' },
    { path: '/reportes', label: 'Reportes', icon: '📄' },
  ]

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
        <Container fluid>
          <Navbar.Brand href="/dashboard">
            📱 Inventario Carcasas
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              {menuItems.map((item) => (
                <Nav.Link
                  key={item.path}
                  href={item.path}
                  active={location.pathname === item.path}
                >
                  {item.icon} {item.label}
                </Nav.Link>
              ))}
            </Nav>
            <Nav className="align-items-center">
              <Dropdown align="end">
                <Dropdown.Toggle variant="secondary" id="dropdown-basic">
                  {user?.email}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.ItemText className="text-muted small">
                    Rol: {profile?.role}
                  </Dropdown.ItemText>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleSignOut}>
                    Cerrar Sesión
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main className="flex-grow-1 p-4">
        <Outlet />
      </main>
    </div>
  )
}
