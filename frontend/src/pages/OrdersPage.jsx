import { useEffect, useState, useCallback } from 'react'
import { Search, Plus, Eye } from 'lucide-react'
import Topbar from '../components/Topbar.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import OrderModal from '../components/OrderModal.jsx'
import OrderDetailModal from '../components/OrderDetailModal.jsx'
import { api } from '../api/client.js'

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [viewOrderId, setViewOrderId] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = { limit: 50 }
    if (search) params.search = search
    if (status) params.status = status
    api
      .getOrders(params)
      .then((res) => {
        setOrders(res.items)
        setTotal(res.total)
        setError(null)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [search, status])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  return (
    <>
      <Topbar title="Orders" />
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Orders</h1>
            <p className="page-subtitle">{total} total orders</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Create Order
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="search-bar">
          <Search size={16} />
          <input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="filter-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <div className="card">
          {loading ? (
            <div className="loading-state">Loading orders…</div>
          ) : orders.length === 0 ? (
            <div className="empty-state">No orders found.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ORDER</th>
                  <th>CUSTOMER</th>
                  <th>DATE</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>TOTAL</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="cell-id">#{o.order_number.split('-').pop()}</td>
                    <td className="cell-strong">{o.customer_name}</td>
                    <td className="cell-muted">{formatDate(o.order_date)}</td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="cell-strong" style={{ textAlign: 'right' }}>
                      ₹{Number(o.total_amount).toFixed(2)}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn" onClick={() => setViewOrderId(o.id)}>
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showCreate && (
        <OrderModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            load()
          }}
        />
      )}

      {viewOrderId && (
        <OrderDetailModal
          orderId={viewOrderId}
          onClose={() => setViewOrderId(null)}
          onChanged={load}
        />
      )}
    </>
  )
}
