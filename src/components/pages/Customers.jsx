import { useEffect, useState } from "react";
import Sidebar from "../Sidebar";
import Topbar from "../Topbar";
import { supabase } from "../../lib/supabaseClient";

const getLocalDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState("Active");

  useEffect(() => {
    let cancelled = false;

    const loadCustomers = async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, contact, status, created_at")
        .order("id", { ascending: true });

      if (cancelled) return;
      setIsLoading(false);

      if (error) {
        console.error("Error loading customers:", error);
        setMessage(`Failed to load customers: ${error.message}`);
        return;
      }

      setCustomers(data || []);
      setMessage("");
    };

    loadCustomers();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .select("id, name, contact, status, created_at")
      .order("id", { ascending: true });

    setIsLoading(false);
    if (error) {
      console.error("Error loading customers:", error);
      setMessage(`Failed to load customers: ${error.message}`);
      return false;
    }

    setCustomers(data || []);
    return true;
  };

  const openAddForm = () => {
    setEditingCustomer(null);
    setName("");
    setContact("");
    setStatus("Active");
    setMessage("");
    setShowForm(true);
  };

  const openEditForm = (customer) => {
    setEditingCustomer(customer);
    setName(customer.name || "");
    setContact(customer.contact || "");
    setStatus(customer.status || "Active");
    setMessage("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCustomer(null);
    setName("");
    setContact("");
    setStatus("Active");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!name.trim() || !contact.trim()) {
      setMessage("Please enter the customer name and contact.");
      return;
    }

    const customerData = {
      name: name.trim(),
      contact: contact.trim(),
      status,
    };
    const result = editingCustomer
      ? await supabase.from("customers").update(customerData).eq("id", editingCustomer.id)
      : await supabase.from("customers").insert([customerData]);

    if (result.error) {
      console.error("Error saving customer:", result.error);
      setMessage(`Failed to ${editingCustomer ? "update" : "add"} customer: ${result.error.message}`);
      return;
    }

    closeForm();
    setMessage(editingCustomer ? "Customer updated successfully." : "Customer added successfully.");
    await fetchCustomers();
  };

  const handleDelete = async (customer) => {
    if (!window.confirm(`Are you sure you want to delete ${customer.name}?`)) return;

    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", customer.id);

    if (error) {
      console.error("Error deleting customer:", error);
      setMessage(`Failed to delete customer: ${error.message}`);
      return;
    }

    setMessage("Customer deleted successfully.");
    await fetchCustomers();
  };

  const searchText = search.trim().toLowerCase();
  const filteredCustomers = customers.filter((customer) => (
    String(customer.id).toLowerCase().includes(searchText) ||
    (customer.name || "").toLowerCase().includes(searchText) ||
    (customer.contact || "").toLowerCase().includes(searchText) ||
    (customer.status || "").toLowerCase().includes(searchText)
  ));
  const activeCustomers = customers.filter(
    (customer) => customer.status?.toLowerCase() === "active"
  ).length;
  const today = getLocalDateKey(new Date());
  const newToday = customers.filter((customer) => (
    customer.created_at && getLocalDateKey(customer.created_at) === today
  )).length;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-area">
        <Topbar />
        <main className="page-content">
          <div className="page-header">
            <div>
              <h1>Customers</h1>
              <p>Manage customer information and records.</p>
            </div>
            <div className="customer-page-actions">
              <button type="button" className="secondary-button" onClick={fetchCustomers} disabled={isLoading}>
                {isLoading ? "Loading…" : "Refresh"}
              </button>
              <button type="button" className="primary-button" onClick={openAddForm}>+ Add Customer</button>
            </div>
          </div>

          {message && (
            <div className={`form-message${message.startsWith("Failed") ? " error" : " success"}`} role="status">
              {message}
            </div>
          )}

          {showForm && (
            <section className="content-section customer-form-section">
              <div className="section-header">
                <div>
                  <h2>{editingCustomer ? "Edit customer" : "Add customer"}</h2>
                  <p>{editingCustomer ? "Update the customer details below." : "Add a customer to your records."}</p>
                </div>
              </div>
              <form className="customer-entry-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="customer-name">Name</label>
                  <input id="customer-name" type="text" value={name} placeholder="Enter customer name" onChange={(event) => setName(event.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="customer-contact">Contact</label>
                  <input id="customer-contact" type="text" value={contact} placeholder="Enter contact number" onChange={(event) => setContact(event.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="customer-status">Status</label>
                  <select id="customer-status" value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button type="button" className="secondary-button" onClick={closeForm}>Cancel</button>
                  <button type="submit" className="primary-button">{editingCustomer ? "Save changes" : "Add customer"}</button>
                </div>
              </form>
            </section>
          )}

          <section className="dashboard-cards customer-stat-cards" aria-label="Customer overview">
            <article className="dashboard-card">
              <div className="card-content"><div><span className="card-label">Total customers</span><h3>{isLoading ? "—" : customers.length}</h3></div><div className="card-icon blue" aria-hidden="true">♙</div></div>
              <p className="metric-caption">All registered customers</p>
            </article>
            <article className="dashboard-card">
              <div className="card-content"><div><span className="card-label">Active customers</span><h3>{isLoading ? "—" : activeCustomers}</h3></div><div className="card-icon green" aria-hidden="true">✓</div></div>
              <p className="metric-caption">Currently active</p>
            </article>
            <article className="dashboard-card">
              <div className="card-content"><div><span className="card-label">New today</span><h3>{isLoading ? "—" : newToday}</h3></div><div className="card-icon purple" aria-hidden="true">＋</div></div>
              <p className="metric-caption">Customers added today</p>
            </article>
          </section>

          <section className="content-section">
            <div className="section-header customer-records-header">
              <div>
                <h2>Customer records</h2>
                <p>{filteredCustomers.length} of {customers.length} customers</p>
              </div>
              <div className="customer-search">
                <input type="search" aria-label="Search customers" placeholder="Search by name, contact, or status" value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
            </div>
            <div className="table-container">
              <table className="data-table customer-table">
                <thead><tr><th>ID</th><th>Name</th><th>Contact</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan="6" className="empty-table">Loading customers…</td></tr>
                  ) : filteredCustomers.length ? filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td><span className="session-id">#{customer.id}</span></td>
                      <td><strong>{customer.name}</strong></td>
                      <td>{customer.contact || "—"}</td>
                      <td><span className={`status ${(customer.status || "").toLowerCase()}`}>{customer.status || "Unknown"}</span></td>
                      <td>{customer.created_at ? new Date(customer.created_at).toLocaleDateString() : "—"}</td>
                      <td><div className="table-actions"><button type="button" className="table-button" onClick={() => openEditForm(customer)}>Edit</button><button type="button" className="table-button delete-button" onClick={() => handleDelete(customer)}>Delete</button></div></td>
                    </tr>
                  )) : (
                    <tr><td colSpan="6" className="empty-table">{search ? "No customers match your search." : "No customer records yet. Add your first customer to get started."}</td></tr>
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

export default Customers;
