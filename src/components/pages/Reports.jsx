import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "../Sidebar";
import Topbar from "../Topbar";
import { supabase } from "../../lib/supabaseClient";

const getDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const formatCurrency = (value) => new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
}).format(value || 0);

const formatDuration = (minutes) => {
  if (!Number.isFinite(minutes) || minutes <= 0) return "—";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
};

function Reports() {
  const [sessions, setSessions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [customerCount, setCustomerCount] = useState(null);
  const [rangeDays, setRangeDays] = useState(7);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    setError("");

    const [sessionsResult, transactionsResult, customersResult] = await Promise.all([
      supabase
        .from("sessions")
        .select("id, customer_id, start_time, end_time, total_cost, status")
        .order("start_time", { ascending: false }),
      supabase
        .from("transactions")
        .select("id, amount, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("customers")
        .select("id", { count: "exact", head: true }),
    ]);

    setSessions(sessionsResult.data || []);
    setTransactions(transactionsResult.data || []);
    if (!customersResult.error) setCustomerCount(customersResult.count || 0);

    const errors = [sessionsResult, transactionsResult, customersResult]
      .filter((result) => result.error)
      .map((result) => result.error.message);
    if (errors.length) setError(`Some report data could not be loaded: ${errors.join("; ")}`);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      loadReport();
    }, 0);
    const channel = supabase
      .channel("reports-session-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions" }, loadReport)
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, loadReport)
      .subscribe();

    return () => {
      window.clearTimeout(initialLoad);
      supabase.removeChannel(channel);
    };
  }, [loadReport]);

  const { periodSessions, activityRows, totalRevenue, averageDuration } = useMemo(() => {
    const days = Array.from({ length: rangeDays }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - index);
      return date;
    });
    const dayKeys = new Set(days.map(getDateKey));
    const period = sessions.filter((session) => dayKeys.has(getDateKey(session.start_time)));
    const periodTransactions = transactions.filter((transaction) => dayKeys.has(getDateKey(transaction.created_at)));
    const grouped = new Map(days.map((date) => [getDateKey(date), { date, count: 0, revenue: 0 }]));

    period.forEach((session) => {
      const key = getDateKey(session.start_time);
      const row = grouped.get(key);
      if (!row) return;
      row.count += 1;
    });
    periodTransactions.forEach((transaction) => {
      const row = grouped.get(getDateKey(transaction.created_at));
      if (row) row.revenue += Number(transaction.amount) || 0;
    });

    const durations = period
      .filter((session) => session.end_time && session.start_time)
      .map((session) => (new Date(session.end_time) - new Date(session.start_time)) / 60000)
      .filter((minutes) => Number.isFinite(minutes) && minutes > 0);
    const mean = durations.length
      ? Math.round(durations.reduce((sum, minutes) => sum + minutes, 0) / durations.length)
      : null;

    return {
      periodSessions: period,
      periodTransactions,
      activityRows: [...grouped.values()],
      totalRevenue: periodTransactions.reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0),
      averageDuration: mean,
    };
  }, [rangeDays, sessions, transactions]);

  const exportCsv = () => {
    const rows = [
      ["Date", "Activity", "Sessions", "Revenue"],
      ...activityRows.map((row) => [
        getDateKey(row.date),
        "Computer sessions",
        row.count,
        row.revenue.toFixed(2),
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `cafe-report-${rangeDays}-days.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-area">
        <Topbar />
        <main className="page-content">
          <div className="page-header">
            <div>
              <h1>Reports</h1>
              <p>Track session activity and revenue from your records.</p>
            </div>
            <div className="report-page-actions">
              <button type="button" className="secondary-button" onClick={loadReport} disabled={isLoading}>
                {isLoading ? "Refreshing…" : "Refresh"}
              </button>
              <button type="button" className="primary-button" onClick={exportCsv} disabled={isLoading}>
                Export CSV
              </button>
            </div>
          </div>

          {error && <div className="form-message error" role="status">{error}</div>}

          <div className="report-range" role="group" aria-label="Report date range">
            {[7, 30, 90].map((days) => (
              <button
                type="button"
                key={days}
                className={`report-range-button${rangeDays === days ? " selected" : ""}`}
                aria-pressed={rangeDays === days}
                onClick={() => setRangeDays(days)}
              >
                {days === 7 ? "7 days" : `${days} days`}
              </button>
            ))}
          </div>

          <section className="dashboard-cards report-summary-cards" aria-label="Report summary">
            <article className="dashboard-card">
              <div className="card-content"><div><span className="card-label">Revenue · {rangeDays} days</span><h3>{isLoading ? "—" : formatCurrency(totalRevenue)}</h3></div><div className="card-icon orange" aria-hidden="true">₱</div></div>
              <p className="metric-caption">From recorded transactions</p>
            </article>
            <article className="dashboard-card">
              <div className="card-content"><div><span className="card-label">Sessions · {rangeDays} days</span><h3>{isLoading ? "—" : periodSessions.length}</h3></div><div className="card-icon blue" aria-hidden="true">▤</div></div>
              <p className="metric-caption">Sessions started in this period</p>
            </article>
            <article className="dashboard-card">
              <div className="card-content"><div><span className="card-label">Customers</span><h3>{isLoading || customerCount === null ? "—" : customerCount}</h3></div><div className="card-icon green" aria-hidden="true">♙</div></div>
              <p className="metric-caption">Registered in the system</p>
            </article>
            <article className="dashboard-card">
              <div className="card-content"><div><span className="card-label">Average session</span><h3>{isLoading ? "—" : formatDuration(averageDuration)}</h3></div><div className="card-icon purple" aria-hidden="true">◷</div></div>
              <p className="metric-caption">Based on sessions with an end time</p>
            </article>
          </section>

          <section className="content-section">
            <div className="section-header">
              <div>
                <h2>Daily activity</h2>
                <p>Sessions by start date and payments by transaction date.</p>
              </div>
              <span className="report-period-label">Last {rangeDays} days</span>
            </div>
            <div className="table-container">
              <table className="data-table report-table">
                <thead><tr><th>Date</th><th>Activity</th><th>Sessions</th><th>Revenue</th></tr></thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan="4" className="empty-table">Loading report data…</td></tr>
                  ) : activityRows.map((row) => (
                    <tr key={getDateKey(row.date)}>
                      <td>{row.date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}</td>
                      <td>Computer sessions</td>
                      <td>{row.count}</td>
                      <td className="report-revenue">{formatCurrency(row.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Reports;
