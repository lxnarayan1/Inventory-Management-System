import { useCallback, useEffect, useState } from 'react'
import { Search, Plus, Pencil, Trash2 } from 'lucide-react'
import Topbar from '../components/Topbar.jsx'
import ProductModal from '../components/ProductModal.jsx'
import { api } from '../api/client.js'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
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
      .getProducts(params)
      .then((res) => {
        setProducts(res.items)
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

  async function handleDelete(p) {
    if (!confirm(`Delete "${p.name}"?`)) return
    try {
      await api.deleteProduct(p.id)
      load()
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <>
      <Topbar title="Products" />
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Products</h1>
            <p className="page-subtitle">{total} total products</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Add Product
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="search-bar">
          <Search size={16} />
          <input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="card">
          {loading ? (
            <div className="loading-state">Loading products…</div>
          ) : products.length === 0 ? (
            <div className="empty-state">No products found.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>SKU</th>
                  <th>CATEGORY</th>
                  <th style={{ textAlign: 'right' }}>PRICE</th>
                  <th style={{ textAlign: 'right' }}>STOCK</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const low = p.quantity < p.reorder_level
                  return (
                    <tr key={p.id}>
                      <td className="cell-strong">{p.name}</td>
                      <td className="cell-id">{p.sku}</td>
                      <td className="cell-muted">{p.category || '—'}</td>
                      <td style={{ textAlign: 'right' }}>₹{Number(p.price).toFixed(2)}</td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          color: low ? 'var(--badge-pending-text)' : 'var(--text-primary)',
                        }}
                      >
                        {p.quantity}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button className="icon-btn" onClick={() => setEditing(p)}>
                            <Pencil size={15} />
                          </button>
                          <button className="icon-btn" onClick={() => handleDelete(p)}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showCreate && (
        <ProductModal onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); load() }} />
      )}
      {editing && (
        <ProductModal product={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />
      )}
    </>
  )
}
