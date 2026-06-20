import { useEffect, useState } from 'react'
import Topbar from '../components/Topbar.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { api } from '../api/client.js'

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [lowStock, setLowStock] = useState([])

  useEffect(() => {
    api.getStats().then(setStats).catch(() => {})
    api.getRecentOrders().then(setRecent).catch(() => {})
    api.getLowStock().then(setLowStock).catch(() => {})
  }, [])

  return (
    <>
      <Topbar title="Dashboard" />
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Overview of your inventory and orders</p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Products</div>
            <div className="stat-value">{stats?.total_products ?? '—'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Customers</div>
            <div className="stat-value">{stats?.total_customers ?? '—'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Orders</div>
            <div className="stat-value">{stats?.total_orders ?? '—'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value">{stats ? `₹${Number(stats.total_revenue).toFixed(2)}` : '—'}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>ORDER</th>
                  <th>CUSTOMER</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id}>
                    <td className="cell-id">#{o.order_number.split('-').pop()}</td>
                    <td className="cell-strong">{o.customer_name}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td style={{ textAlign: 'right' }}>₹{Number(o.total_amount).toFixed(2)}</td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr><td colSpan={4} className="empty-state">No orders yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>LOW STOCK</th>
                  <th style={{ textAlign: 'right' }}>QTY</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((p) => (
                  <tr key={p.id}>
                    <td className="cell-strong">{p.name}</td>
                    <td style={{ textAlign: 'right', color: 'var(--badge-pending-text)', fontWeight: 700 }}>
                      {p.quantity}
                    </td>
                  </tr>
                ))}
                {lowStock.length === 0 && (
                  <tr><td colSpan={2} className="empty-state">All stocked up.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
