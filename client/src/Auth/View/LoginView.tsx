import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import styled, { createGlobalStyle } from "styled-components";
import { loginAdmin } from "../Repository/remote";
import { isAuthenticated, saveAuthSession } from "../Repository/authStorage";

const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated()) {
    return <Navigate to="/tournaments" replace />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Enter username and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await loginAdmin({
        email: username.trim(),
        password,
      });
      const token = response.token || response.accessToken || response.data?.token || response.data?.accessToken;
      const user = response.user || response.data?.user;

      if (!token) {
        setError("Login succeeded but no token was returned.");
        return;
      }

      saveAuthSession(token, user);
      navigate("/tournaments", { replace: true });
    } catch (loginError: any) {
      setError(loginError?.response?.data?.message || "Login failed. Check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Page>
      <LoginGlobalStyle />
      <Shell>
        <BrandPanel>
          <WindowBar aria-hidden="true">
            <Dot $tone="red" />
            <Dot $tone="amber" />
            <Dot $tone="green" />
          </WindowBar>
          <Kicker>Tournament System</Kicker>
          <Title>Control Room Login</Title>
          <Subtitle>
            Secure access for admins, match operators, and production staff.
          </Subtitle>
          <SignalGrid>
            <SignalCard>
              <strong>Live</strong>
              <span>Overlays</span>
            </SignalCard>
            <SignalCard>
              <strong>Teams</strong>
              <span>Records</span>
            </SignalCard>
            <SignalCard>
              <strong>Theme</strong>
              <span>Broadcast</span>
            </SignalCard>
          </SignalGrid>
        </BrandPanel>

        <LoginCard onSubmit={handleSubmit}>
          <FormHeader>
            <FormTitle>Admin Access</FormTitle>
            <FormNote>Sign in to open the route center.</FormNote>
          </FormHeader>

          {error && <ErrorBanner>{error}</ErrorBanner>}

          <Field>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="admin"
              autoComplete="username"
            />
          </Field>

          <Field>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </Field>

          <SubmitButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing In..." : "Enter Admin Center"}
          </SubmitButton>
        </LoginCard>
      </Shell>
    </Page>
  );
};

export default LoginView;

const LoginGlobalStyle = createGlobalStyle`
  html,
  body,
  #root {
    min-height: 100%;
    margin: 0;
    background: var(--project-background, #070b12);
  }
`;

const Page = styled.main`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px 16px;
  box-sizing: border-box;
  background:
    linear-gradient(135deg, rgba(var(--project-primary-rgb, 239, 68, 68), 0.18), transparent 34%),
    linear-gradient(315deg, rgba(var(--project-secondary-rgb, 56, 189, 248), 0.16), transparent 38%),
    var(--project-background, #070b12);
  color: var(--project-text-primary, #f8fafc);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
`;

const Shell = styled.section`
  width: min(1080px, 100%);
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(340px, 0.8fr);
  overflow: hidden;
  border: 1px solid var(--project-border, rgba(148, 163, 184, 0.24));
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.78);
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.4);

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const BrandPanel = styled.div`
  position: relative;
  min-height: 560px;
  padding: 34px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background:
    linear-gradient(180deg, rgba(2, 6, 23, 0.22), rgba(2, 6, 23, 0.78)),
    linear-gradient(135deg, rgba(var(--project-primary-rgb, 239, 68, 68), 0.42), rgba(var(--project-secondary-rgb, 56, 189, 248), 0.22)),
    var(--project-surface, #111827);

  @media (max-width: 860px) {
    min-height: 360px;
  }
`;

const WindowBar = styled.div`
  position: absolute;
  top: 26px;
  display: flex;
  gap: 8px;
`;

const Dot = styled.span<{ $tone: "red" | "amber" | "green" }>`
  width: 11px;
  height: 11px;
  border-radius: 999px;
  background: ${({ $tone }) =>
    $tone === "red" ? "#fb7185" : $tone === "amber" ? "#fbbf24" : "#34d399"};
`;

const Kicker = styled.div`
  color: var(--project-accent, #bfff00);
  font-size: 0.82rem;
  font-weight: 900;
  text-transform: uppercase;
`;

const Title = styled.h1`
  max-width: 620px;
  margin: 10px 0;
  font-size: clamp(2.6rem, 6vw, 5.8rem);
  line-height: 0.92;
  letter-spacing: 0;
`;

const Subtitle = styled.p`
  max-width: 540px;
  margin: 0;
  color: var(--project-text-secondary, #cbd5e1);
  font-size: 1rem;
  line-height: 1.6;
`;

const SignalGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 28px;
`;

const SignalCard = styled.div`
  min-height: 78px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.34);

  strong,
  span {
    display: block;
  }

  span {
    margin-top: 4px;
    color: var(--project-text-secondary, #cbd5e1);
    font-size: 0.82rem;
  }
`;

const LoginCard = styled.form`
  padding: 34px;
  display: grid;
  align-content: center;
  gap: 18px;
  background: var(--project-surface, #111827);
`;

const FormHeader = styled.div`
  display: grid;
  gap: 6px;
  margin-bottom: 4px;
`;

const FormTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
`;

const FormNote = styled.p`
  margin: 0;
  color: var(--project-text-secondary, #94a3b8);
`;

const ErrorBanner = styled.div`
  padding: 12px;
  border: 1px solid rgba(var(--project-danger-rgb, 239, 68, 68), 0.42);
  border-radius: 8px;
  background: rgba(var(--project-danger-rgb, 239, 68, 68), 0.12);
  color: var(--project-danger, #ef4444);
  font-size: 0.9rem;
  font-weight: 700;
`;

const Field = styled.div`
  display: grid;
  gap: 8px;

  label {
    color: var(--project-text-secondary, #94a3b8);
    font-size: 0.82rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  input {
    height: 46px;
    padding: 0 14px;
    border: 1px solid var(--project-border, #334155);
    border-radius: 8px;
    background: var(--project-background, #0b0f19);
    color: var(--project-text-primary, #ffffff);
    font-size: 0.95rem;
  }
`;

const SubmitButton = styled.button`
  height: 48px;
  border: 1px solid var(--project-primary, #ef4444);
  border-radius: 8px;
  background: var(--project-primary, #ef4444);
  color: var(--project-text-primary, #ffffff);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 900;
  text-transform: uppercase;

  &:disabled {
    cursor: wait;
    opacity: 0.7;
  }
`;
