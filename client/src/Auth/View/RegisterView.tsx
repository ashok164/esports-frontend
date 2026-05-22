import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { registerAdmin } from "../Repository/remote";
import { isAuthenticated, saveAuthSession } from "../Repository/authStorage";
import {
  AuthLink,
  AuthPage,
  ErrorBanner,
  Field,
  FormHeader,
  FormNote,
  FormTitle,
  LoginGlobalStyle,
  PanelSubtitle,
  PanelTitle,
  Shell,
  SignalCard,
  SignalGrid,
  SubmitButton,
} from "./authStyles";

const RegisterView: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated()) {
    return <Navigate to="/routes" replace />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!name.trim() || !username.trim() || !email.trim() || !password.trim()) {
      setError("Fill all register fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await registerAdmin({
        name: name.trim(),
        // username: username.trim(),
        email: email.trim(),
        password,
      });
      const token = response.token || response.accessToken || response.data?.token || response.data?.accessToken;
      const user = response.user || response.data?.user;

      if (token) {
        saveAuthSession(token, user);
        navigate("/routes", { replace: true });
        return;
      }

      navigate("/login", { replace: true });
    } catch (registerError: any) {
      setError(registerError?.response?.data?.message || "Register failed. Please check the backend API.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPage>
      <LoginGlobalStyle />
      <Shell>
        <PanelTitle>
          <span>Tournament System</span>
          <strong>Create Control Access</strong>
          <PanelSubtitle>Register an admin account for tournament operations.</PanelSubtitle>
          <SignalGrid>
            <SignalCard>
              <strong>Admin</strong>
              <span>Protected</span>
            </SignalCard>
            <SignalCard>
              <strong>Broadcast</strong>
              <span>Ready</span>
            </SignalCard>
            <SignalCard>
              <strong>Theme</strong>
              <span>Synced</span>
            </SignalCard>
          </SignalGrid>
        </PanelTitle>

        <form onSubmit={handleSubmit}>
          <FormHeader>
            <FormTitle>Register</FormTitle>
            <FormNote>Create a new admin login.</FormNote>
          </FormHeader>

          {error && <ErrorBanner>{error}</ErrorBanner>}

          <Field>
            <label htmlFor="register-name">Name</label>
            <input
              id="register-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Tournament Admin"
              autoComplete="name"
            />
          </Field>

          <Field>
            <label htmlFor="register-username">Username</label>
            <input
              id="register-username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="admin"
              autoComplete="username"
            />
          </Field>

          <Field>
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              autoComplete="email"
            />
          </Field>

          <Field>
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Create password"
              autoComplete="new-password"
            />
          </Field>

          <SubmitButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Account"}
          </SubmitButton>

          <AuthLink>
            Already have an account? <Link to="/login">Sign in</Link>
          </AuthLink>
        </form>
      </Shell>
    </AuthPage>
  );
};

export default RegisterView;
