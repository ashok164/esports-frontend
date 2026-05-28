import React from "react";
import styled, { createGlobalStyle } from "styled-components";
import useResultController, { ResultControlTab } from "../controller/controller";
import ResultTable from "./component/ResultTable";

const resultTabs: Array<{ key: ResultControlTab; label: string; activeLabel: string; panelTitle: string }> = [
  { key: "result", label: "Result", activeLabel: "Result match id", panelTitle: "Result DB" },
  { key: "today", label: "Today's Result", activeLabel: "Today's result match ids", panelTitle: "Today's Result DB" },
  { key: "league", label: "League Stage Result", activeLabel: "League stage result match ids", panelTitle: "League Stage Result DB" },
];

const ResultView: React.FC = () => {
  const {
    activeMatchIds,
    activeTab,
    beginEdit,
    cancelEdit,
    deleteResult,
    downloadResults,
    editingId,
    editingRow,
    error,
    isLoading,
    isSaving,
    loadResults,
    results,
    saveEdit,
    status,
    setActiveTab,
    updateEditingRow,
  } = useResultController();
  const activeTabConfig = resultTabs.find((tab) => tab.key === activeTab) || resultTabs[0];

  return (
    <Page>
      <GlobalResultStyles />
      <Shell>
        <Header>
          <div>
            <Kicker>Tournament Control</Kicker>
            <Title>Result Control</Title>
          </div>
          <HeaderActions>
            <ActivePanel>
              <ActiveLabel>{activeTabConfig.activeLabel}</ActiveLabel>
              <ActiveValue>{activeMatchIds || "No match enabled"}</ActiveValue>
            </ActivePanel>
            <IconButton type="button" title="Refresh result data" onClick={loadResults} disabled={isLoading || isSaving}>
              <RefreshIcon />
            </IconButton>
            <IconButton type="button" title="Download result sheet" onClick={downloadResults} disabled={results.length === 0}>
              <DownloadIcon />
            </IconButton>
          </HeaderActions>
        </Header>

        {error && <Alert>{error}</Alert>}
        {status && <Notice>{status}</Notice>}

        <Tabs aria-label="Result control type">
          {resultTabs.map((tab) => (
            <TabButton key={tab.key} type="button" $active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)}>
              {tab.label}
            </TabButton>
          ))}
        </Tabs>

        <Panel>
          <PanelHeader>
            <PanelTitle>{activeTabConfig.panelTitle}</PanelTitle>
            <GhostText>
              {isLoading ? "Loading..." : `${results.length} rows`}
            </GhostText>
          </PanelHeader>

          <ResultTable
            editingId={editingId}
            editingRow={editingRow}
            isSaving={isSaving}
            results={results}
            onBeginEdit={beginEdit}
            onCancelEdit={cancelEdit}
            onDelete={deleteResult}
            onSaveEdit={saveEdit}
            onUpdateEdit={updateEditingRow}
          />
        </Panel>
      </Shell>
    </Page>
  );
};

export default ResultView;

const IconBase = ({ children }: { children: React.ReactNode }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    {children}
  </svg>
);

const strokeProps = {
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const RefreshIcon = () => <IconBase><path {...strokeProps} d="M21 12a9 9 0 0 1-15.5 6.3L3 16" /><path {...strokeProps} d="M3 21v-5h5" /><path {...strokeProps} d="M3 12a9 9 0 0 1 15.5-6.3L21 8" /><path {...strokeProps} d="M21 3v5h-5" /></IconBase>;
const DownloadIcon = () => <IconBase><path {...strokeProps} d="M12 3v12" /><path {...strokeProps} d="m7 10 5 5 5-5" /><path {...strokeProps} d="M5 21h14" /></IconBase>;

const GlobalResultStyles = createGlobalStyle`
  html,
  body,
  #root {
    min-height: 100%;
    margin: 0;
    background: var(--project-background, #0a0f18);
  }
`;

const Page = styled.main`
  min-height: 100vh;
  background:
    linear-gradient(180deg, var(--project-background, #0a0f18), var(--project-surface, #101722));
  color: var(--project-text-primary, #e5edf8);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
`;

const Shell = styled.div`
  width: min(1240px, calc(100% - 32px));
  margin: 0 auto;
  padding: 24px 0 32px;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: end;
  margin-bottom: 18px;

  @media (max-width: 860px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const Kicker = styled.div`
  color: var(--project-accent, #5eead4);
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
`;

const Title = styled.h1`
  margin: 6px 0 0;
  color: var(--project-text-primary, #ffffff);
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: stretch;
  gap: 10px;

  @media (max-width: 560px) {
    flex-wrap: wrap;
  }
`;

const ActivePanel = styled.div`
  min-width: min(430px, 100%);
  padding: 14px 16px;
  border: 1px solid var(--project-border, rgba(148, 163, 184, 0.22));
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.72);
`;

const ActiveLabel = styled.div`
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.76rem;
  font-weight: 800;
  text-transform: uppercase;
`;

const ActiveValue = styled.div`
  margin-top: 6px;
  color: var(--project-text-primary, #ffffff);
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 0.9rem;
  overflow-wrap: anywhere;
`;

const Panel = styled.section`
  margin-top: 16px;
  padding: 18px;
  border: 1px solid var(--project-border, rgba(148, 163, 184, 0.22));
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.72);
`;

const Tabs = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(160px, 1fr));
  overflow: hidden;
  margin-top: 16px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 6px;
  background: rgba(2, 6, 23, 0.62);

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const TabButton = styled.button<{ $active: boolean }>`
  min-height: 42px;
  padding: 0 14px;
  border: 0;
  border-right: 1px solid rgba(148, 163, 184, 0.18);
  background: ${({ $active }) => ($active ? "rgba(var(--project-accent-rgb, 94, 234, 212), 0.18)" : "transparent")};
  color: ${({ $active }) => ($active ? "var(--project-text-primary, #ffffff)" : "var(--project-text-secondary, #94a3b8)")};
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 800;

  &:last-child {
    border-right: 0;
  }

  &:hover {
    color: var(--project-text-primary, #ffffff);
  }

  @media (max-width: 720px) {
    border-right: 0;
    border-bottom: 1px solid rgba(148, 163, 184, 0.18);

    &:last-child {
      border-bottom: 0;
    }
  }
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
`;

const PanelTitle = styled.h2`
  margin: 0;
  font-size: 1.1rem;
`;

const IconButton = styled.button`
  width: 42px;
  min-width: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 6px;
  background: rgba(2, 6, 23, 0.62);
  color: var(--project-text-primary, #ffffff);
  cursor: pointer;

  &:hover {
    border-color: var(--project-accent, #5eead4);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

const ActionButton = styled.button`
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 6px;
  background: var(--project-accent, #5eead4);
  color: #020617;
  padding: 0 14px;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

const GhostText = styled.span`
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.86rem;
  font-weight: 700;
`;

const Alert = styled.div`
  padding: 12px 14px;
  border: 1px solid rgba(var(--project-danger-rgb, 239, 68, 68), 0.34);
  border-radius: 8px;
  background: rgba(var(--project-danger-rgb, 239, 68, 68), 0.12);
  color: var(--project-text-primary, #ffffff);
`;

const Notice = styled.div`
  margin-top: 10px;
  padding: 12px 14px;
  border: 1px solid rgba(var(--project-accent-rgb, 94, 234, 212), 0.28);
  border-radius: 8px;
  background: rgba(var(--project-accent-rgb, 94, 234, 212), 0.1);
  color: var(--project-text-primary, #ffffff);
`;
