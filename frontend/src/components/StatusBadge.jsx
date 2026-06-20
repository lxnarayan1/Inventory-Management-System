import { CheckCircle2, Loader2, Clock, XCircle } from 'lucide-react'

const CONFIG = {
  completed: { label: 'Completed', cls: 'badge-completed', icon: CheckCircle2 },
  delivered: { label: 'Delivered', cls: 'badge-completed', icon: CheckCircle2 },
  processing: { label: 'Processing', cls: 'badge-processing', icon: Loader2 },
  shipped: { label: 'Shipped', cls: 'badge-processing', icon: Loader2 },
  pending: { label: 'Pending', cls: 'badge-pending', icon: Clock },
  cancelled: { label: 'Cancelled', cls: 'badge-cancelled', icon: XCircle },
}

export default function StatusBadge({ status }) {
  const conf = CONFIG[status] || { label: status, cls: 'badge-pending', icon: Clock }
  const Icon = conf.icon
  return (
    <span className={`badge ${conf.cls}`}>
      <Icon size={13} />
      {conf.label}
    </span>
  )
}
