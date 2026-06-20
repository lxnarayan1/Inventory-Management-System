import { useCallback, useEffect, useState } from 'react'
import { Search, Plus, Pencil, Trash2 } from 'lucide-react'
import Topbar from '../components/Topbar.jsx'
import CustomerModal from '../components/CustomerModal.jsx'
import { api } from '../api/client.js'

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    const params = { limit: 50 }
    if (search) params.search = search
    api
      .getCustomers(params)
      .then((res) => {
        setCustomers(res.items)
        setTotal(res.total)
        setError(null)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [search])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  async function handleDelete(c) {
    if (!confirm(`Delete "${c.full_name}"?`)) return
    try {
      await api.deleteCustomer(c.id)
      load()
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <>
      <Topbar title="Customers" />
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Customers</h1>
            <p className="page-subtitle">{total} total customers</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Add Customer
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="search-bar">
          <Search size={16} />
          <input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="card">
          {loading ? (
            <div className="loading-state">Loading customers…</div>
          ) : customers.length === 0 ? (
            <div className="empty-state">No customers found.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>EMAIL</th>
                  <th>PHONE</th>
                  <th>JOINED</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td className="cell-strong">{c.full_name}</td>
                    <td className="cell-muted">{c.email}</td>
                    <td className="cell-muted">{c.phone || '—'}</td>
                    <td className="cell-muted">{new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn" onClick={() => setEditing(c)}>
                          <Pencil size={15} />
                        </button>
                        <button className="icon-btn" onClick={() => handleDelete(c)}>
                          <Trash2 size={15} />
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
        <CustomerModal onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); load() }} />
      )}
      {editing && (
        <CustomerModal customer={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />
      )}
    </>
  )
}
