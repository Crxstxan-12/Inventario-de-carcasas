import { useState, useEffect } from 'react'
import { Card, Row, Col, Table, Alert } from 'react-bootstrap'
import { supabase } from '../services/supabase'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStock: 0,
    totalCost: 0,
    totalSalesValue: 0,
    estimatedProfit: 0,
  })
  const [lowStock, setLowStock] = useState([])
  const [noStock, setNoStock] = useState([])
  const [recentSales, setRecentSales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [carcasasRes, salesRes] = await Promise.all([
        supabase.from('carcasas').select('*, iphone_models!inner(*), case_types!inner(*)').eq('is_active', true),
        supabase.from('sales').select('*, carcasas!inner(*, iphone_models!inner(*), case_types!inner(*))').order('created_at', { ascending: false }).limit(10),
      ])

      const carcasas = carcasasRes.data || []

      const totalStock = carcasas.reduce((sum, c) => sum + c.current_stock, 0)
      const totalCost = carcasas.reduce((sum, c) => sum + (c.current_stock * c.purchase_price), 0)
      const totalSalesValue = carcasas.reduce((sum, c) => sum + (c.current_stock * c.sale_price), 0)
      const estimatedProfit = totalSalesValue - totalCost

      setStats({ totalStock, totalCost, totalSalesValue, estimatedProfit })
      setLowStock(carcasas.filter(c => c.current_stock > 0 && c.current_stock <= c.min_stock))
      setNoStock(carcasas.filter(c => c.current_stock === 0))
      setRecentSales(salesRes.data || [])
    } catch (err) {
      console.error('Error cargando datos:', err)
    } finally {
      setLoading(false)
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
      <h1 className="mb-4">Dashboard</h1>

      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="card-stat bg-primary text-white">
            <Card.Body>
              <Card.Title>Total Carcasas</Card.Title>
              <Card.Text className="display-4">{stats.totalStock}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="card-stat bg-success text-white">
            <Card.Body>
              <Card.Title>Valor Inventario (Costo)</Card.Title>
              <Card.Text className="display-4">{formatCurrency(stats.totalCost)}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="card-stat bg-info text-white">
            <Card.Body>
              <Card.Title>Valor Venta Posible</Card.Title>
              <Card.Text className="display-4">{formatCurrency(stats.totalSalesValue)}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-3">
          <Card className="card-stat bg-warning text-white">
            <Card.Body>
              <Card.Title>Ganancia Estimada</Card.Title>
              <Card.Text className="display-4">{formatCurrency(stats.estimatedProfit)}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header>⚠️ Stock Bajo</Card.Header>
            <Card.Body>
              {lowStock.length === 0 ? (
                <Alert variant="success">No hay productos con stock bajo</Alert>
              ) : (
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Modelo</th>
                      <th>Tipo</th>
                      <th>Stock</th>
                      <th>Mínimo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.map((item) => (
                      <tr key={item.id} className="table-warning">
                        <td>{item.iphone_models.model}</td>
                        <td>{item.case_types.name}</td>
                        <td>{item.current_stock}</td>
                        <td>{item.min_stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} className="mb-4">
          <Card>
            <Card.Header>❌ Sin Stock</Card.Header>
            <Card.Body>
              {noStock.length === 0 ? (
                <Alert variant="success">No hay productos sin stock</Alert>
              ) : (
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Modelo</th>
                      <th>Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {noStock.map((item) => (
                      <tr key={item.id} className="table-danger">
                        <td>{item.iphone_models.model}</td>
                        <td>{item.case_types.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card>
        <Card.Header>💰 Últimas Ventas</Card.Header>
        <Card.Body>
          {recentSales.length === 0 ? (
            <Alert variant="info">No hay ventas registradas</Alert>
          ) : (
            <Table striped bordered hover>
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
    </div>
  )
}
