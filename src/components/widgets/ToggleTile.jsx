import Icon from '../Icon'

function ToggleTile({ icon, label, status, on, stacked, index = 0, onClick }) {
  return (
    <button
      className={`w-card wtile ${on ? 'on' : ''} ${stacked ? 'stacked' : ''}`}
      style={{ '--i': index }}
      onClick={onClick}
    >
      <span className="wtile-icon">
        <Icon name={icon} />
      </span>
      <span className="wtile-text">
        <b>{label}</b>
        <small>{status}</small>
      </span>
    </button>
  )
}

export default ToggleTile