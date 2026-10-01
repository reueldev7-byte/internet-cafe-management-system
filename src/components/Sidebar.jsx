import { NavLink, useNavigate } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <aside className="sidebar">

      <div className="sidebar-brand">

        <div className="sidebar-logo">
          <div className="sidebar-logo-screen"></div>
          <div className="sidebar-logo-stand"></div>
        </div>

        <h2>Internet Café</h2>

        <p>MANAGEMENT SYSTEM</p>

      </div>

      <nav className="sidebar-nav">

        <NavLink
          to="/dashboard"
          className="nav-item"
        >
          <span className="nav-icon">▣</span>
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/pc-management"
          className="nav-item"
        >
          <span className="nav-icon">▤</span>
          <span>PC Management</span>
        </NavLink>

        <NavLink
          to="/customers"
          className="nav-item"
        >
          <span className="nav-icon">♙</span>
          <span>Customers</span>
        </NavLink>

        <NavLink
          to="/sessions"
          className="nav-item"
        >
          <span className="nav-icon">◷</span>
          <span>Sessions</span>
        </NavLink>

        <NavLink
          to="/queue"
          className="nav-item"
        >
          <span className="nav-icon">☷</span>
          <span>Queue</span>
        </NavLink>

        <NavLink
          to="/transactions"
          className="nav-item"
        >
          <span className="nav-icon">₱</span>
          <span>Transactions</span>
        </NavLink>

        <NavLink
          to="/reports"
          className="nav-item"
        >
          <span className="nav-icon">▥</span>
          <span>Reports</span>
        </NavLink>

        <NavLink
          to="/start-session"
          className="nav-item"
        >
          <span className="nav-icon">▶</span>
          <span>Start Session</span>
        </NavLink>

      </nav>

      <div className="sidebar-bottom">

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          <span className="nav-icon">↪</span>
          <span>Logout</span>
        </button>

      </div>

    </aside>
  );
}

export default Sidebar;