import { useState, useEffect } from 'react'
import { Button, Card, Form, Row, Col, Alert, Table } from 'react-bootstrap'
import { supabase } from '../services/supabase'
import { useAuth } from '../hooks/useAuth'

export default function Entradas() {
  const [carcasas, setCarcasas] = useState([])
  const [loading, setLoading] = useState(true)
  const [recentEntries, setRecentEntries] = useState([])
  const [formData, setFormData] = useState({
    carcasa_id: '',
    quantity: 1,
    purchase_price: '',
    observation: '',
  })
  const [success, setSuccess] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [carcasasRes, entriesRes] = await Promise.all([
        supabase.from('carcasas').select('*, iphone_models!inner(*), case_types!inner(*)').eq('is_active', true).order('iphone_models.model'),
        supabase.from('stock_movements').select('*, carcasas!inner(*, iphone_models!inner(*), case_types!inner(*))').eq('movement_type', 'entrada').order('created_at', { ascending: false }).limit(10),
      ])
      setCarcasas(carcasasRes.data || [])
      setRecentEntries(entriesRes.data || [])
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
    const unitPrice = parseFloat(formData.purchase_price) || selectedCarcasa.purchase_price
    const totalPrice = quantity * unitPrice

    try {
      await supabase.rpc('add_stock', {
        p_carcasa_id: formData.carcasa_id,
        p_quantity: quantity,
        p_unit_price: unitPrice,
        p_observation: formData.observation,
        p_user_id: user.id
      })

      setSuccess('Entrada registrada exitosamente!')
      setTimeout(() => setSuccess(''), 3000)
      setFormData({ carcasa_id: '', quantity: 1, purchase_price: '', observation: '' })
      loadData()
    } catch (err) {
      alert('Error: ' + err.message)
    }
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
      <h1 className="mb-4">Entradas de Stock</h1>

      {success && <Alert variant="success">{success}</Alert>}

      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>Nueva Entrada</Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Producto *</Form.Label>
                  <Form.Select
                    required
                    value={formData.carcasa_id}
                    onChange={(e) => {
                      const carcasa = carcasas.find(c => c.id === e.target.value)
                      setFormData({ ...formData, carcasa_id: e.target.value, purchase_price: carcasa?.purchase_price || '' })
                    }}
                  >
                    <option value="">Seleccione...</option>
                    {carcasas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.iphone_models.model} - {c.case_types.name} - {c.color} (Stock: {c.current_stock})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Cantidad *</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Precio de Compra (opcional, por unidad)</Form.Label>
                  <Form.Control
                    type="number"
                    step="1"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Observación</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={formData.observation}
                    onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                  />
                </Form.Group>
                <Button variant="primary" type="submit">
                  Registrar Entrada
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Header>Últimas Entradas</Card.Header>
            <Card.Body>
              {recentEntries.length === 0 ? (
                <Alert variant="info">No hay entradas recientes</Alert>
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
                    {recentEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{new Date(entry.created_at).toLocaleString('es-CL')}</td>
                        <td>{entry.carcasas.iphone_models.model} - {entry.carcasas.case_types.name}</td>
                        <td>+{entry.quantity}</td>
                        <td>{formatCurrency(entry.total_price)}</td>
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
