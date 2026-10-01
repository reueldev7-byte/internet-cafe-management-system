import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Sidebar from "../Sidebar";
import Topbar from "../Topbar";

function PCManagement() {
  const [computers, setComputers] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingComputer, setEditingComputer] = useState(null);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    pc_number: "",
    status: "Available",
    rate_per_hour: "",
    specifications: "",
  });

  useEffect(() => {
    let cancelled = false;

    const loadComputers = async () => {
      const { data, error } = await supabase
        .from("computers")
        .select("*")
        .order("id", { ascending: true });

      if (cancelled) {
        return;
      }

      if (error) {
        console.error("Error fetching computers:", error);
        setMessage(`Failed to load computers: ${error.message}`);
        return;
      }

      setComputers(data || []);
    };

    loadComputers();

    return () => {
      cancelled = true;
    };
  }, []);

  const fetchComputers = async () => {
    const { data, error } = await supabase
      .from("computers")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.error("Error fetching computers:", error);
      setMessage(`Failed to load computers: ${error.message}`);
      return;
    }

    setComputers(data || []);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openAddForm = () => {
    setEditingComputer(null);

    setFormData({
      pc_number: "",
      status: "Available",
      rate_per_hour: "",
      specifications: "",
    });

    setMessage("");
    setShowForm(true);
  };

  const openEditForm = (computer) => {
    setEditingComputer(computer);

    setFormData({
      pc_number: computer.pc_number || "",
      status: computer.status || "Available",
      rate_per_hour: computer.rate_per_hour ?? "",
      specifications: computer.specifications || "",
    });

    setMessage("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingComputer(null);
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.pc_number.trim()) {
      setMessage("Please enter a PC number.");
      return;
    }

    if (
      formData.rate_per_hour === "" ||
      Number(formData.rate_per_hour) < 0
    ) {
      setMessage("Please enter a valid hourly rate.");
      return;
    }

    const computerData = {
      pc_number: formData.pc_number.trim(),
      status: formData.status,
      rate_per_hour: Number(formData.rate_per_hour),
      specifications: formData.specifications.trim(),
    };

    if (editingComputer) {
      const { error } = await supabase
        .from("computers")
        .update(computerData)
        .eq("id", editingComputer.id);

      if (error) {
        console.error("Error updating computer:", error);
        setMessage(`Failed to update computer: ${error.message}`);
        return;
      }

      setMessage("Computer updated successfully.");
    } else {
      const { error } = await supabase
        .from("computers")
        .insert([computerData]);

      if (error) {
        console.error("Error adding computer:", error);
        setMessage(`Failed to add computer: ${error.message}`);
        return;
      }

      setMessage("Computer added successfully.");
    }

    await fetchComputers();

    setTimeout(() => {
      closeForm();
    }, 700);
  };

  const handleDelete = async (computer) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${computer.pc_number}?`
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("computers")
      .delete()
      .eq("id", computer.id);

    if (error) {
      console.error("Error deleting computer:", error);
      setMessage(`Failed to delete computer: ${error.message}`);
      return;
    }

    setMessage("Computer deleted successfully.");

    await fetchComputers();
  };

  const filteredComputers = computers.filter((computer) =>
    computer.pc_number
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalPCs = computers.length;

  const availablePCs = computers.filter(
    (computer) =>
      computer.status?.toLowerCase() === "available"
  ).length;

  const occupiedPCs = computers.filter(
    (computer) =>
      computer.status?.toLowerCase() === "occupied"
  ).length;

  const maintenancePCs = computers.filter(
    (computer) =>
      computer.status?.toLowerCase() === "maintenance"
  ).length;

  const getStatusClass = (status) => {
    const normalizedStatus = status?.toLowerCase();

    if (normalizedStatus === "available") {
      return "status available";
    }

    if (normalizedStatus === "occupied") {
      return "status occupied";
    }

    if (normalizedStatus === "maintenance") {
      return "status maintenance";
    }

    return "status";
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="main-area">
        <Topbar />

        <main className="page-content">
          <div className="page-header">
            <div>
              <h1>PC Management</h1>
              <p>Manage computers and their current status.</p>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={openAddForm}
            >
              + Add Computer
            </button>
          </div>

          {message && !showForm && (
            <p className="form-message">{message}</p>
          )}

          <section className="dashboard-cards">
            <div className="dashboard-card">
              <div className="card-content">
                <div>
                  <span className="card-label">Total PCs</span>
                  <h3>{totalPCs}</h3>
                </div>

                <div className="card-icon blue">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="12"
                      rx="2"
                    />
                    <path d="M8 20h8" />
                    <path d="M12 16v4" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-content">
                <div>
                  <span className="card-label">Available</span>
                  <h3>{availablePCs}</h3>
                </div>

                <div className="card-icon green">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-content">
                <div>
                  <span className="card-label">Occupied</span>
                  <h3>{occupiedPCs}</h3>
                </div>

                <div className="card-icon orange">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M5 21a7 7 0 0 1 14 0" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-content">
                <div>
                  <span className="card-label">Maintenance</span>
                  <h3>{maintenancePCs}</h3>
                </div>

                <div className="card-icon purple">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 3L4 7v5c0 5 3.5 8 8 9 4.5-1 8-4 8-9V7l-8-4Z" />
                    <path d="M12 8v4" />
                    <circle cx="12" cy="15" r="0.5" />
                  </svg>
                </div>
              </div>
            </div>
          </section>

          {showForm && (
            <section className="content-section">
              <div className="section-header">
                <div>
                  <h2>
                    {editingComputer
                      ? "Edit Computer"
                      : "Add Computer"}
                  </h2>

                  <p>
                    {editingComputer
                      ? "Update the computer information."
                      : "Add a new computer to the system."}
                  </p>
                </div>
              </div>

              <form
                className="session-form"
                onSubmit={handleSubmit}
              >
                <div className="form-group">
                  <label htmlFor="pc_number">
                    PC Number
                  </label>

                  <input
                    type="text"
                    id="pc_number"
                    name="pc_number"
                    placeholder="Example: PC-01"
                    value={formData.pc_number}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="status">
                    Status
                  </label>

                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="Available">
                      Available
                    </option>

                    <option value="Occupied">
                      Occupied
                    </option>

                    <option value="Maintenance">
                      Maintenance
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="rate_per_hour">
                    Rate Per Hour
                  </label>

                  <input
                    type="number"
                    id="rate_per_hour"
                    name="rate_per_hour"
                    placeholder="Example: 30"
                    min="0"
                    step="0.01"
                    value={formData.rate_per_hour}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="specifications">
                    Specifications
                  </label>

                  <input
                    type="text"
                    id="specifications"
                    name="specifications"
                    placeholder="Example: Core i5, 8GB RAM"
                    value={formData.specifications}
                    onChange={handleInputChange}
                  />
                </div>

                {message && (
                  <p className="form-message">
                    {message}
                  </p>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                  }}
                >
                  <button
                    type="submit"
                    className="primary-button"
                  >
                    {editingComputer
                      ? "Update Computer"
                      : "Add Computer"}
                  </button>

                  <button
                    type="button"
                    className="table-button"
                    onClick={closeForm}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="content-section">
            <div className="section-header">
              <div>
                <h2>Computer List</h2>

                <p>
                  Current status of all computers.
                </p>
              </div>

              <input
                type="text"
                placeholder="Search PC..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                style={{
                  height: "38px",
                  padding: "0 12px",
                  border: "1px solid #26345b",
                  borderRadius: "8px",
                  background: "#070d20",
                  color: "#f7f7fb",
                  outline: "none",
                }}
              />
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Computer</th>
                    <th>Status</th>
                    <th>Rate / Hour</th>
                    <th>Specifications</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredComputers.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        style={{
                          textAlign: "center",
                          padding: "30px",
                          color: "#aeb6ce",
                        }}
                      >
                        No computers found.
                      </td>
                    </tr>
                  ) : (
                    filteredComputers.map((computer) => (
                      <tr key={computer.id}>
                        <td>{computer.pc_number}</td>

                        <td>
                          <span
                            className={getStatusClass(
                              computer.status
                            )}
                          >
                            {computer.status}
                          </span>
                        </td>

                        <td>
                          ₱
                          {Number(
                            computer.rate_per_hour || 0
                          ).toFixed(2)}
                        </td>

                        <td>
                          {computer.specifications || "-"}
                        </td>

                        <td>
                          <div
                            style={{
                              display: "flex",
                              gap: "7px",
                            }}
                          >
                            <button
                              type="button"
                              className="table-button"
                              onClick={() =>
                                openEditForm(computer)
                              }
                            >
                              Manage
                            </button>

                            <button
                              type="button"
                              className="table-button"
                              onClick={() =>
                                handleDelete(computer)
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
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

export default PCManagement;