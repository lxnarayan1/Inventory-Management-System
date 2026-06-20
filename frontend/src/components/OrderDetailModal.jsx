import { useEffect, useState } from 'react'
import StatusBadge from './StatusBadge.jsx'
import { api } from '../api/client.js'

const NEXT_STATUS = {
  pending: 'processing',
  processing: 'shipped',
  shipped: 'delivered',
}

export default function OrderDetailModal({ orderId, onClose, onChanged }) {
  const [order, setOrder] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  function load() {
    api.getOrder(orderId).then(setOrder).catch((e) => setError(e.message))
  }

  useEffect(load, [orderId])

  async function advance() {
    const next = NEXT_STATUS[order.status]
    if (!next) return
    setBusy(true)
    try {
      await api.updateOrderStatus(order.id, next)
      load()
      onChanged?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function cancel() {
    setBusy(true)
    try {
      await api.cancelOrder(order.id)
      load()
      onChanged?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (!order) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          {error ? <div className="error-banner">{error}</div> : <div className="loading-state">Loading…</div>}
        </div>
      </div>
    )
  }

  const canAdvance = Boolean(NEXT_STATUS[order.status])
  const canCancel = ['pending', 'processing'].includes(order.status)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 520 }}>
        <h2>Order #{order.order_number.split('-').pop()}</h2>
        {error && <div className="error-banner">{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div className="form-group" style={{ marginBottom: 4 }}>
              <label>Customer</label>
              <div className="cell-strong">{order.customer_name}</div>
            </div>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <table style={{ marginBottom: 16 }}>
          <thead>
            <tr>
              <th>PRODUCT</th>
              <th>QTY</th>
              <th style={{ textAlign: 'right' }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it) => (
              <tr key={it.id}>
                <td>{it.product_name}</td>
                <td className="cell-muted">{it.quantity}</td>
                <td style={{ textAlign: 'right' }}>₹{Number(it.total_price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: 20 }}>
          <span>Total</span>
          <span>₹{Number(order.total_amount).toFixed(2)}</span>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          {canCancel && (
            <button className="btn btn-danger" disabled={busy} onClick={cancel}>
              Cancel order
            </button>
          )}
          {canAdvance && (
            <button className="btn btn-primary" disabled={busy} onClick={advance}>
              Mark as {NEXT_STATUS[order.status]}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
