import { useEffect, useState } from "react";
import Sidebar from "../Sidebar";
import Topbar from "../Topbar";
import { supabase } from "../../lib/supabaseClient";

function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [computers, setComputers] = useState([]);

  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);

  const [customerId, setCustomerId] = useState("");
  const [computerId, setComputerId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [status, setStatus] = useState("Active");

  useEffect(() => {
    let isMounted = true;

    const initializeSessions = async () => {
      const sessionsResult = await supabase
        .from("sessions")
        .select("*")
        .order("id", { ascending: false });

      const customersResult = await supabase
        .from("customers")
        .select("id, name")
        .order("name", { ascending: true });

      const computersResult = await supabase
        .from("computers")
        .select("id, pc_number, status, rate_per_hour")
        .order("pc_number", { ascending: true });

      if (!isMounted) {
        return;
      }

      if (sessionsResult.error) {
        console.error(
          "Error loading sessions:",
          sessionsResult.error
        );
        setMessage(
          `Failed to load sessions: ${sessionsResult.error.message}`
        );
      } else {
        setSessions(sessionsResult.data || []);
      }

      setIsLoading(false);

      if (customersResult.error) {
        console.error(
          "Error loading customers:",
          customersResult.error
        );
        setMessage(
          `Failed to load customers: ${customersResult.error.message}`
        );
      } else {
        setCustomers(customersResult.data || []);
      }

      if (computersResult.error) {
        console.error(
          "Error loading computers:",
          computersResult.error
        );
        setMessage(
          `Failed to load computers: ${computersResult.error.message}`
        );
      } else {
        setComputers(computersResult.data || []);
      }
    };

    initializeSessions();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Error loading sessions:", error);
      setMessage(`Failed to load sessions: ${error.message}`);
      setIsLoading(false);
      return;
    }

    setSessions(data || []);
    setIsLoading(false);
  };

  const getCustomerName = (id) => {
    const customer = customers.find(
      (item) => String(item.id) === String(id)
    );

    if (customer) {
      return customer.name;
    }

    return `Customer #${id}`;
  };

  const getComputerNumber = (id) => {
    const computer = computers.find(
      (item) => String(item.id) === String(id)
    );

    if (computer) {
      return computer.pc_number;
    }

    return `#${id}`;
  };

  const formatDateTimeForInput = (value) => {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const openAddForm = () => {
    setEditingSession(null);
    setCustomerId("");
    setComputerId("");
    setStartTime("");
    setEndTime("");
    setTotalCost("");
    setStatus("Active");
    setMessage("");
    setShowForm(true);
  };

  const openEditForm = (session) => {
    setEditingSession(session);

    setCustomerId(String(session.customer_id || ""));
    setComputerId(String(session.computer_id || ""));

    setStartTime(
      session.start_time
        ? formatDateTimeForInput(session.start_time)
        : ""
    );

    setEndTime(
      session.end_time
        ? formatDateTimeForInput(session.end_time)
        : ""
    );

    setTotalCost(
      session.total_cost !== null &&
      session.total_cost !== undefined
        ? String(session.total_cost)
        : ""
    );

    setStatus(session.status || "Active");
    setMessage("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingSession(null);
    setCustomerId("");
    setComputerId("");
    setStartTime("");
    setEndTime("");
    setTotalCost("");
    setStatus("Active");
  };

  const calculateCost = () => {
    if (!startTime || !endTime) {
      setMessage("Please enter both start time and end time.");
      return;
    }

    if (!computerId) {
      setMessage("Please select a computer first.");
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      setMessage("Please enter valid dates.");
      return;
    }

    if (end <= start) {
      setMessage("End time must be later than start time.");
      return;
    }

    const computer = computers.find(
      (item) => String(item.id) === String(computerId)
    );

    if (!computer) {
      setMessage("Computer not found.");
      return;
    }

    const rate = Number(computer.rate_per_hour);

    if (Number.isNaN(rate)) {
      setMessage("The selected computer has an invalid hourly rate.");
      return;
    }

    const durationInHours =
      (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    const cost = durationInHours * rate;

    setTotalCost(cost.toFixed(2));
    setMessage("Session cost calculated.");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!customerId) {
      setMessage("Please select a customer.");
      return;
    }

    if (!computerId) {
      setMessage("Please select a computer.");
      return;
    }

    if (!startTime) {
      setMessage("Please enter the start time.");
      return;
    }

    const start = new Date(startTime);

    if (Number.isNaN(start.getTime())) {
      setMessage("Please enter a valid start time.");
      return;
    }

    if (endTime) {
      const end = new Date(endTime);

      if (Number.isNaN(end.getTime())) {
        setMessage("Please enter a valid end time.");
        return;
      }

      if (end <= start) {
        setMessage("End time must be later than start time.");
        return;
      }
    }

    const sessionData = {
      customer_id: Number(customerId),
      computer_id: Number(computerId),
      start_time: start.toISOString(),
      end_time: endTime
        ? new Date(endTime).toISOString()
        : null,
      total_cost: totalCost ? Number(totalCost) : 0,
      status: status,
    };

    if (editingSession) {
      const { error } = await supabase
        .from("sessions")
        .update(sessionData)
        .eq("id", editingSession.id);

      if (error) {
        console.error("Error updating session:", error);
        setMessage(
          `Failed to update session: ${error.message}`
        );
        return;
      }

      setMessage("Session updated successfully.");
    } else {
      const { error } = await supabase
        .from("sessions")
        .insert([sessionData]);

      if (error) {
        console.error("Error adding session:", error);
        setMessage(
          `Failed to add session: ${error.message}`
        );
        return;
      }

      setMessage("Session added successfully.");
    }

    closeForm();
    await loadSessions();
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this session?"
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting session:", error);
      setMessage(
        `Failed to delete session: ${error.message}`
      );
      return;
    }

    setMessage("Session deleted successfully.");
    await loadSessions();
  };

  const handleStatusChange = async (session, newStatus) => {
    const updates = { status: newStatus };

    if (newStatus.toLowerCase() === "completed" && !session.end_time) {
      const end = new Date();
      updates.end_time = end.toISOString();

      const computer = computers.find(
        (item) => String(item.id) === String(session.computer_id)
      );
      const start = new Date(session.start_time);
      const rate = Number(computer?.rate_per_hour);

      if (Number.isFinite(rate) && Number.isFinite(start.getTime())) {
        updates.total_cost = Number(
          (Math.max(0, end.getTime() - start.getTime()) / 3600000 * rate).toFixed(2)
        );
      }
    }

    const { error } = await supabase
      .from("sessions")
      .update(updates)
      .eq("id", session.id);

    if (error) {
      console.error(
        "Error updating session status:",
        error
      );

      setMessage(
        `Failed to update status: ${error.message}`
      );

      return;
    }

    setMessage("Session status updated.");
    await loadSessions();
  };

  const filteredSessions = sessions.filter((session) => {
    const customerName = getCustomerName(session.customer_id);
    const computerNumber = getComputerNumber(
      session.computer_id
    );

    const searchText = search.toLowerCase();

    const matchesSearch = (
      String(session.id)
        .toLowerCase()
        .includes(searchText) ||
      String(session.customer_id)
        .toLowerCase()
        .includes(searchText) ||
      String(session.computer_id)
        .toLowerCase()
        .includes(searchText) ||
      customerName.toLowerCase().includes(searchText) ||
      String(computerNumber)
        .toLowerCase()
        .includes(searchText) ||
      (session.status || "")
        .toLowerCase()
        .includes(searchText)
    );

    const matchesStatus = statusFilter === "All" ||
      (session.status || "").toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const activeSessions = sessions.filter(
    (session) =>
      (session.status || "").toLowerCase() === "active"
  ).length;

  const completedSessions = sessions.filter(
    (session) =>
      (session.status || "").toLowerCase() === "completed"
  ).length;

  const totalRevenue = sessions.reduce(
    (total, session) =>
      total + (Number(session.total_cost) || 0),
    0
  );

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="main-area">
        <Topbar />

        <main className="page-content">
          <div className="page-header">
            <div>
              <h1>Sessions</h1>
              <p>
                Manage customer computer sessions and session costs.
              </p>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={openAddForm}
            >
              + Add Session
            </button>
          </div>

          {message && (
            <div className="form-message">
              {message}
            </div>
          )}

          {showForm && (
            <section className="content-section">
              <div className="section-header">
                <div>
                  <h2>
                    {editingSession
                      ? "Edit Session"
                      : "Add New Session"}
                  </h2>

                  <p>
                    {editingSession
                      ? "Update the selected session."
                      : "Enter the details for the customer session."}
                  </p>
                </div>
              </div>

              <form
                className="session-form"
                onSubmit={handleSubmit}
              >
                <div className="form-group">
                  <label htmlFor="session-customer">
                    Customer
                  </label>

                  <select
                    id="session-customer"
                    value={customerId}
                    onChange={(event) =>
                      setCustomerId(event.target.value)
                    }
                  >
                    <option value="">
                      Select customer
                    </option>

                    {customers.map((customer) => (
                      <option
                        key={customer.id}
                        value={customer.id}
                      >
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="session-computer">
                    Computer
                  </label>

                  <select
                    id="session-computer"
                    value={computerId}
                    onChange={(event) =>
                      setComputerId(event.target.value)
                    }
                  >
                    <option value="">
                      Select computer
                    </option>

                    {computers.map((computer) => (
                      <option
                        key={computer.id}
                        value={computer.id}
                      >
                        PC {computer.pc_number} —{" "}
                        {computer.status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="session-start">
                    Start Time
                  </label>

                  <input
                    id="session-start"
                    type="datetime-local"
                    value={startTime}
                    onChange={(event) =>
                      setStartTime(event.target.value)
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="session-end">
                    End Time
                  </label>

                  <input
                    id="session-end"
                    type="datetime-local"
                    value={endTime}
                    onChange={(event) =>
                      setEndTime(event.target.value)
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="session-cost">
                    Total Cost
                  </label>

                  <input
                    id="session-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={totalCost}
                    onChange={(event) =>
                      setTotalCost(event.target.value)
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="session-status">
                    Status
                  </label>

                  <select
                    id="session-status"
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value)
                    }
                  >
                    <option value="Active">
                      Active
                    </option>

                    <option value="Completed">
                      Completed
                    </option>

                    <option value="Cancelled">
                      Cancelled
                    </option>
                  </select>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "4px",
                  }}
                >
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={calculateCost}
                  >
                    Calculate Cost
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={closeForm}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                  >
                    {editingSession
                      ? "Update Session"
                      : "Add Session"}
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="dashboard-cards">
            <div className="dashboard-card">
              <div className="card-content">
                <div>
                  <span className="card-label">
                    Total Sessions
                  </span>

                  <h3>{sessions.length}</h3>
                </div>

                <div className="card-icon blue">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="16"
                      rx="2"
                    />
                    <path d="M7 8h10" />
                    <path d="M7 12h10" />
                    <path d="M7 16h6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-content">
                <div>
                  <span className="card-label">
                    Active Sessions
                  </span>

                  <h3>{activeSessions}</h3>
                </div>

                <div className="card-icon green">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                    />
                    <path d="M12 7v5l3 2" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-content">
                <div>
                  <span className="card-label">
                    Completed Sessions
                  </span>

                  <h3>{completedSessions}</h3>
                </div>

                <div className="card-icon purple">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                    />
                    <path d="m8 12 3 3 5-6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-content">
                <div>
                  <span className="card-label">
                    Total Revenue
                  </span>

                  <h3>
                    ₱{totalRevenue.toFixed(2)}
                  </h3>
                </div>

                <div className="card-icon orange">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2v20" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
              </div>
            </div>
          </section>

          <section className="content-section">
            <div className="section-header">
              <div>
                <h2>Session Records</h2>

                <p>
                  {filteredSessions.length} of {sessions.length} records · Update session status or edit a record.
                </p>
              </div>

              <div className="session-record-controls">
                <div className="session-filter" aria-label="Filter sessions by status">
                  {["All", "Active", "Completed", "Cancelled"].map((filter) => (
                    <button
                      type="button"
                      key={filter}
                      className={`session-filter-button${statusFilter === filter ? " selected" : ""}`}
                      aria-pressed={statusFilter === filter}
                      onClick={() => setStatusFilter(filter)}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
                <div className="customer-search">
                <input
                  type="text"
                  aria-label="Search sessions"
                  placeholder="Search sessions..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />
                </div>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Computer</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Total Cost</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {isLoading ? (
                    <tr><td colSpan="8" className="empty-table">Loading session records…</td></tr>
                  ) : filteredSessions.length > 0 ? (
                    filteredSessions.map((session) => (
                      <tr key={session.id}>
                        <td><span className="session-id">#{session.id}</span></td>

                        <td>
                          {getCustomerName(
                            session.customer_id
                          )}
                        </td>

                        <td>
                          PC{" "}
                          {getComputerNumber(
                            session.computer_id
                          )}
                        </td>

                        <td>
                          {session.start_time
                            ? new Date(
                                session.start_time
                              ).toLocaleString()
                            : "-"}
                        </td>

                        <td>
                          {session.end_time
                            ? new Date(
                                session.end_time
                              ).toLocaleString()
                            : "-"}
                        </td>

                        <td className="session-cost">
                          ₱
                          {Number(
                            session.total_cost || 0
                          ).toFixed(2)}
                        </td>

                        <td>
                          <select
                            className={`queue-status-select ${
                              session.status
                                ? session.status.toLowerCase()
                                : ""
                            }`}
                            value={
                              session.status || "Active"
                            }
                            onChange={(event) =>
                              handleStatusChange(
                                session,
                                event.target.value
                              )
                            }
                          >
                            <option value="Active">
                              Active
                            </option>

                            <option value="Completed">
                              Completed
                            </option>

                            <option value="Cancelled">
                              Cancelled
                            </option>
                          </select>
                        </td>

                        <td>
                          <div
                            style={{
                              display: "flex",
                              gap: "7px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            <button
                              type="button"
                              className="table-button"
                              onClick={() =>
                                openEditForm(session)
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="table-button delete-button"
                              onClick={() =>
                                handleDelete(session.id)
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="8"
                        className="empty-table"
                      >
                        No session records found.
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

export default Sessions;
