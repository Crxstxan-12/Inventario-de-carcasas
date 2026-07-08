import { useState, useEffect } from 'react'
import { Button, Card, Table, Form, Modal, Alert, Row, Col } from 'react-bootstrap'
import { supabase, IPHONE_MODELS, CASE_TYPES } from '../services/supabase'
import { useAuth } from '../hooks/useAuth'

export default function Inventario() {
  const [carcasas, setCarcasas] = useState([])
  const [iphoneModels, setIphoneModels] = useState([])
  const [caseTypes, setCaseTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCarcasa, setEditingCarcasa] = useState(null)
  const [formData, setFormData] = useState({
    iphone_model_id: '',
    case_type_id: '',
    color: '',
    material: '',
    purchase_price: '',
    sale_price: '',
    current_stock: 0,
    min_stock: 5,
    sku: '',
  })
  const [filters, setFilters] = useState({
    search: '',
    family: '',
    caseType: '',
    lowStock: false,
    noStock: false,
  })
  const { isAdmin } = useAuth()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [carcasasRes, modelsRes, typesRes] = await Promise.all([
        supabase.from('carcasas').select('*, iphone_models!inner(*), case_types!inner(*)').order('created_at', { ascending: false }),
        supabase.from('iphone_models').select('*').order('family, model'),
        supabase.from('case_types').select('*').order('name'),
      ])
      setCarcasas(carcasasRes.data || [])
      setIphoneModels(modelsRes.data || [])
      setCaseTypes(typesRes.data || [])
    } catch (err) {
      console.error('Error cargando datos:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const selectedModel = iphoneModels.find(m => m.id === parseInt(formData.iphone_model_id))
      const data = {
        ...formData,
        iphone_family: selectedModel.family,
        purchase_price: parseFloat(formData.purchase_price),
        sale_price: parseFloat(formData.sale_price),
        current_stock: parseInt(formData.current_stock),
        min_stock: parseInt(formData.min_stock),
      }

      if (editingCarcasa) {
        await supabase.from('carcasas').update(data).eq('id', editingCarcasa.id)
      } else {
        await supabase.from('carcasas').insert(data)
      }

      setShowModal(false)
      setEditingCarcasa(null)
      resetForm()
      loadData()
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const handleEdit = (carcasa) => {
    setEditingCarcasa(carcasa)
    setFormData({
      iphone_model_id: carcasa.iphone_model_id,
      case_type_id: carcasa.case_type_id,
      color: carcasa.color,
      material: carcasa.material || '',
      purchase_price: carcasa.purchase_price,
      sale_price: carcasa.sale_price,
      current_stock: carcasa.current_stock,
      min_stock: carcasa.min_stock,
      sku: carcasa.sku || '',
    })
    setShowModal(true)
  }

  const handleToggleActive = async (carcasa) => {
    if (!confirm(`¿${carcasa.is_active ? 'Desactivar' : 'Activar'} esta carcasa?`)) return
    await supabase.from('carcasas').update({ is_active: !carcasa.is_active }).eq('id', carcasa.id)
    loadData()
  }

  const resetForm = () => {
    setFormData({
      iphone_model_id: '',
      case_type_id: '',
      color: '',
      material: '',
      purchase_price: '',
      sale_price: '',
      current_stock: 0,
      min_stock: 5,
      sku: '',
    })
  }

  const filteredCarcasas = carcasas.filter(carcasa => {
    const matchesSearch = !filters.search || 
      carcasa.iphone_models.model.toLowerCase().includes(filters.search.toLowerCase()) ||
      carcasa.case_types.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      carcasa.color.toLowerCase().includes(filters.search.toLowerCase()) ||
      (carcasa.sku && carcasa.sku.toLowerCase().includes(filters.search.toLowerCase()))
    const matchesFamily = !filters.family || carcasa.iphone_family === filters.family
    const matchesCaseType = !filters.caseType || carcasa.case_types.name === filters.caseType
    const matchesLowStock = !filters.lowStock || (carcasa.current_stock > 0 && carcasa.current_stock <= carcasa.min_stock)
    const matchesNoStock = !filters.noStock || carcasa.current_stock === 0
    return matchesSearch && matchesFamily && matchesCaseType && matchesLowStock && matchesNoStock
  })

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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Inventario</h1>
        {isAdmin && (
          <Button variant="primary" onClick={() => { resetForm(); setEditingCarcasa(null); setShowModal(true); }}>
            ➕ Nueva Carcasa
          </Button>
        )}
      </div>

      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={3} className="mb-2">
              <Form.Control
                placeholder="Buscar por modelo, tipo, color o SKU..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </Col>
            <Col md={2} className="mb-2">
              <Form.Select
                value={filters.family}
                onChange={(e) => setFilters({ ...filters, family: e.target.value })}
              >
                <option value="">Todas las familias</option>
                {Object.keys(IPHONE_MODELS).map(family => (
                  <option key={family} value={family}>{family}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2} className="mb-2">
              <Form.Select
                value={filters.caseType}
                onChange={(e) => setFilters({ ...filters, caseType: e.target.value })}
              >
                <option value="">Todos los tipos</option>
                {CASE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2} className="mb-2">
              <Form.Check
                type="checkbox"
                label="Stock Bajo"
                checked={filters.lowStock}
                onChange={(e) => setFilters({ ...filters, lowStock: e.target.checked })}
              />
            </Col>
            <Col md={2} className="mb-2">
              <Form.Check
                type="checkbox"
                label="Sin Stock"
                checked={filters.noStock}
                onChange={(e) => setFilters({ ...filters, noStock: e.target.checked })}
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
                <th>Modelo</th>
                <th>Tipo</th>
                <th>Color</th>
                <th>Stock</th>
                <th>Precio Compra</th>
                <th>Precio Venta</th>
                <th>SKU</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCarcasas.map((carcasa) => (
                <tr key={carcasa.id} className={!carcasa.is_active ? 'table-secondary' : ''}>
                  <td>{carcasa.iphone_models.model}</td>
                  <td>{carcasa.case_types.name}</td>
                  <td>{carcasa.color}</td>
                  <td className={carcasa.current_stock === 0 ? 'text-danger fw-bold' : carcasa.current_stock <= carcasa.min_stock ? 'text-warning fw-bold' : ''}>
                    {carcasa.current_stock}
                  </td>
                  <td>{formatCurrency(carcasa.purchase_price)}</td>
                  <td>{formatCurrency(carcasa.sale_price)}</td>
                  <td>{carcasa.sku || '-'}</td>
                  <td>
                    <span className={`badge ${carcasa.is_active ? 'bg-success' : 'bg-secondary'}`}>
                      {carcasa.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    {isAdmin && (
                      <>
                        <Button variant="info" size="sm" className="me-1" onClick={() => handleEdit(carcasa)}>
                          Editar
                        </Button>
                        <Button variant={carcasa.is_active ? 'warning' : 'success'} size="sm" onClick={() => handleToggleActive(carcasa)}>
                          {carcasa.is_active ? 'Desactivar' : 'Activar'}
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{editingCarcasa ? 'Editar Carcasa' : 'Nueva Carcasa'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col md={6} className="mb-3">
                <Form.Label>Modelo de iPhone *</Form.Label>
                <Form.Select
                  required
                  value={formData.iphone_model_id}
                  onChange={(e) => setFormData({ ...formData, iphone_model_id: e.target.value })}
                >
                  <option value="">Seleccione...</option>
                  {iphoneModels.map((model) => (
                    <option key={model.id} value={model.id}>{model.model}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label>Tipo de Carcasa *</Form.Label>
                <Form.Select
                  required
                  value={formData.case_type_id}
                  onChange={(e) => setFormData({ ...formData, case_type_id: e.target.value })}
                >
                  <option value="">Seleccione...</option>
                  {caseTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label>Color *</Form.Label>
                <Form.Control
                  required
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label>Material</Form.Label>
                <Form.Control
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                />
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label>Precio Compra *</Form.Label>
                <Form.Control
                  type="number"
                  step="1"
                  required
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                />
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label>Precio Venta *</Form.Label>
                <Form.Control
                  type="number"
                  step="1"
                  required
                  value={formData.sale_price}
                  onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                />
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label>Stock Inicial</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.current_stock}
                  onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                />
              </Col>
              <Col md={6} className="mb-3">
                <Form.Label>Stock Mínimo</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                />
              </Col>
              <Col md={12} className="mb-3">
                <Form.Label>SKU</Form.Label>
                <Form.Control
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editingCarcasa ? 'Guardar Cambios' : 'Crear'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}
