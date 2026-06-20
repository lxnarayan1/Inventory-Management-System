import { useState } from 'react'
import { api } from '../api/client.js'

export default function CustomerModal({ customer, onClose, onSaved }) {
  const isEdit = Boolean(customer)
  const [form, setForm] = useState({
    full_name: customer?.full_name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
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
    try {
      if (isEdit) {
        const { email, ...updatable } = form
        await api.updateCustomer(customer.id, updatable)
      } else {
        await api.createCustomer(form)
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
        <h2>{isEdit ? 'Edit Customer' : 'New Customer'}</h2>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full name</label>
            <input required value={form.full_name} onChange={(e) => set('full_name', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input required type="email" disabled={isEdit} value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Address</label>
            <textarea rows={2} value={form.address} onChange={(e) => set('address', e.target.value)} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
