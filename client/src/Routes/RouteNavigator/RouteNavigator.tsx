import React from "react";
import { Link } from "react-router-dom";
import styled, { createGlobalStyle } from "styled-components";

type RouteItem = {
  title: string;
  path: string;
  note: string;
  type: "Admin" | "Broadcast";
};

type RouteGroup = {
  title: string;
  description: string;
  routes: RouteItem[];
};

const routeGroups: RouteGroup[] = [
  {
    title: "Player",
    description: "Player uploads, photos, profiles, and related team player data.",
    routes: [
      {
        title: "Player Upload",
        path: "/player-upload",
        note: "Upload team player details and assets.",
        type: "Admin",
      },
      {
        title: "Player Profile",
        path: "/player-profile",
        note: "Review and manage uploaded player profiles.",
        type: "Admin",
      },
    ],
  },
  {
    title: "Team",
    description: "Team records, logos, country logos, and team identity screens.",
    routes: [
      {
        title: "Team Record",
        path: "/team-record",
        note: "Create and edit team records.",
        type: "Admin",
      },
      {
        title: "Team Logo",
        path: "/team-logo",
        note: "View team and country logo assets.",
        type: "Admin",
      },
    ],
  },
  {
    title: "Theme",
    description: "Project colors, default color mode, and broadcast theme setup.",
    routes: [
      {
        title: "Broadcast Theme",
        path: "/broadcast-theme",
        note: "Create or update project theme colors.",
        type: "Admin",
      },
    ],
  },
  {
    title: "Game Assets",
    description: "Weapon, character, skill, role, and equipment image upload tools.",
    routes: [
      {
        title: "Game Asset Upload",
        path: "/game-asset-upload",
        note: "Create and update gameplay asset images.",
        type: "Admin",
      },
      {
        title: "Game Details",
        path: "/game-details",
        note: "Create match rows and enable websocket match ids.",
        type: "Admin",
      },
      {
        title: "Match Mappings",
        path: "/match-team-mappings",
        note: "View and delete saved room-to-team match mappings.",
        type: "Admin",
      },
      {
        title: "Result JSON Control",
        path: "/result-json-control",
        note: "Paste websocket JSON, compare mapped slots, and save match results.",
        type: "Admin",
      },
      {
        title: "View Weapons",
        path: "/view-weapons",
        note: "Review uploaded weapon IDs, names, and images.",
        type: "Admin",
      },
      {
        title: "View Characters",
        path: "/view-characters",
        note: "Review uploaded character IDs, names, and images.",
        type: "Admin",
      },
      {
        title: "View Skills",
        path: "/view-skills",
        note: "Review uploaded skill IDs, names, and images.",
        type: "Admin",
      },
      {
        title: "View Roles",
        path: "/view-roles",
        note: "Review uploaded role IDs, names, and images.",
        type: "Admin",
      },
      {
        title: "View Equipment",
        path: "/view-equipment",
        note: "Review uploaded equipment IDs, names, and images.",
        type: "Admin",
      },
    ],
  },
  {
    title: "Live Broadcast",
    description: "Overlay pages intended for live production windows.",
    routes: [
      {
        title: "Circle Analysis Control",
        path: "/circle-analysis-control",
        note: "Edit circle placements and kill counts for the circle analysis overlay.",
        type: "Admin",
      },
      {
        title: "Live Standings",
        path: "/live-standings",
        note: "Live standings table overlay.",
        type: "Broadcast",
      },
      {
        title: "Team Eliminated",
        path: "/team-eliminated",
        note: "Team eliminated broadcast overlay.",
        type: "Broadcast",
      },
      {
        title: "Last Four Teams",
        path: "/last-four-teams",
        note: "Endgame last teams notification.",
        type: "Broadcast",
      },
      {
        title: "Match Number",
        path: "/match-number",
        note: "Current match number graphic.",
        type: "Broadcast",
      },
      {
        title: "Circle Analysis",
        path: "/circle-analysis",
        note: "Circle analysis broadcast panel.",
        type: "Broadcast",
      },
      {
        title: "Result",
        path: "/result",
        note: "Tabbed result overlay for last match, today's enabled matches, and league stage matches.",
        type: "Broadcast",
      },
    ],
  },
];

