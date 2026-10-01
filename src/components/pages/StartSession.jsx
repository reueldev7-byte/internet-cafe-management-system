import { useState } from "react";
import Sidebar from "../Sidebar";
import Topbar from "../Topbar";

function StartSession() {
  const [customer, setCustomer] = useState("");
  const [computer, setComputer] = useState("");
  const [message, setMessage] = useState("");

  const handleStartSession = (event) => {
    event.preventDefault();

    if (!customer || !computer) {
      setMessage(
        "Please select a customer and computer."
      );
      return;
    }

    setMessage(
      `Session started for ${customer} on ${computer}.`
    );
  };

  return (
    <div className="dashboard-layout">

      <Sidebar />

      <div className="main-area">

        <Topbar />

        <main className="page-content">

          <div className="page-header">

            <div>
              <h1>Start Session</h1>

              <p>
                Start a new computer session for a customer.
              </p>
            </div>

          </div>

          <section className="session-form">

            <form onSubmit={handleStartSession}>

              <div className="form-group">

                <label htmlFor="customer">
                  Customer
                </label>

                <select
                  id="customer"
                  value={customer}
                  onChange={(event) => {
                    setCustomer(event.target.value);
                    setMessage("");
                  }}
                >
                  <option value="">
                    Select Customer
                  </option>

                  <option value="Kevin Cruz">
                    Kevin Cruz
                  </option>

                  <option value="Sarah Reyes">
                    Sarah Reyes
                  </option>

                  <option value="Daniel Garcia">
                    Daniel Garcia
                  </option>

                </select>

              </div>

              <div className="form-group">

                <label htmlFor="computer">
                  Computer
                </label>

                <select
                  id="computer"
                  value={computer}
                  onChange={(event) => {
                    setComputer(event.target.value);
                    setMessage("");
                  }}
                >
                  <option value="">
                    Select Available PC
                  </option>

                  <option value="PC-01">
                    PC-01
                  </option>

                  <option value="PC-02">
                    PC-02
                  </option>

                  <option value="PC-03">
                    PC-03
                  </option>

                </select>

              </div>

              <div className="form-group">

                <label htmlFor="rate">
                  Rate per Hour
                </label>

                <input
                  type="text"
                  id="rate"
                  value="₱30.00"
                  readOnly
                />

              </div>

              <button
                type="submit"
                className="primary-button"
              >
                Start Session
              </button>

              {message && (
                <p
                  className={`form-message ${
                    message.startsWith("Session started")
                      ? "success"
                      : "error"
                  }`}
                >
                  {message}
                </p>
              )}

            </form>

          </section>

        </main>

      </div>

    </div>
  );
}

export default StartSession;