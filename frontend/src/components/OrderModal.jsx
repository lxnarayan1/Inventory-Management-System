import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '../api/client.js'

export default function OrderModal({ onClose, onCreated }) {
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [customerId, setCustomerId] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }])
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.getCustomers({ limit: 100 }).then((r) => setCustomers(r.items)).catch(() => {})
    api.getProducts({ limit: 100 }).then((r) => setProducts(r.items)).catch(() => {})
  }, [])

  function updateItem(idx, field, value) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)))
  }

  function addItem() {
    setItems((prev) => [...prev, { product_id: '', quantity: 1 }])
  }

  function removeItem(idx) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!customerId) {
      setError('Please select a customer.')
      return
    }
    const validItems = items.filter((it) => it.product_id && Number(it.quantity) > 0)
    if (validItems.length === 0) {
      setError('Add at least one product.')
      return
    }
    setSubmitting(true)
    try {
      await api.createOrder({
        customer_id: customerId,
        shipping_address: shippingAddress || undefined,
        items: validItems.map((it) => ({ product_id: it.product_id, quantity: Number(it.quantity) })),
      })
      onCreated()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Create Order</h2>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Customer</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Select a customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} — {c.email}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Shipping address (optional)</label>
            <textarea rows={2} value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Items</label>
            {items.map((item, idx) => (
              <div className="order-item-row" key={idx}>
                <select value={item.product_id} onChange={(e) => updateItem(idx, 'product_id', e.target.value)}>
                  <option value="">Select product…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₹{Number(p.price).toFixed(2)}, {p.quantity} in stock)
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                />
                <button type="button" className="icon-btn" onClick={() => removeItem(idx)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-secondary" onClick={addItem}>
              <Plus size={14} /> Add item
            </button>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