const allRoutes = routeGroups.flatMap((group) =>
  group.routes.map((route) => ({ ...route, group: group.title }))
);

const adminRoutes = allRoutes.filter((route) => route.type === "Admin");
const broadcastRoutes = allRoutes.filter((route) => route.type === "Broadcast");
const adminGroups = routeGroups
  .map((group) => ({
    ...group,
    routes: group.routes.filter((route) => route.type === "Admin"),
  }))
  .filter((group) => group.routes.length > 0);
const broadcastGroups = routeGroups
  .map((group) => ({
    ...group,
    routes: group.routes.filter((route) => route.type === "Broadcast"),
  }))
  .filter((group) => group.routes.length > 0);

const RouteNavigator: React.FC = () => {
  return (
    <Page data-theme-surface="page">
      <GlobalRouteStyles />
      <Shell>
        <WindowBar>
          <WindowControls aria-hidden="true">
            <ControlDot $tone="red" />
            <ControlDot $tone="amber" />
            <ControlDot $tone="green" />
          </WindowControls>
          <WindowTitle>Admin Center</WindowTitle>
        </WindowBar>

        <Header>
          <TitleBlock>
            <Kicker>Tournament Control</Kicker>
            <Title>Admin Center</Title>
            <Subtitle>
              Blue cards control admin pages in this tab. Red cards launch broadcast overlays in new tabs.
            </Subtitle>
          </TitleBlock>
          <Stats>
            <Stat>
              <StatValue>{adminRoutes.length}</StatValue>
              <StatLabel>Admin</StatLabel>
            </Stat>
            <Stat>
              <StatValue>{broadcastRoutes.length}</StatValue>
              <StatLabel>Broadcast</StatLabel>
            </Stat>
          </Stats>
        </Header>

        <RouteHalf $variant="admin" data-theme-surface="panel">
          <SectionHeader>
            <SectionTitle>Admin Navigator</SectionTitle>
            <SectionHint>Same tab controls</SectionHint>
          </SectionHeader>
          <Groups aria-label="Admin route groups">
            {adminGroups.map((group) => (
              <GroupSection key={group.title} $variant="admin" data-theme-surface="card">
                <GroupHeader>
                  <GroupTitle>{group.title}</GroupTitle>
                  <GroupDescription>{group.description}</GroupDescription>
                </GroupHeader>
                <GroupRoutes>
                  {group.routes.map((route) => (
                    <RouteChip key={route.path} to={route.path} title={route.note} $variant="admin">
                      <ChipDot aria-hidden="true" $variant="admin" />
                      <span>{route.title}</span>
                    </RouteChip>
                  ))}
                </GroupRoutes>
              </GroupSection>
            ))}
          </Groups>
        </RouteHalf>

        <RouteHalf $variant="broadcast" data-theme-surface="panel">
          <SectionHeader>
            <SectionTitle>Broadcast Navigator</SectionTitle>
            <SectionHint>New tab overlays</SectionHint>
          </SectionHeader>
          <Groups aria-label="Broadcast route groups">
            {broadcastGroups.map((group) => (
              <GroupSection key={group.title} $variant="broadcast" data-theme-surface="card">
                <GroupHeader>
                  <GroupTitle>{group.title}</GroupTitle>
                  <GroupDescription>{group.description}</GroupDescription>
                </GroupHeader>
                <GroupRoutes>
                  {group.routes.map((route) => (
                    <AnchorChip
                      key={route.path}
                      href={route.path}
                      target="_blank"
                      rel="noreferrer"
                      title={route.note}
                      $variant="broadcast"
                    >
                      <ChipDot aria-hidden="true" $variant="broadcast" />
                      <span>{route.title}</span>
                    </AnchorChip>
                  ))}
                </GroupRoutes>
              </GroupSection>
            ))}
          </Groups>
        </RouteHalf>
      </Shell>
    </Page>
  );
};

export default RouteNavigator;

