import { NavLink } from 'react-router-dom'
import { LayoutGrid, Package, Users, ShoppingCart, ChevronRight, Box } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Box size={18} />
        </div>
        <span className="brand-name">InventoryOS</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
            end={to === '/'}
          >
            <Icon size={18} />
            <span>{label}</span>
            <ChevronRight size={15} className="chevron" />
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        Connected to <code>localhost:8000</code>
      </div>
    </aside>
  )
}
