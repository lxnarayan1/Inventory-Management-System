import { useState } from 'react'
import { api } from '../api/client.js'

export default function ProductModal({ product, onClose, onSaved }) {
  const isEdit = Boolean(product)
  const [form, setForm] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    price: product?.price ?? '',
    quantity: product?.quantity ?? 0,
    reorder_level: product?.reorder_level ?? 5,
    category: product?.category || '',
    description: product?.description || '',
  })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const payload = {
      ...form,
      price: Number(form.price),
      quantity: Number(form.quantity),
      reorder_level: Number(form.reorder_level),
    }
    try {
      if (isEdit) {
        await api.updateProduct(product.id, payload)
      } else {
        await api.createProduct(payload)
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{isEdit ? 'Edit Product' : 'New Product'}</h2>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input required value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>SKU</label>
              <input required value={form.sku} onChange={(e) => set('sku', e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Category</label>
              <input value={form.category} onChange={(e) => set('category', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Price</label>
              <input required type="number" step="0.01" min="0" value={form.price} onChange={(e) => set('price', e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Quantity</label>
              <input required type="number" min="0" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Reorder level</label>
              <input type="number" min="0" value={form.reorder_level} onChange={(e) => set('reorder_level', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