const GlobalRouteStyles = createGlobalStyle`
  html,
  body,
  #root {
    min-height: 100%;
    margin: 0;
    background: var(--project-background, #090d14);
  }

  body {
    overflow-x: hidden;
  }
`;

const Page = styled.main`
  min-height: 100vh;
  background:
    linear-gradient(
      180deg,
      var(--project-background, #0a1220) 0%,
      var(--project-surface, #10151e) 48%,
      var(--project-surface-alt, #161017) 100%
    ),
    var(--project-background, #090d14);
  color: var(--project-text-primary, #e5edf8);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
`;

const Shell = styled.div`
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 20px 0 28px;
`;

const WindowBar = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 44px;
  margin-bottom: 22px;
  padding: 0 16px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  background: rgba(var(--project-primary-rgb, 2, 6, 23), 0.12);
`;

const WindowControls = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
`;

const ControlDot = styled.span<{ $tone: "red" | "amber" | "green" }>`
  width: 11px;
  height: 11px;
  border-radius: 999px;
  background: ${({ $tone }) =>
    $tone === "red" ? "#fb7185" : $tone === "amber" ? "#fbbf24" : "#34d399"};
  box-shadow: 0 0 18px currentColor;
`;

const WindowTitle = styled.div`
  color: var(--project-text-secondary, #cbd5e1);
  color: var(--project-text-secondary, #cbd5e1);
  font-size: 0.86rem;
  font-weight: 800;
`;

const Header = styled.header`
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 16px;

  @media (max-width: 760px) {
    flex-direction: column;
  }
`;

const TitleBlock = styled.div`
  display: grid;
  gap: 8px;
`;

const Kicker = styled.div`
  color: var(--project-accent, #5eead4);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
`;

const Title = styled.h1`
  margin: 0;
  color: var(--project-text-primary, #ffffff);
  font-size: clamp(2rem, 4vw, 3.5rem);
  line-height: 0.95;
  letter-spacing: 0;
`;

const Subtitle = styled.p`
  max-width: 720px;
  margin: 0;
  color: var(--project-text-secondary, #a8b3c7);
  font-size: 1rem;
  line-height: 1.6;
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(112px, 1fr));
  gap: 12px;
  min-width: 240px;
`;

const Stat = styled.div`
  display: grid;
  align-content: center;
  gap: 4px;
  min-height: 104px;
  padding: 18px;
  border: 1px solid var(--project-border, rgba(148, 163, 184, 0.22));
  border-radius: 8px;
  background: rgba(var(--project-secondary-rgb, 15, 23, 42), 0.12);
`;

const RouteHalf = styled.section<{ $variant: "admin" | "broadcast" }>`
  display: grid;
  align-content: start;
  gap: 14px;
  min-height: calc(50vh - 78px);
  margin-top: 16px;
  padding: 18px;
  border: 1px solid
    ${({ $variant }) =>
      $variant === "admin"
        ? "rgba(var(--project-secondary-rgb, 59, 130, 246), 0.22)"
        : "rgba(var(--project-primary-rgb, 244, 114, 182), 0.22)"};
  border-radius: 8px;
  background:
    linear-gradient(
      135deg,
      ${({ $variant }) =>
        $variant === "admin"
          ? "rgba(var(--project-secondary-rgb, 30, 64, 175), 0.18)"
          : "rgba(var(--project-primary-rgb, 136, 19, 55), 0.16)"},
      rgba(15, 23, 42, 0.7)
    ),
    var(--project-surface, #101722);
  box-shadow: 0 20px 52px rgba(0, 0, 0, 0.28);
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: 560px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: var(--project-text-primary, #ffffff);
  font-size: 1.15rem;
  letter-spacing: 0;
`;

const SectionHint = styled.span`
  color: var(--project-text-secondary, rgba(226, 232, 240, 0.78));
  font-size: 0.82rem;
  font-weight: 800;
  text-transform: uppercase;
`;

const StatValue = styled.strong`
  color: var(--project-text-primary, #ffffff);
  font-size: 2rem;
  line-height: 1;
`;

