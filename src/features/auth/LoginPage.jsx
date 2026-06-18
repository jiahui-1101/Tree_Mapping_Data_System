import { useState } from "react";
import { DEMO_USERS, ROLE_OPTIONS } from "../../config/demoUsers.js";
import { ROLE } from "../../models.js";
import { authenticate, createGuestVisitor } from "../../services/mockAuthService.js";
import Modal from "../../components/common/Modal.jsx";

export default function LoginPage({ onLogin }) {
  const [role, setRole] = useState(ROLE.ADMIN);
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [registerOpen, setRegisterOpen] = useState(false);

  const demo = DEMO_USERS[role];
  const submit = (event) => {
    event.preventDefault();
    const result = authenticate(role, id, password);
    if (!result.ok) return setError(result.message);
    onLogin(result.user);
  };

  return (
    <main className="auth-screen">
      <section className="auth-hero">
        <div className="auth-brand">
          <span className="brand-mark">♣</span>
          <div><strong>TBJ System</strong><small>Taman Botani Johor</small></div>
        </div>
        <div className="auth-copy">
          <h1>Smart Tree <em>Mapping</em><br />& Management</h1>
          <p>An AI-driven botanical garden management platform for field rangers, administrators, visitors, and IT support.</p>
          <div className="auth-stats">
            <span><strong>1,247</strong><small>Trees monitored</small></span>
            <span><strong>32ha</strong><small>Garden area</small></span>
            <span><strong>4</strong><small>Active rangers</small></span>
          </div>
        </div>
      </section>
      <section className="auth-panel">
        <form onSubmit={submit} className="auth-form">
          <h2>Sign In</h2>
          <p>Select your role to continue</p>
          <div className="role-tabs">
            {ROLE_OPTIONS.map((option) => (
              <button
                type="button"
                key={option.id}
                className={option.id === role ? "active" : ""}
                onClick={() => {
                  setRole(option.id);
                  setId("");
                  setPassword("");
                  setError("");
                }}
              >
                <span>{option.icon}</span>{option.label}
              </button>
            ))}
          </div>
          <label className="field-label">{role === ROLE.VISITOR ? "Email" : "Staff ID"}</label>
          <input
            value={id}
            onChange={(event) => setId(event.target.value)}
            placeholder={role === ROLE.VISITOR ? "visitor@gmail.com" : demo.id}
          />
          <label className="field-label">Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
          />
          <small className="demo-hint">Demo: {demo.id} / {demo.password}</small>
          {error && <p className="form-error">{error}</p>}
          <button className="button button-block" type="submit">Sign In →</button>
          {role === ROLE.VISITOR && (
            <button className="text-button" type="button" onClick={() => setRegisterOpen(true)}>
              New visitor? Register to save your collection
            </button>
          )}
          <div className="auth-divider">or</div>
          <button className="button button-outline button-block" type="button" onClick={() => onLogin(createGuestVisitor())}>
            Continue as Guest Visitor
          </button>
        </form>
      </section>
      {registerOpen && (
        <Modal title="Create Visitor Account" onClose={() => setRegisterOpen(false)}>
          <p className="muted">Registration is represented as a UI mock. A backend account service will be connected later.</p>
          <label className="field-label">Name</label><input placeholder="Your name" />
          <label className="field-label">Email</label><input placeholder="name@example.com" />
          <label className="field-label">Password</label><input type="password" placeholder="Create a password" />
          <button className="button button-block" onClick={() => setRegisterOpen(false)}>Create Demo Account</button>
        </Modal>
      )}
    </main>
  );
}
