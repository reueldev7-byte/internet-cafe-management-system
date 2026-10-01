function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button type="button" className="menu-button">
          ☰
        </button>

        <div>
          <h2>Internet Café Management System</h2>
          <p>Management Dashboard</p>
        </div>
      </div>

      <div className="topbar-right">
        <button
          type="button"
          className="notification"
          aria-label="Notifications"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
          </svg>
        </button>

        <div className="user-profile">
          <div className="user-avatar">A</div>

          <div className="user-info">
            <strong>Admin</strong>
            <span>Administrator</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;