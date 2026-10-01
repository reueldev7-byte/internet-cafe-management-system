import { useEffect, useState } from "react";
import Sidebar from "../Sidebar";
import Topbar from "../Topbar";
import { supabase } from "../../lib/supabaseClient";

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const [sessionId, setSessionId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  useEffect(() => {
    let isMounted = true;

    const initializeTransactions = async () => {
      const transactionsResult = await supabase
        .from("transactions")
        .select("*")
        .order("id", { ascending: false });

      const sessionsResult = await supabase
        .from("sessions")
        .select(
          "id, customer_id, computer_id, start_time, end_time, total_cost, status"
        )
        .order("id", { ascending: false });

      if (!isMounted) {
        return;
      }

      if (transactionsResult.error) {
        console.error(
          "Error loading transactions:",
          transactionsResult.error
        );

        setMessage(
          `Failed to load transactions: ${transactionsResult.error.message}`
        );
      } else {
        setTransactions(transactionsResult.data || []);
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
    };

    initializeTransactions();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadTransactions = async () => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Error loading transactions:", error);

      setMessage(
        `Failed to load transactions: ${error.message}`
      );

      return;
    }

    setTransactions(data || []);
  };

  const getSession = (id) => {
    return sessions.find(
      (session) => String(session.id) === String(id)
    );
  };

  const getCustomerId = (sessionIdValue) => {
    const session = getSession(sessionIdValue);

    if (session) {
      return session.customer_id;
    }

    return "-";
  };

  const getComputerId = (sessionIdValue) => {
    const session = getSession(sessionIdValue);

    if (session) {
      return session.computer_id;
    }

    return "-";
  };

  const openAddForm = () => {
    setEditingTransaction(null);
    setSessionId("");
    setAmount("");
    setPaymentMethod("Cash");
    setMessage("");
    setShowForm(true);
  };

  const openEditForm = (transaction) => {
    setEditingTransaction(transaction);

    setSessionId(String(transaction.session_id || ""));

    setAmount(
      transaction.amount !== null &&
      transaction.amount !== undefined
        ? String(transaction.amount)
        : ""
    );

    setPaymentMethod(
      transaction.payment_method || "Cash"
    );

    setMessage("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingTransaction(null);
    setSessionId("");
    setAmount("");
    setPaymentMethod("Cash");
  };

  const handleSessionChange = (event) => {
    const selectedSessionId = event.target.value;

    setSessionId(selectedSessionId);

    const selectedSession = sessions.find(
      (session) =>
        String(session.id) === String(selectedSessionId)
    );

    if (selectedSession) {
      setAmount(
        selectedSession.total_cost !== null &&
        selectedSession.total_cost !== undefined
          ? String(selectedSession.total_cost)
          : ""
      );
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!sessionId) {
      setMessage("Please select a session.");
      return;
    }

    if (!amount) {
      setMessage("Please enter the transaction amount.");
      return;
    }

    const numericAmount = Number(amount);

    if (Number.isNaN(numericAmount) || numericAmount < 0) {
      setMessage("Please enter a valid transaction amount.");
      return;
    }

    const transactionData = {
      session_id: Number(sessionId),
      amount: numericAmount,
      payment_method: paymentMethod,
    };

    if (editingTransaction) {
      const { error } = await supabase
        .from("transactions")
        .update(transactionData)
        .eq("id", editingTransaction.id);

      if (error) {
        console.error(
          "Error updating transaction:",
          error
        );

        setMessage(
          `Failed to update transaction: ${error.message}`
        );

        return;
      }

      setMessage("Transaction updated successfully.");
    } else {
      const { error } = await supabase
        .from("transactions")
        .insert([transactionData]);

      if (error) {
        console.error(
          "Error adding transaction:",
          error
        );

        setMessage(
          `Failed to add transaction: ${error.message}`
        );

        return;
      }

      setMessage("Transaction added successfully.");
    }

    closeForm();
    await loadTransactions();
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(
        "Error deleting transaction:",
        error
      );

      setMessage(
        `Failed to delete transaction: ${error.message}`
      );

      return;
    }

    setMessage("Transaction deleted successfully.");
    await loadTransactions();
  };

  const filteredTransactions = transactions.filter(
    (transaction) => {
      const session = getSession(
        transaction.session_id
      );

      const searchText = search.toLowerCase();

      return (
        String(transaction.id)
          .toLowerCase()
          .includes(searchText) ||
        String(transaction.session_id)
          .toLowerCase()
          .includes(searchText) ||
        String(transaction.amount)
          .toLowerCase()
          .includes(searchText) ||
        (transaction.payment_method || "")
          .toLowerCase()
          .includes(searchText) ||
        String(
          session?.customer_id || ""
        )
          .toLowerCase()
          .includes(searchText) ||
        String(
          session?.computer_id || ""
        )
          .toLowerCase()
          .includes(searchText)
      );
    }
  );

  const totalTransactions = transactions.length;

  const totalAmount = transactions.reduce(
    (total, transaction) =>
      total + (Number(transaction.amount) || 0),
    0
  );

  const cashTransactions = transactions.filter(
    (transaction) =>
      (transaction.payment_method || "").toLowerCase() ===
      "cash"
  ).length;

  const digitalTransactions = transactions.filter(
    (transaction) => {
      const method = (
        transaction.payment_method || ""
      ).toLowerCase();

      return (
        method === "gcash" ||
        method === "maya" ||
        method === "card" ||
        method === "online"
      );
    }
  ).length;

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="main-area">
        <Topbar />

        <main className="page-content">
          <div className="page-header">
            <div>
              <h1>Transactions</h1>

              <p>
                Manage payments and transaction records.
              </p>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={openAddForm}
            >
              + Add Transaction
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
                    {editingTransaction
                      ? "Edit Transaction"
                      : "Add New Transaction"}
                  </h2>

                  <p>
                    {editingTransaction
                      ? "Update the selected transaction."
                      : "Record a payment for a customer session."}
                  </p>
                </div>
              </div>

              <form
                className="session-form"
                onSubmit={handleSubmit}
              >
                <div className="form-group">
                  <label htmlFor="transaction-session">
                    Session
                  </label>

                  <select
                    id="transaction-session"
                    value={sessionId}
                    onChange={handleSessionChange}
                  >
                    <option value="">
                      Select session
                    </option>

                    {sessions.map((session) => (
                      <option
                        key={session.id}
                        value={session.id}
                      >
                        Session #{session.id} — Customer #
                        {session.customer_id} — PC #
                        {session.computer_id}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="transaction-amount">
                    Amount
                  </label>

                  <input
                    id="transaction-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(event) =>
                      setAmount(event.target.value)
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="transaction-payment">
                    Payment Method
                  </label>

                  <select
                    id="transaction-payment"
                    value={paymentMethod}
                    onChange={(event) =>
                      setPaymentMethod(
                        event.target.value
                      )
                    }
                  >
                    <option value="Cash">
                      Cash
                    </option>

                    <option value="GCash">
                      GCash
                    </option>

                    <option value="Maya">
                      Maya
                    </option>

                    <option value="Card">
                      Card
                    </option>

                    <option value="Online">
                      Online
                    </option>
                  </select>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                    marginTop: "4px",
                  }}
                >
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
                    {editingTransaction
                      ? "Update Transaction"
                      : "Add Transaction"}
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
                    Total Transactions
                  </span>

                  <h3>{totalTransactions}</h3>
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
                    Total Amount
                  </span>

                  <h3>
                    ₱{totalAmount.toFixed(2)}
                  </h3>
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
                    <path d="M12 2v20" />

                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-content">
                <div>
                  <span className="card-label">
                    Cash Payments
                  </span>

                  <h3>{cashTransactions}</h3>
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
                    <rect
                      x="3"
                      y="6"
                      width="18"
                      height="12"
                      rx="2"
                    />

                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                    />

                    <path d="M3 10h3" />
                    <path d="M18 10h3" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-content">
                <div>
                  <span className="card-label">
                    Digital Payments
                  </span>

                  <h3>{digitalTransactions}</h3>
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
                    <rect
                      x="5"
                      y="2"
                      width="14"
                      height="20"
                      rx="2"
                    />

                    <path d="M9 18h6" />
                  </svg>
                </div>
              </div>
            </div>
          </section>

          <section className="content-section">
            <div className="section-header">
              <div>
                <h2>Transaction Records</h2>

                <p>
                  View, search, update, and delete payment
                  records.
                </p>
              </div>

              <div className="customer-search">
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Session ID</th>
                    <th>Customer ID</th>
                    <th>Computer ID</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                    <th>Created At</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map(
                      (transaction) => (
                        <tr key={transaction.id}>
                          <td>
                            <strong>
                              #{transaction.id}
                            </strong>
                          </td>

                          <td>
                            #{transaction.session_id}
                          </td>

                          <td>
                            {getCustomerId(
                              transaction.session_id
                            )}
                          </td>

                          <td>
                            {getComputerId(
                              transaction.session_id
                            )}
                          </td>

                          <td>
                            ₱
                            {Number(
                              transaction.amount || 0
                            ).toFixed(2)}
                          </td>

                          <td>
                            <span className="status active">
                              {transaction.payment_method ||
                                "-"}
                            </span>
                          </td>

                          <td>
                            {transaction.created_at
                              ? new Date(
                                  transaction.created_at
                                ).toLocaleString()
                              : "-"}
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
                                  openEditForm(
                                    transaction
                                  )
                                }
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="table-button delete-button"
                                onClick={() =>
                                  handleDelete(
                                    transaction.id
                                  )
                                }
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )
                  ) : (
                    <tr>
                      <td
                        colSpan="8"
                        className="empty-table"
                      >
                        No transaction records found.
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

export default Transactions;