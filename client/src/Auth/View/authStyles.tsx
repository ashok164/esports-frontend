import { Link } from "react-router-dom";
import styled, { createGlobalStyle } from "styled-components";

export const LoginGlobalStyle = createGlobalStyle`
  html,
  body,
  #root {
    min-height: 100%;
    margin: 0;
    background: var(--project-background, #070b12);
  }
`;

export const AuthPage = styled.main`
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

export const Shell = styled.section`
  width: min(1080px, 100%);
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(340px, 0.85fr);
  overflow: hidden;
  border: 1px solid var(--project-border, rgba(148, 163, 184, 0.24));
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.78);
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.4);

  > form {
    padding: 34px;
    display: grid;
    align-content: center;
    gap: 16px;
    background: var(--project-surface, #111827);
  }

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

export const PanelTitle = styled.div`
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

  span {
    color: var(--project-accent, #bfff00);
    font-size: 0.82rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  strong {
    max-width: 620px;
    margin: 10px 0;
    font-size: clamp(2.6rem, 6vw, 5.8rem);
    line-height: 0.92;
    letter-spacing: 0;
  }

  @media (max-width: 860px) {
    min-height: 360px;
  }
`;

export const PanelSubtitle = styled.p`
  max-width: 540px;
  margin: 0;
  color: var(--project-text-secondary, #cbd5e1);
  font-size: 1rem;
  line-height: 1.6;
`;

export const SignalGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 28px;
`;

export const SignalCard = styled.div`
  min-height: 78px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.34);

  strong,
  span {
    display: block;
  }

  strong {
    margin: 0;
    font-size: 1rem;
    line-height: 1.2;
  }

  span {
    margin-top: 4px;
    color: var(--project-text-secondary, #cbd5e1);
    font-size: 0.82rem;
    text-transform: none;
  }
`;

export const FormHeader = styled.div`
  display: grid;
  gap: 6px;
  margin-bottom: 4px;
`;

export const FormTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
`;

export const FormNote = styled.p`
  margin: 0;
  color: var(--project-text-secondary, #94a3b8);
`;

export const ErrorBanner = styled.div`
  padding: 12px;
  border: 1px solid rgba(var(--project-danger-rgb, 239, 68, 68), 0.42);
  border-radius: 8px;
  background: rgba(var(--project-danger-rgb, 239, 68, 68), 0.12);
  color: var(--project-danger, #ef4444);
  font-size: 0.9rem;
  font-weight: 700;
`;

export const Field = styled.div`
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

export const SubmitButton = styled.button`
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

export const AuthLink = styled.p`
  margin: 0;
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.9rem;
  text-align: center;

  a {
    color: var(--project-secondary, #38bdf8);
    font-weight: 900;
    text-decoration: none;
  }
`;

export const StyledAuthLink = styled(Link)`
  color: var(--project-secondary, #38bdf8);
  font-weight: 900;
  text-decoration: none;
`;
