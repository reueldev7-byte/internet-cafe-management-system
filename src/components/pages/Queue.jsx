import { useEffect, useState } from "react";
import Sidebar from "../Sidebar";
import Topbar from "../Topbar";
import { supabase } from "../../lib/supabaseClient";

function Queue() {
  const [queue, setQueue] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingQueue, setEditingQueue] = useState(null);

  const [customerId, setCustomerId] = useState("");
  const [status, setStatus] = useState("Waiting");

  useEffect(() => {
    let isMounted = true;

    const initializeQueue = async () => {
      const queueResult = await supabase
        .from("queue")
        .select("*")
        .order("position", { ascending: true });

      const customerResult = await supabase
        .from("customers")
        .select("id, name")
        .order("id", { ascending: true });

      if (!isMounted) {
        return;
      }

      if (queueResult.error) {
        console.error(
          "Error loading queue:",
          queueResult.error
        );

        setMessage(
          `Failed to load queue: ${queueResult.error.message}`
        );
      } else {
        setQueue(queueResult.data || []);
      }

      if (customerResult.error) {
        console.error(
          "Error loading customers:",
          customerResult.error
        );

        setMessage(
          `Failed to load customers: ${customerResult.error.message}`
        );
      } else {
        setCustomers(customerResult.data || []);
      }
    };

    initializeQueue();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadQueue = async () => {
    const { data, error } = await supabase
      .from("queue")
      .select("*")
      .order("position", { ascending: true });

    if (error) {
      console.error(
        "Error loading queue:",
        error
      );

      setMessage(
        `Failed to load queue: ${error.message}`
      );

      return;
    }

    setQueue(data || []);
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

  const getNextPosition = () => {
    if (queue.length === 0) {
      return 1;
    }

    const positions = queue.map(
      (item) => Number(item.position) || 0
    );

    return Math.max(...positions) + 1;
  };

  const openAddForm = () => {
    setEditingQueue(null);
    setCustomerId("");
    setStatus("Waiting");
    setMessage("");
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setEditingQueue(item);
    setCustomerId(String(item.customer_id));
    setStatus(item.status || "Waiting");
    setMessage("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingQueue(null);
    setCustomerId("");
    setStatus("Waiting");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!customerId) {
      setMessage("Please select a customer.");
      return;
    }

    if (editingQueue) {
      const { error } = await supabase
        .from("queue")
        .update({
          customer_id: Number(customerId),
          status: status,
        })
        .eq("id", editingQueue.id);

      if (error) {
        console.error(
          "Error updating queue:",
          error
        );

        setMessage(
          `Failed to update queue: ${error.message}`
        );

        return;
      }

      setMessage(
        "Queue entry updated successfully."
      );
    } else {
      const position = getNextPosition();

      const { error } = await supabase
        .from("queue")
        .insert([
          {
            customer_id: Number(customerId),
            position: position,
            status: "Waiting",
          },
        ]);

      if (error) {
        console.error(
          "Error adding to queue:",
          error
        );

        setMessage(
          `Failed to add to queue: ${error.message}`
        );

        return;
      }

      setMessage(
        "Customer added to queue successfully."
      );
    }

    closeForm();
    await loadQueue();
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this customer from the queue?"
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("queue")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(
        "Error deleting queue entry:",
        error
      );

      setMessage(
        `Failed to delete queue entry: ${error.message}`
      );

      return;
    }

    setMessage(
      "Customer removed from queue."
    );

    await loadQueue();
  };

  const handleStatusChange = async (
    item,
    newStatus
  ) => {
    const { error } = await supabase
      .from("queue")
      .update({
        status: newStatus,
      })
      .eq("id", item.id);

    if (error) {
      console.error(
        "Error updating queue status:",
        error
      );

      setMessage(
        `Failed to update status: ${error.message}`
      );

      return;
    }

    setMessage("Queue status updated.");

    await loadQueue();
  };

  const filteredQueue = queue.filter((item) => {
    const customerName = getCustomerName(
      item.customer_id
    );

    const searchText = search.toLowerCase();

    return (
      String(item.id)
        .toLowerCase()
        .includes(searchText) ||
      String(item.customer_id)
        .toLowerCase()
        .includes(searchText) ||
      String(item.position)
        .toLowerCase()
        .includes(searchText) ||
      customerName
        .toLowerCase()
        .includes(searchText) ||
      (item.status || "")
        .toLowerCase()
        .includes(searchText)
    );
  });

  const waitingCustomers = queue.filter(
    (item) =>
      (item.status || "").toLowerCase() ===
      "waiting"
  ).length;

  const availablePCs = 12;

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="main-area">
        <Topbar />

        <main className="page-content">
          <div className="page-header">
            <div>
              <h1>Queue</h1>

              <p>
                Manage customers waiting for an
                available PC.
              </p>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={openAddForm}
            >
              + Add to Queue
            </button>
          </div>

          {message && (
            <div className="form-message">
              {message}
            </div>
          )}

          {showForm && (
            <section className="content-section queue-form-section">
              <div className="section-header">
                <div>
                  <h2>
                    {editingQueue
                      ? "Edit Queue Entry"
                      : "Add Customer to Queue"}
                  </h2>

                  <p>
                    {editingQueue
                      ? "Update the queue entry."
                      : "Select a customer to add to the waiting queue."}
                  </p>
                </div>
              </div>

              <form
                className="queue-form"
                onSubmit={handleSubmit}
              >
                <div className="queue-form-grid">
                  <div className="form-group">
                    <label htmlFor="queue-customer">
                      Customer
                    </label>

                    <select
                      id="queue-customer"
                      value={customerId}
                      onChange={(event) =>
                        setCustomerId(
                          event.target.value
                        )
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
                    <label htmlFor="queue-status">
                      Status
                    </label>

                    <select
                      id="queue-status"
                      value={status}
                      onChange={(event) =>
                        setStatus(
                          event.target.value
                        )
                      }
                    >
                      <option value="Waiting">
                        Waiting
                      </option>

                      <option value="Serving">
                        Serving
                      </option>

                      <option value="Completed">
                        Completed
                      </option>

                      <option value="Cancelled">
                        Cancelled
                      </option>
                    </select>
                  </div>
                </div>

                <div className="queue-form-actions">
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
                    {editingQueue
                      ? "Update Queue"
                      : "Add to Queue"}
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="dashboard-cards queue-cards">
            <div className="dashboard-card">
              <div className="card-content">
                <div>
                  <span className="card-label">
                    Waiting Customers
                  </span>

                  <h3>
                    {waitingCustomers}
                  </h3>
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

                    <path d="M12 7v5l3 2" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-content">
                <div>
                  <span className="card-label">
                    Available PCs
                  </span>

                  <h3>
                    {availablePCs}
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
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="13"
                      rx="2"
                    />

                    <path d="M8 21h8" />
                    <path d="M12 17v4" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-content">
                <div>
                  <span className="card-label">
                    Total Queue Entries
                  </span>

                  <h3>
                    {queue.length}
                  </h3>
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
                    <path d="M8 6h13" />
                    <path d="M8 12h13" />
                    <path d="M8 18h13" />
                    <path d="M3 6h.01" />
                    <path d="M3 12h.01" />
                    <path d="M3 18h.01" />
                  </svg>
                </div>
              </div>
            </div>
          </section>

          <section className="content-section">
            <div className="section-header queue-records-header">
              <div>
                <h2>Waiting Queue</h2>

                <p>
                  Customers are served using FIFO
                  order.
                </p>
              </div>

              <div className="queue-search">
                <input
                  type="text"
                  placeholder="Search queue..."
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Position</th>
                    <th>Customer</th>
                    <th>Customer ID</th>
                    <th>Joined At</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredQueue.length > 0 ? (
                    filteredQueue.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>
                            #{item.position}
                          </strong>
                        </td>

                        <td>
                          {getCustomerName(
                            item.customer_id
                          )}
                        </td>

                        <td>
                          {item.customer_id}
                        </td>

                        <td>
                          {item.joined_at
                            ? new Date(
                                item.joined_at
                              ).toLocaleString()
                            : "-"}
                        </td>

                        <td>
                          <select
                            className={`queue-status-select ${
                              item.status
                                ? item.status.toLowerCase()
                                : ""
                            }`}
                            value={
                              item.status ||
                              "Waiting"
                            }
                            onChange={(event) =>
                              handleStatusChange(
                                item,
                                event.target.value
                              )
                            }
                          >
                            <option value="Waiting">
                              Waiting
                            </option>

                            <option value="Serving">
                              Serving
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
                          <div className="queue-actions">
                            <button
                              type="button"
                              className="table-button"
                              onClick={() =>
                                openEditForm(item)
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="table-button delete-button"
                              onClick={() =>
                                handleDelete(
                                  item.id
                                )
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
                        colSpan="6"
                        className="empty-table"
                      >
                        No customers in the
                        queue.
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

export default Queue;