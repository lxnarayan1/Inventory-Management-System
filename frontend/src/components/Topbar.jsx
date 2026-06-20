export default function Topbar({ title }) {
  return (
    <div className="topbar">
      <span className="topbar-title">{title}</span>
      <div className="demo-pill">
        <span className="demo-dot" />
        Demo mode
      </div>
    </div>
  )
}
