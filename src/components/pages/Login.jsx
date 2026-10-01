import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    const enteredUsername = username.trim();
    const enteredPassword = password;

    if (!enteredUsername || !enteredPassword) {
      setLoginMessage("Please enter your username and password.");
      return;
    }

    setLoading(true);
    setLoginMessage("");

    try {
      // Convert username to the email used by Supabase Auth
      const usernameEmailMap = {
        admin1: "reueldev7@gmail.com",
        admin2: "rossa2@gmail.com",
        staff: "juanstaff3@gmail.com",
      };

      const email = enteredUsername.includes("@")
        ? enteredUsername
        : usernameEmailMap[enteredUsername.toLowerCase()];

      if (!email) {
        setLoginMessage("Username not found.");
        setLoading(false);
        return;
      }

      console.log("Trying login with:", email);

      // Login through Supabase Authentication
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email,
          password: enteredPassword,
        });

      if (authError) {
        console.error("Supabase login error:", authError);

        if (
          authError.message
            .toLowerCase()
            .includes("invalid login credentials")
        ) {
          setLoginMessage("Invalid username or password.");
        } else if (
          authError.message
            .toLowerCase()
            .includes("email not confirmed")
        ) {
          setLoginMessage(
            "Your account has not been confirmed yet."
          );
        } else {
          setLoginMessage(authError.message);
        }

        setLoading(false);
        return;
      }

      // Make sure Supabase returned a user
      if (!authData || !authData.user) {
        setLoginMessage(
          "Login failed. No user account was found."
        );

        setLoading(false);
        return;
      }

      const user = authData.user;

      console.log("Authenticated user:", user);

      // Find the user's profile
      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("id, username, full_name, role")
          .eq("id", user.id)
          .maybeSingle();

      if (profileError) {
        console.error(
          "Profile lookup error:",
          profileError
        );

        await supabase.auth.signOut();

        setLoginMessage(
          "Unable to load your profile. Please check the profiles table."
        );

        setLoading(false);
        return;
      }

      // Auth account exists but no matching profile
      if (!profile) {
        console.error(
          "No profile found for user:",
          user.id
        );

        await supabase.auth.signOut();

        setLoginMessage(
          "Your account exists, but your profile was not found."
        );

        setLoading(false);
        return;
      }

      console.log("User profile:", profile);

      // Check if the user's role is valid
      const validRoles = [
        "admin_editor",
        "admin_viewer",
        "staff",
      ];

      if (!validRoles.includes(profile.role)) {
        console.error(
          "Invalid user role:",
          profile.role
        );

        await supabase.auth.signOut();

        setLoginMessage(
          "Your account does not have a valid role."
        );

        setLoading(false);
        return;
      }

      // Save user information for role-based access
      localStorage.setItem(
        "userRole",
        profile.role
      );

      localStorage.setItem(
        "username",
        profile.username
      );

      localStorage.setItem(
        "fullName",
        profile.full_name
      );

      // Login successful
      console.log(
        "Login successful:",
        profile.username,
        profile.role
      );

      setLoginMessage(
        `Welcome, ${profile.full_name}!`
      );

      // Small delay so the welcome message can appear
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    } catch (error) {
      console.error(
        "Unexpected login error:",
        error
      );

      setLoginMessage(
        "Something went wrong while logging in."
      );

      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <img
        src="/images/mp.gif"
        alt="Internet Café Background"
        className="background-gif"
      />

      <div className="background-overlay"></div>

      <div className="login-card">
        <div className="logo">
          <div className="logo-screen"></div>
          <div className="logo-stand"></div>
        </div>

        <h1>Internet Café</h1>

        <p className="system-title">
          MANAGEMENT SYSTEM
        </p>

        <p className="welcome">
          Welcome back
        </p>

        <form onSubmit={handleLogin}>
          {/* USERNAME */}
          <div className="input-group">
            <label htmlFor="username">
              Username
            </label>

            <div className="input-box">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 21a8 8 0 0 0-16 0" />

                <circle
                  cx="12"
                  cy="7"
                  r="4"
                />
              </svg>

              <input
                type="text"
                id="username"
                name="username"
                placeholder="Enter your username"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setLoginMessage("");
                }}
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div className="input-group">
            <label htmlFor="password">
              Password
            </label>

            <div className="input-box">
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
                  y="11"
                  width="18"
                  height="10"
                  rx="2"
                />

                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>

              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setLoginMessage("");
                }}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {/* REMEMBER / FORGOT PASSWORD */}
          <div className="login-options">
            <label className="remember">
              <input
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={(event) =>
                  setRemember(event.target.checked)
                }
              />

              <span>
                Remember me
              </span>
            </label>

            <a
              href="#"
              className="forgot"
              onClick={(event) =>
                event.preventDefault()
              }
            >
              Forgot Password?
            </a>
          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>

          {/* LOGIN MESSAGE */}
          {loginMessage && (
            <p className="login-message">
              {loginMessage}
            </p>
          )}
        </form>

        <p className="register">
          Don't have an account?
          <span>
            {" "}Contact Administrator
          </span>
        </p>
      </div>
    </main>
  );
}

export default Login;