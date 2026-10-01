import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../Sidebar";
import Topbar from "../Topbar";
import { supabase } from "../../lib/supabaseClient";

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      });
};

const formatDuration = (startValue, endValue) => {
  const start = new Date(startValue).getTime();
  const end = endValue
    ? new Date(endValue).getTime()
    : Date.now();

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    end < start
  ) {
    return "—";
  }

  const minutes = Math.floor((end - start) / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return hours
    ? `${hours}h ${remainingMinutes}m`
    : `${remainingMinutes}m`;
};

function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [computers, setComputers] = useState([]);
  const [waitingCount, setWaitingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userRole = localStorage.getItem("userRole");
  const username = localStorage.getItem("username");
  const fullName = localStorage.getItem("fullName");

  const isViewer = userRole === "admin_viewer";

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    const [
      sessionsResult,
      customersResult,
      computersResult,
      queueResult,
    ] = await Promise.all([
      supabase
        .from("sessions")
        .select("*")
        .order("id", { ascending: false }),

      supabase
        .from("customers")
        .select("id, name"),

      supabase
        .from("computers")
        .select("id, pc_number, status"),

      supabase
        .from("queue")
        .select("id, status"),
    ]);

    const failures = [
      sessionsResult,
      customersResult,
      computersResult,
      queueResult,
    ]
      .filter((result) => result.error)
      .map((result) => result.error.message);

    setSessions(sessionsResult.data || []);
    setCustomers(customersResult.data || []);
    setComputers(computersResult.data || []);

    setWaitingCount(
      (queueResult.data || []).filter(
        (item) =>
          (item.status || "").toLowerCase() === "waiting"
      ).length
    );

    if (failures.length) {
      setError(
        `Some dashboard data could not be loaded: ${failures.join(
          "; "
        )}`
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      loadDashboard();
    }, 0);

    const channel = supabase
      .channel("dashboard-session-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sessions",
        },
        loadDashboard
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue",
        },
        loadDashboard
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "computers",
        },
        loadDashboard
      )
      .subscribe();

    return () => {
      window.clearTimeout(initialLoad);
      supabase.removeChannel(channel);
    };
  }, [loadDashboard]);

  const getCustomerName = (id) =>
    customers.find(
      (customer) =>
        String(customer.id) === String(id)
    )?.name || `Customer #${id}`;

  const getComputerNumber = (id) =>
    computers.find(
      (computer) =>
        String(computer.id) === String(id)
    )?.pc_number || `#${id}`;

  const activeSessions = sessions.filter(
    (session) =>
      (session.status || "").toLowerCase() === "active"
  );

  const availableComputers = computers.filter(
    (computer) =>
      (computer.status || "").toLowerCase() === "available"
  ).length;

  const recentSessions = [...sessions]
    .sort(
      (a, b) =>
        new Date(b.start_time || 0) -
        new Date(a.start_time || 0)
    )
    .slice(0, 6);

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="main-area">
        <Topbar />

        <main className="page-content">
          <div className="page-header">
            <div>
              <h1>Dashboard</h1>

              <p>
                Live activity and recent customer sessions.
              </p>
            </div>

            <div className="dashboard-header-actions">
              {isViewer && (
                <span className="viewer-badge">
                  Viewer Mode
                </span>
              )}

              <button
                type="button"
                className="secondary-button"
                onClick={loadDashboard}
                disabled={loading}
              >
                {loading
                  ? "Refreshing…"
                  : "Refresh data"}
              </button>
            </div>
          </div>

          {isViewer && (
            <div className="viewer-notice" role="status">
              <strong>View-only access</strong>

              <span>
                You are logged in as{" "}
                {fullName || username || "Admin 2"}.
                You can view system information but
                cannot modify records.
              </span>
            </div>
          )}

          {error && (
            <div
              className="form-message"
              role="status"
            >
              {error}
            </div>
          )}

          <section
            className="dashboard-cards"
            aria-label="Café overview"
          >
            <div className="dashboard-card">
              <div className="card-content">
                <div>
                  <span className="card-label">
                    Total computers
                  </span>

                  <h3>
                    {loading
                      ? "—"
                      : computers.length}
                  </h3>
                </div>

                <div
                  className="card-icon blue"
                  aria-hidden="true"
                >
                  ▣
                </div>
              </div>

              <p className="metric-caption">
                Registered workstations
              </p>
            </div>

            <div className="dashboard-card">
              <div className="card-content">
                <div>
                  <span className="card-label">
                    Available PCs
                  </span>

                  <h3>
                    {loading
                      ? "—"
                      : availableComputers}
                  </h3>
                </div>

                <div
                  className="card-icon green"
                  aria-hidden="true"
                >
                  ✓
                </div>
              </div>

              <p className="metric-caption">
                Ready for a customer
              </p>
            </div>

            <div className="dashboard-card">
              <div className="card-content">
                <div>
                  <span className="card-label">
                    Active sessions
                  </span>

                  <h3>
                    {loading
                      ? "—"
                      : activeSessions.length}
                  </h3>
                </div>

                <div
                  className="card-icon orange"
                  aria-hidden="true"
                >
                  ◷
                </div>
              </div>

              <p className="metric-caption">
                Currently in progress
              </p>
            </div>

            <div className="dashboard-card">
              <div className="card-content">
                <div>
                  <span className="card-label">
                    Waiting queue
                  </span>

                  <h3>
                    {loading
                      ? "—"
                      : waitingCount}
                  </h3>
                </div>

                <div
                  className="card-icon purple"
                  aria-hidden="true"
                >
                  ≡
                </div>
              </div>

              <p className="metric-caption">
                Customers waiting
              </p>
            </div>
          </section>

          <section className="content-section dashboard-live-section">
            <div className="section-header">
              <div>
                <h2>Active sessions</h2>

                <p>
                  Customers currently using a computer.
                </p>
              </div>

              <Link
                className="text-link"
                to="/sessions"
              >
                View sessions{" "}
                <span aria-hidden="true">
                  →
                </span>
              </Link>
            </div>

            {loading ? (
              <p className="dashboard-empty">
                Loading active sessions…
              </p>
            ) : activeSessions.length ? (
              <div className="active-session-grid">
                {activeSessions
                  .slice(0, 4)
                  .map((session) => (
                    <article
                      className="active-session-card"
                      key={session.id}
                    >
                      <div className="active-session-top">
                        <span className="pc-chip">
                          PC{" "}
                          {getComputerNumber(
                            session.computer_id
                          )}
                        </span>

                        <span className="status active">
                          Active
                        </span>
                      </div>

                      <h3>
                        {getCustomerName(
                          session.customer_id
                        )}
                      </h3>

                      <p>
                        Started{" "}
                        {formatDateTime(
                          session.start_time
                        )}
                      </p>

                      <div className="session-duration">
                        <span>
                          Session duration
                        </span>

                        <strong>
                          {formatDuration(
                            session.start_time
                          )}
                        </strong>
                      </div>
                    </article>
                  ))}
              </div>
            ) : (
              <p className="dashboard-empty">
                No active sessions right now.
                New sessions will appear here.
              </p>
            )}
          </section>

          <section className="content-section">
            <div className="section-header">
              <div>
                <h2>Recent sessions</h2>

                <p>
                  The latest records from your
                  Sessions page.
                </p>
              </div>

              <Link
                className="primary-button dashboard-view-all"
                to="/sessions"
              >
                View all sessions
              </Link>
            </div>

            <div className="table-container">
              <table className="data-table dashboard-session-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Computer</th>
                    <th>Started</th>
                    <th>Duration</th>
                    <th>Cost</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="empty-table"
                      >
                        Loading recent sessions…
                      </td>
                    </tr>
                  ) : recentSessions.length ? (
                    recentSessions.map((session) => (
                      <tr key={session.id}>
                        <td>
                          <strong>
                            {getCustomerName(
                              session.customer_id
                            )}
                          </strong>
                        </td>

                        <td>
                          PC{" "}
                          {getComputerNumber(
                            session.computer_id
                          )}
                        </td>

                        <td>
                          {formatDateTime(
                            session.start_time
                          )}
                        </td>

                        <td>
                          {formatDuration(
                            session.start_time,
                            session.end_time
                          )}
                        </td>

                        <td>
                          ₱
                          {Number(
                            session.total_cost || 0
                          ).toFixed(2)}
                        </td>

                        <td>
                          <span
                            className={`status ${(
                              session.status || ""
                            ).toLowerCase()}`}
                          >
                            {session.status ||
                              "Unknown"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="empty-table"
                      >
                        No session records yet.
                        Add a session to see it here.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;