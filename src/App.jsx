import "./App.css";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./components/pages/Login";
import Dashboard from "./components/pages/Dashboard";
import PCManagement from "./components/pages/PCManagement";
import Customers from "./components/pages/Customers";
import Sessions from "./components/pages/Sessions";
import Queue from "./components/pages/Queue";
import Transactions from "./components/pages/Transactions";
import Reports from "./components/pages/Reports";
import StartSession from "./components/pages/StartSession";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/pc-management"
          element={<PCManagement />}
        />

        <Route
          path="/customers"
          element={<Customers />}
        />

        <Route
          path="/sessions"
          element={<Sessions />}
        />

        <Route
          path="/queue"
          element={<Queue />}
        />

        <Route
          path="/transactions"
          element={<Transactions />}
        />

        <Route
          path="/reports"
          element={<Reports />}
        />

        <Route
          path="/start-session"
          element={<StartSession />}
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;