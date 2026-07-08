import { useState, useEffect } from 'react'
import { Card, Table, Form, Row, Col, Alert, Badge } from 'react-bootstrap'
import { supabase } from '../services/supabase'

export default function Movimientos() {
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    movement_type: '',
    start_date: '',
    end_date: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      let query = supabase
        .from('stock_movements')
        .select('*, carcasas!inner(*, iphone_models!inner(*), case_types!inner(*)), profiles!inner(*)')
        .order('created_at', { ascending: false })

      const res = await query
      setMovimientos(res.data || [])
    } catch (err) {
      console.error('Error cargando datos:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredMovimientos = movimientos.filter(m => {
    const matchesType = !filters.movement_type || m.movement_type === filters.movement_type
    const matchesStart = !filters.start_date || new Date(m.created_at) >= new Date(filters.start_date)
    const matchesEnd = !filters.end_date || new Date(m.created_at) <= new Date(filters.end_date + 'T23:59:59')
    return matchesType && matchesStart && matchesEnd
  })

  const getMovementTypeBadge = (type) => {
    const types = {
      entrada: { variant: 'success', label: 'Entrada' },
      venta: { variant: 'danger', label: 'Venta' },
      ajuste: { variant: 'info', label: 'Ajuste' },
      devolucion: { variant: 'warning', label: 'Devolución' },
      dañado: { variant: 'secondary', label: 'Dañado' },
      perdido: { variant: 'dark', label: 'Perdido' },
    }
    const t = types[type] || { variant: 'light', label: type }
    return <Badge bg={t.variant}>{t.label}</Badge>
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount)
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-4">Movimientos de Stock</h1>

      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4} className="mb-2">
              <Form.Select
                value={filters.movement_type}
                onChange={(e) => setFilters({ ...filters, movement_type: e.target.value })}
              >
                <option value="">Todos los tipos</option>
                <option value="entrada">Entrada</option>
                <option value="venta">Venta</option>
                <option value="ajuste">Ajuste</option>
                <option value="devolucion">Devolución</option>
                <option value="dañado">Dañado</option>
                <option value="perdido">Perdido</option>
              </Form.Select>
            </Col>
            <Col md={4} className="mb-2">
              <Form.Control
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              />
            </Col>
            <Col md={4} className="mb-2">
              <Form.Control
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Unitario</th>
                <th>Total</th>
                <th>Usuario</th>
                <th>Observación</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovimientos.map((mov) => (
                <tr key={mov.id}>
                  <td>{new Date(mov.created_at).toLocaleString('es-CL')}</td>
                  <td>{getMovementTypeBadge(mov.movement_type)}</td>
                  <td>{mov.carcasas.iphone_models.model} - {mov.carcasas.case_types.name} - {mov.carcasas.color}</td>
                  <td className={mov.movement_type === 'entrada' || mov.movement_type === 'devolucion' ? 'text-success' : 'text-danger'}>
                    {mov.movement_type === 'entrada' || mov.movement_type === 'devolucion' ? '+' : ''}{mov.quantity}
                  </td>
                  <td>{mov.unit_price ? formatCurrency(mov.unit_price) : '-'}</td>
                  <td>{mov.total_price ? formatCurrency(mov.total_price) : '-'}</td>
                  <td>{mov.profiles.email}</td>
                  <td>{mov.observation || '-'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  )
}
