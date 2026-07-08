import { useState, useEffect } from 'react'
import { Button, Card, Form, Row, Col, Table, Alert } from 'react-bootstrap'
import { supabase } from '../services/supabase'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import ExcelJS from 'exceljs'

export default function Reportes() {
  const [carcasas, setCarcasas] = useState([])
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    report_type: 'inventario',
    start_date: '',
    end_date: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [carcasasRes, salesRes] = await Promise.all([
        supabase.from('carcasas').select('*, iphone_models!inner(*), case_types!inner(*)').order('iphone_models.model'),
        supabase.from('sales').select('*, carcasas!inner(*, iphone_models!inner(*), case_types!inner(*))').order('created_at', { ascending: false }),
      ])
      setCarcasas(carcasasRes.data || [])
      setSales(salesRes.data || [])
    } catch (err) {
      console.error('Error cargando datos:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredSales = sales.filter(s => {
    const matchesStart = !filters.start_date || new Date(s.created_at) >= new Date(filters.start_date)
    const matchesEnd = !filters.end_date || new Date(s.created_at) <= new Date(filters.end_date + 'T23:59:59')
    return matchesStart && matchesEnd
  })

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount)
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('Reporte de Inventario', 14, 22)

    if (filters.report_type === 'inventario') {
      const tableData = carcasas.map(c => [
        c.iphone_models.model,
        c.case_types.name,
        c.color,
        c.current_stock,
        formatCurrency(c.purchase_price),
        formatCurrency(c.sale_price),
        formatCurrency(c.current_stock * c.purchase_price),
        c.sku || '-',
        c.is_active ? 'Activo' : 'Inactivo'
      ])

      autoTable(doc, {
        head: [['Modelo', 'Tipo', 'Color', 'Stock', 'Precio Compra', 'Precio Venta', 'Valor Total', 'SKU', 'Estado']],
        body: tableData,
        startY: 30,
      })
    } else if (filters.report_type === 'ventas') {
      const tableData = filteredSales.map(s => [
        new Date(s.created_at).toLocaleDateString('es-CL'),
        s.carcasas.iphone_models.model,
        s.carcasas.case_types.name,
        s.quantity,
        formatCurrency(s.unit_price),
        formatCurrency(s.total_price)
      ])

      autoTable(doc, {
        head: [['Fecha', 'Modelo', 'Tipo', 'Cantidad', 'Precio Unitario', 'Total']],
        body: tableData,
        startY: 30,
      })
    } else if (filters.report_type === 'stock_bajo') {
      const lowStock = carcasas.filter(c => c.current_stock > 0 && c.current_stock <= c.min_stock)
      const tableData = lowStock.map(c => [
        c.iphone_models.model,
        c.case_types.name,
        c.color,
        c.current_stock,
        c.min_stock
      ])

      autoTable(doc, {
        head: [['Modelo', 'Tipo', 'Color', 'Stock Actual', 'Stock Mínimo']],
        body: tableData,
        startY: 30,
      })
    } else if (filters.report_type === 'sin_stock') {
      const noStock = carcasas.filter(c => c.current_stock === 0)
      const tableData = noStock.map(c => [
        c.iphone_models.model,
        c.case_types.name,
        c.color
      ])

      autoTable(doc, {
        head: [['Modelo', 'Tipo', 'Color']],
        body: tableData,
        startY: 30,
      })
    }

    doc.save(`reporte_${filters.report_type}_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Reporte')

    if (filters.report_type === 'inventario') {
      worksheet.columns = [
        { header: 'Modelo', key: 'modelo', width: 25 },
        { header: 'Tipo', key: 'tipo', width: 20 },
        { header: 'Color', key: 'color', width: 15 },
        { header: 'Stock', key: 'stock', width: 10 },
        { header: 'Precio Compra', key: 'precio_compra', width: 15 },
        { header: 'Precio Venta', key: 'precio_venta', width: 15 },
        { header: 'Valor Total', key: 'valor_total', width: 15 },
        { header: 'SKU', key: 'sku', width: 15 },
        { header: 'Estado', key: 'estado', width: 10 },
      ]

      carcasas.forEach(c => {
        worksheet.addRow({
          modelo: c.iphone_models.model,
          tipo: c.case_types.name,
          color: c.color,
          stock: c.current_stock,
          precio_compra: c.purchase_price,
          precio_venta: c.sale_price,
          valor_total: c.current_stock * c.purchase_price,
          sku: c.sku || '-',
          estado: c.is_active ? 'Activo' : 'Inactivo'
        })
      })
    } else if (filters.report_type === 'ventas') {
      worksheet.columns = [
        { header: 'Fecha', key: 'fecha', width: 20 },
        { header: 'Modelo', key: 'modelo', width: 25 },
        { header: 'Tipo', key: 'tipo', width: 20 },
        { header: 'Cantidad', key: 'cantidad', width: 10 },
        { header: 'Precio Unitario', key: 'precio_unitario', width: 18 },
        { header: 'Total', key: 'total', width: 15 },
      ]

      filteredSales.forEach(s => {
        worksheet.addRow({
          fecha: new Date(s.created_at).toLocaleDateString('es-CL'),
          modelo: s.carcasas.iphone_models.model,
          tipo: s.carcasas.case_types.name,
          cantidad: s.quantity,
          precio_unitario: s.unit_price,
          total: s.total_price
        })
      })
    }

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte_${filters.report_type}_${new Date().toISOString().split('T')[0]}.xlsx`
    a.click()
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
      <h1 className="mb-4">Reportes</h1>

      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4} className="mb-2">
              <Form.Select
                value={filters.report_type}
                onChange={(e) => setFilters({ ...filters, report_type: e.target.value })}
              >
                <option value="inventario">Inventario Completo</option>
                <option value="ventas">Ventas por Fecha</option>
                <option value="stock_bajo">Stock Bajo</option>
                <option value="sin_stock">Sin Stock</option>
              </Form.Select>
            </Col>
            {filters.report_type === 'ventas' && (
              <>
                <Col md={3} className="mb-2">
                  <Form.Control
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                  />
                </Col>
                <Col md={3} className="mb-2">
                  <Form.Control
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                  />
                </Col>
              </>
            )}
            <Col md={2} className="d-flex gap-2">
              <Button variant="danger" onClick={exportToPDF}>📄 PDF</Button>
              <Button variant="success" onClick={exportToExcel}>📊 Excel</Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {filters.report_type === 'inventario' && (
        <Card>
          <Card.Header>Inventario Completo</Card.Header>
          <Card.Body>
            <Table striped bordered hover responsive size="sm">
              <thead>
                <tr>
                  <th>Modelo</th>
                  <th>Tipo</th>
                  <th>Color</th>
                  <th>Stock</th>
                  <th>Precio Compra</th>
                  <th>Precio Venta</th>
                  <th>Valor Total</th>
                  <th>SKU</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {carcasas.map(c => (
                  <tr key={c.id} className={!c.is_active ? 'table-secondary' : ''}>
                    <td>{c.iphone_models.model}</td>
                    <td>{c.case_types.name}</td>
                    <td>{c.color}</td>
                    <td className={c.current_stock === 0 ? 'text-danger fw-bold' : c.current_stock <= c.min_stock ? 'text-warning fw-bold' : ''}>
                      {c.current_stock}
                    </td>
                    <td>{formatCurrency(c.purchase_price)}</td>
                    <td>{formatCurrency(c.sale_price)}</td>
                    <td>{formatCurrency(c.current_stock * c.purchase_price)}</td>
                    <td>{c.sku || '-'}</td>
                    <td>{c.is_active ? 'Activo' : 'Inactivo'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {filters.report_type === 'ventas' && (
        <Card>
          <Card.Header>Ventas</Card.Header>
          <Card.Body>
            {filteredSales.length === 0 ? (
              <Alert variant="info">No hay ventas en el período seleccionado</Alert>
            ) : (
              <Table striped bordered hover responsive size="sm">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Modelo</th>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Precio Unitario</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map(s => (
                    <tr key={s.id}>
                      <td>{new Date(s.created_at).toLocaleDateString('es-CL')}</td>
                      <td>{s.carcasas.iphone_models.model}</td>
                      <td>{s.carcasas.case_types.name}</td>
                      <td>{s.quantity}</td>
                      <td>{formatCurrency(s.unit_price)}</td>
                      <td>{formatCurrency(s.total_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      )}

      {filters.report_type === 'stock_bajo' && (
        <Card>
          <Card.Header>Stock Bajo</Card.Header>
          <Card.Body>
            {carcasas.filter(c => c.current_stock > 0 && c.current_stock <= c.min_stock).length === 0 ? (
              <Alert variant="success">No hay productos con stock bajo</Alert>
            ) : (
              <Table striped bordered hover responsive size="sm">
                <thead>
                  <tr>
                    <th>Modelo</th>
                    <th>Tipo</th>
                    <th>Color</th>
                    <th>Stock Actual</th>
                    <th>Stock Mínimo</th>
                  </tr>
                </thead>
                <tbody>
                  {carcasas.filter(c => c.current_stock > 0 && c.current_stock <= c.min_stock).map(c => (
                    <tr key={c.id} className="table-warning">
                      <td>{c.iphone_models.model}</td>
                      <td>{c.case_types.name}</td>
                      <td>{c.color}</td>
                      <td>{c.current_stock}</td>
                      <td>{c.min_stock}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      )}

      {filters.report_type === 'sin_stock' && (
        <Card>
          <Card.Header>Sin Stock</Card.Header>
          <Card.Body>
            {carcasas.filter(c => c.current_stock === 0).length === 0 ? (
              <Alert variant="success">No hay productos sin stock</Alert>
            ) : (
              <Table striped bordered hover responsive size="sm">
                <thead>
                  <tr>
                    <th>Modelo</th>
                    <th>Tipo</th>
                    <th>Color</th>
                  </tr>
                </thead>
                <tbody>
                  {carcasas.filter(c => c.current_stock === 0).map(c => (
                    <tr key={c.id} className="table-danger">
                      <td>{c.iphone_models.model}</td>
                      <td>{c.case_types.name}</td>
                      <td>{c.color}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      )}
    </div>
  )
}
