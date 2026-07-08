import { useState, useEffect } from 'react'
import { Button, Card, Form, Row, Col, Alert, Table } from 'react-bootstrap'
import { supabase } from '../services/supabase'
import { useAuth } from '../hooks/useAuth'

export default function Ventas() {
  const [carcasas, setCarcasas] = useState([])
  const [loading, setLoading] = useState(true)
  const [recentSales, setRecentSales] = useState([])
  const [formData, setFormData] = useState({
    carcasa_id: '',
    quantity: 1,
  })
  const [success, setSuccess] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [carcasasRes, salesRes] = await Promise.all([
        supabase.from('carcasas').select('*, iphone_models!inner(*), case_types!inner(*)').eq('is_active', true).gt('current_stock', 0).order('iphone_models.model'),
        supabase.from('sales').select('*, carcasas!inner(*, iphone_models!inner(*), case_types!inner(*))').order('created_at', { ascending: false }).limit(10),
      ])
      setCarcasas(carcasasRes.data || [])
      setRecentSales(salesRes.data || [])
    } catch (err) {
      console.error('Error cargando datos:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const selectedCarcasa = carcasas.find(c => c.id === formData.carcasa_id)
    if (!selectedCarcasa) return

    const quantity = parseInt(formData.quantity)
    if (quantity > selectedCarcasa.current_stock) {
      alert('Stock insuficiente!')
      return
    }

    try {
      await supabase.rpc('record_sale', {
        p_carcasa_id: formData.carcasa_id,
        p_quantity: quantity,
        p_unit_price: selectedCarcasa.sale_price,
        p_user_id: user.id
      })

      setSuccess('Venta registrada exitosamente!')
      setTimeout(() => setSuccess(''), 3000)
      setFormData({ carcasa_id: '', quantity: 1 })
      loadData()
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const selectedCarcasa = carcasas.find(c => c.id === formData.carcasa_id)
  const total = selectedCarcasa ? selectedCarcasa.sale_price * parseInt(formData.quantity) : 0

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
      <h1 className="mb-4">Ventas</h1>

      {success && <Alert variant="success">{success}</Alert>}

      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>Nueva Venta</Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Producto *</Form.Label>
                  <Form.Select
                    required
                    value={formData.carcasa_id}
                    onChange={(e) => setFormData({ ...formData, carcasa_id: e.target.value })}
                  >
                    <option value="">Seleccione...</option>
                    {carcasas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.iphone_models.model} - {c.case_types.name} - {c.color} (Stock: {c.current_stock}, Precio: {formatCurrency(c.sale_price)})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Cantidad *</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max={selectedCarcasa?.current_stock}
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </Form.Group>
                {selectedCarcasa && (
                  <Card className="bg-light mb-3">
                    <Card.Body>
                      <h5>Total: {formatCurrency(total)}</h5>
                    </Card.Body>
                  </Card>
                )}
                <Button variant="success" type="submit">
                  Registrar Venta
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Header>Últimas Ventas</Card.Header>
            <Card.Body>
              {recentSales.length === 0 ? (
                <Alert variant="info">No hay ventas recientes</Alert>
              ) : (
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales.map((sale) => (
                      <tr key={sale.id}>
                        <td>{new Date(sale.created_at).toLocaleString('es-CL')}</td>
                        <td>{sale.carcasas.iphone_models.model} - {sale.carcasas.case_types.name}</td>
                        <td>{sale.quantity}</td>
                        <td>{formatCurrency(sale.total_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