const StatLabel = styled.span`
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.88rem;
  font-weight: 700;
`;

const Groups = styled.section`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const GroupSection = styled.section<{ $variant: "admin" | "broadcast" }>`
  min-width: 0;
  padding: 20px;
  border: 1px solid var(--project-border, rgba(148, 163, 184, 0.2));
  border-radius: 8px;
  background:
    linear-gradient(
      180deg,
      ${({ $variant }) =>
        $variant === "admin"
          ? "rgba(var(--project-secondary-rgb, 59, 130, 246), 0.12)"
          : "rgba(var(--project-primary-rgb, 244, 114, 182), 0.11)"},
      rgba(10, 15, 24, 0.82)
    );
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.22);
`;

const GroupHeader = styled.div`
  display: grid;
  gap: 6px;
  margin-bottom: 14px;
`;

const GroupTitle = styled.h3`
  margin: 0;
  color: var(--project-text-primary, #ffffff);
  font-size: 1.25rem;
`;

const GroupDescription = styled.p`
  margin: 0;
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.86rem;
  line-height: 1.5;
`;

const GroupRoutes = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const chipStyles = `
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  max-width: 100%;
  padding: 8px 12px 8px 9px;
  border: 1px solid var(--chip-border);
  border-radius: 999px;
  background: rgba(2, 6, 23, 0.7);
  color: var(--project-text-primary, #e0f2fe);
  font-size: 0.86rem;
  font-weight: 800;
  text-decoration: none;
  transition: background 160ms ease, border-color 160ms ease, transform 160ms ease;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover {
    border-color: var(--chip-hover-border);
    background: var(--chip-hover-bg);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid var(--project-accent, #5eead4);
    outline-offset: 2px;
  }
`;

const RouteChip = styled(Link)<{ $variant: "admin" | "broadcast" }>`
  ${chipStyles}
  --chip-border: ${({ $variant }) =>
    $variant === "admin"
      ? "rgba(var(--project-secondary-rgb, 125, 211, 252), 0.28)"
      : "rgba(var(--project-primary-rgb, 251, 113, 133), 0.26)"};
  --chip-hover-border: ${({ $variant }) =>
    $variant === "admin"
      ? "rgba(var(--project-secondary-rgb, 125, 211, 252), 0.58)"
      : "rgba(var(--project-primary-rgb, 251, 113, 133), 0.54)"};
  --chip-hover-bg: ${({ $variant }) =>
    $variant === "admin"
      ? "rgba(var(--project-secondary-rgb, 14, 116, 144), 0.16)"
      : "rgba(var(--project-primary-rgb, 190, 24, 93), 0.15)"};
`;

const AnchorChip = styled.a<{ $variant: "admin" | "broadcast" }>`
  ${chipStyles}
  --chip-border: ${({ $variant }) =>
    $variant === "admin"
      ? "rgba(var(--project-secondary-rgb, 125, 211, 252), 0.28)"
      : "rgba(var(--project-primary-rgb, 251, 113, 133), 0.26)"};
  --chip-hover-border: ${({ $variant }) =>
    $variant === "admin"
      ? "rgba(var(--project-secondary-rgb, 125, 211, 252), 0.58)"
      : "rgba(var(--project-primary-rgb, 251, 113, 133), 0.54)"};
  --chip-hover-bg: ${({ $variant }) =>
    $variant === "admin"
      ? "rgba(var(--project-secondary-rgb, 14, 116, 144), 0.16)"
      : "rgba(var(--project-primary-rgb, 190, 24, 93), 0.15)"};
`;

const ChipDot = styled.span<{ $variant: "admin" | "broadcast" }>`
  flex: 0 0 auto;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: ${({ $variant }) =>
    $variant === "admin" ? "var(--project-secondary, #67e8f9)" : "var(--project-primary, #fb7185)"};
  box-shadow: 0 0 14px
    ${({ $variant }) =>
      $variant === "admin"
        ? "rgba(var(--project-secondary-rgb, 103, 232, 249), 0.62)"
        : "rgba(var(--project-primary-rgb, 251, 113, 133), 0.58)"};
`;
