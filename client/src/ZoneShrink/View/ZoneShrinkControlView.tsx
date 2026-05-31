import React from "react";
import styled from "styled-components";
import {
  getZoneShrinkApi,
  getZoneShrinkState,
  patchZoneShrinkApi,
  setZoneShrinkState,
  ZoneShrinkState,
} from "../zoneShrinkState";

const ZoneShrinkControlView: React.FC = () => {
  const [state, setState] = React.useState<ZoneShrinkState>(getZoneShrinkState);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  const updateState = (nextState: ZoneShrinkState) => {
    setState(nextState);
    setZoneShrinkState(nextState);
  };

  React.useEffect(() => {
    getZoneShrinkApi()
      .then(updateState)
      .catch((err: any) => setError(err?.response?.data?.message || err?.message || "Failed to load zone shrink state"));
  }, []);

  const setActive = async (active: boolean) => {
    setIsSaving(true);
    setError("");
    try {
      const apiState = await patchZoneShrinkApi(active);
      updateState({
        ...state,
        ...apiState,
        enabled: active,
        triggerId: active ? Date.now() : state.triggerId,
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to update zone shrink state");
    } finally {
      setIsSaving(false);
    }
  };

  const triggerZoneShrink = () => {
    setActive(true);
  };

  const hideZoneShrink = () => {
    setActive(false);
  };

  return (
    <Page>
      <Panel>
        <Header>
          <TitleBlock>
            <h1>Zone Shrink</h1>
            <p>Trigger the zone closing overlay on the broadcast page for 10 seconds.</p>
          </TitleBlock>
          <LiveBadge $active={state.enabled}>{state.enabled ? "Showing" : "Hidden"}</LiveBadge>
        </Header>
        {error && <Status>{error}</Status>}

        <ControlCard>
          <TextBlock>
            <strong>Zone is closing</strong>
            <span>Appears from the right bottom corner and then disappears automatically.</span>
          </TextBlock>
          <Switch>
            <input
              type="checkbox"
              checked={state.enabled}
              onChange={(event) => (event.target.checked ? triggerZoneShrink() : hideZoneShrink())}
              disabled={isSaving}
            />
            <span />
          </Switch>
        </ControlCard>

        <ControlCard>
          <TextBlock>
            <strong>Sound</strong>
            <span>Plays `/ZoneShrinkSound/shrinkSound.mp3` when the overlay opens.</span>
          </TextBlock>
          <Switch>
            <input
              type="checkbox"
              checked={state.playSound}
              onChange={(event) => updateState({ ...state, playSound: event.target.checked })}
            />
            <span />
          </Switch>
        </ControlCard>

        <ButtonRow>
          <Button type="button" onClick={triggerZoneShrink} disabled={isSaving}>Show Zone Shrink</Button>
          <Button type="button" $variant="ghost" onClick={hideZoneShrink} disabled={isSaving}>Hide</Button>
        </ButtonRow>
      </Panel>
    </Page>
  );
};

export default ZoneShrinkControlView;

const Page = styled.main`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1.25rem;
  box-sizing: border-box;
  background: var(--project-background, #090d14);
  color: var(--project-text-primary, #f8fafc);
  font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`;

const Panel = styled.section`
  width: min(620px, 100%);
  display: grid;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--project-border, #334155);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.86);
`;

const Header = styled.header`
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
`;

const TitleBlock = styled.div`
  h1 {
    margin: 0;
    font-size: 1.7rem;
  }

  p {
    margin: 0.4rem 0 0;
    color: var(--project-text-secondary, #94a3b8);
  }
`;

const LiveBadge = styled.span<{ $active: boolean }>`
  border: 1px solid ${({ $active }) => ($active ? "#22c55e" : "var(--project-border, #334155)")};
  border-radius: 999px;
  padding: 0.35rem 0.7rem;
  color: ${({ $active }) => ($active ? "#bbf7d0" : "var(--project-text-secondary, #94a3b8)")};
  background: ${({ $active }) => ($active ? "rgba(34, 197, 94, 0.14)" : "rgba(15, 23, 42, 0.8)")};
  font-size: 0.76rem;
  font-weight: 900;
  text-transform: uppercase;
`;

const ControlCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem;
  border: 1px solid var(--project-border, #334155);
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.55);
`;

const Status = styled.div`
  padding: 0.75rem 0.9rem;
  border: 1px solid #ef4444;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.12);
  color: #fecaca;
  font-size: 0.88rem;
`;

const TextBlock = styled.div`
  display: grid;
  gap: 0.25rem;

  strong {
    font-size: 1rem;
  }

  span {
    color: var(--project-text-secondary, #94a3b8);
    font-size: 0.86rem;
  }
`;

const Switch = styled.label`
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
  width: 52px;
  height: 28px;

  input {
    position: absolute;
    opacity: 0;
  }

  span {
    width: 100%;
    border-radius: 999px;
    background: #334155;
    cursor: pointer;
    transition: background 160ms ease;
  }

  span::before {
    content: "";
    position: absolute;
    top: 4px;
    left: 4px;
    width: 20px;
    height: 20px;
    border-radius: 999px;
    background: #ffffff;
    transition: transform 160ms ease;
  }

  input:checked + span {
    background: var(--project-primary, #ef4444);
  }

  input:checked + span::before {
    transform: translateX(24px);
  }

  input:disabled + span {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
`;

const Button = styled.button<{ $variant?: "ghost" }>`
  min-height: 2.5rem;
  border: 1px solid ${({ $variant }) => ($variant === "ghost" ? "var(--project-border, #334155)" : "var(--project-primary, #ef4444)")};
  border-radius: 6px;
  padding: 0.55rem 0.9rem;
  background: ${({ $variant }) => ($variant === "ghost" ? "rgba(15, 23, 42, 0.82)" : "var(--project-primary, #ef4444)")};
  color: #ffffff;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;
