import React from "react";
import { Link, useNavigate } from "react-router-dom";
import styled, { createGlobalStyle } from "styled-components";
import { clearAuthSession } from "../../Auth/Repository/authStorage";

type RouteItem = {
  title: string;
  path: string;
  note: string;
  type: "Admin" | "Broadcast";
};

type GroupAccent = {
  line: string;
  glow: string;
  badge: string;
};

type RouteGroup = {
  title: string;
  description: string;
  routes: RouteItem[];
  accent: GroupAccent;
};

const getGroupInitials = (title: string) =>
  title
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const routeGroups: RouteGroup[] = [
  {
    title: "Player",
    description: "Player uploads, photos, profiles, and related team player data.",
    accent: {
      line: "#38bdf8",
      glow: "rgba(56, 189, 248, 0.22)",
      badge: "linear-gradient(145deg, rgba(56, 189, 248, 0.36), rgba(14, 116, 144, 0.28))",
    },
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
    accent: {
      line: "#22c55e",
      glow: "rgba(34, 197, 94, 0.2)",
      badge: "linear-gradient(145deg, rgba(34, 197, 94, 0.34), rgba(21, 128, 61, 0.26))",
    },
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
      {
        title: "Country Logo",
        path: "/country-logo",
        note: "Upload reusable country logos for team records.",
        type: "Admin",
      },
      {
        title: "Tournament Logo",
        path: "/tournament-logo",
        note: "Upload tournament logos and choose the active live logo.",
        type: "Admin",
      },
      {
        title: "Full Team Banner",
        path: "/full-team-banner",
        note: "Upload, edit, and delete full team banner images.",
        type: "Admin",
      },
      {
        title: "Notification Banner",
        path: "/notification-team-banner",
        note: "Upload, edit, and delete notification team banner images.",
        type: "Admin",
      },
    ],
  },
  {
    title: "Theme",
    description: "Project colors, default color mode, and broadcast theme setup.",
    accent: {
      line: "#a855f7",
      glow: "rgba(168, 85, 247, 0.2)",
      badge: "linear-gradient(145deg, rgba(168, 85, 247, 0.34), rgba(126, 34, 206, 0.24))",
    },
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
    accent: {
      line: "#f59e0b",
      glow: "rgba(245, 158, 11, 0.2)",
      badge: "linear-gradient(145deg, rgba(245, 158, 11, 0.34), rgba(180, 83, 9, 0.25))",
    },
    routes: [
      {
        title: "Game Asset Upload",
        path: "/game-asset-upload",
        note: "Create and update gameplay asset images.",
        type: "Admin",
      },
      {
        title: "Tournament Assets",
        path: "/tournament-assets",
        note: "Upload tournament assets with asset id, name, image, and active status.",
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
    title: "Result",
    description: "Result controls, MVP, and booyah team player stat tables.",
    accent: {
      line: "#ef4444",
      glow: "rgba(239, 68, 68, 0.22)",
      badge: "linear-gradient(145deg, rgba(239, 68, 68, 0.36), rgba(153, 27, 27, 0.26))",
    },
    routes: [
      {
        title: "Result JSON Control",
        path: "/result-json-control",
        note: "Paste websocket JSON, compare mapped slots, and save match results.",
        type: "Admin",
      },
      {
        title: "Result Viewer",
        path: "/result-viewer",
        note: "View saved result rows by match ID.",
        type: "Admin",
      },
      {
        title: "MVP",
        path: "/result-mvp",
        note: "Single MVP from booyah team players by kills, then damage.",
        type: "Admin",
      },
      {
        title: "Booyah Team Stats",
        path: "/result-booyah-team-stats",
        note: "All players from the booyah team with skills, weapons, and stats.",
        type: "Admin",
      },
      {
        title: "Top Fraggers",
        path: "/result-top-fraggers",
        note: "Top 5 killers across enabled league stage result match IDs.",
        type: "Admin",
      },
    ],
  },
  {
    title: "Live Broadcast",
    description: "Overlay pages intended for live production windows.",
    accent: {
      line: "#f20d20",
      glow: "rgba(242, 13, 32, 0.24)",
      badge: "linear-gradient(145deg, rgba(242, 13, 32, 0.38), rgba(127, 29, 29, 0.28))",
    },
    routes: [
      {
        title: "Circle Analysis Control",
        path: "/circle-analysis-control",
        note: "Edit circle placements and kill counts for the circle analysis overlay.",
        type: "Admin",
      },
      {
        title: "Zone Shrink Control",
        path: "/zone-shrink-control",
        note: "Switch on the zone closing overlay and sound.",
        type: "Admin",
      },
      {
        title: "Live Standings",
        path: "/live-standings",
        note: "Live standings table overlay.",
        type: "Broadcast",
      },
      {
        title: "Tournament Logo Live",
        path: "/tournament-logo-live",
        note: "Centered active tournament logo overlay with shine animation.",
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
        title: "Zone Shrink",
        path: "/zone-shrink",
        note: "Zone closing timer card for live broadcast.",
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
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  return (
    <Page>
      <GlobalRouteStyles />
      <Shell>
        <WindowBar>
          <WindowControls aria-hidden="true">
            <ControlDot $tone="red" />
            <ControlDot $tone="amber" />
            <ControlDot $tone="green" />
          </WindowControls>
          <WindowTitle>Admin Center</WindowTitle>
          <LogoutButton type="button" onClick={handleLogout}>
            Logout
          </LogoutButton>
        </WindowBar>

        <Header>
          <TitleBlock>
            <Kicker>Tournament Control Deck</Kicker>
            <Title>Route Arena</Title>
            <Subtitle>
              Jump between admin controls in this tab, or open broadcast overlays in clean production windows.
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

        <RouteHalf $variant="admin">
          <SectionHeader>
            <SectionTitle>Admin Navigator</SectionTitle>
            <SectionHint>Same tab controls</SectionHint>
          </SectionHeader>
          <Groups aria-label="Admin route groups">
            {adminGroups.map((group) => (
              <GroupSection key={group.title} $variant="admin" $accent={group.accent}>
                <GroupHeader>
                  <GroupBadge $variant="admin" $accent={group.accent} aria-hidden="true">
                    {getGroupInitials(group.title)}
                  </GroupBadge>
                  <GroupCopy>
                    <GroupTitle>{group.title}</GroupTitle>
                    <GroupDescription>{group.description}</GroupDescription>
                  </GroupCopy>
                  <GroupCount $accent={group.accent}>{group.routes.length}</GroupCount>
                </GroupHeader>
                <GroupRoutes>
                  {group.routes.map((route) => (
                    <RouteChip
                      key={route.path}
                      to={route.path}
                      title={route.note}
                      $variant="admin"
                      $accent={group.accent}
                    >
                      <ChipDot aria-hidden="true" $variant="admin" $accent={group.accent} />
                      <span>{route.title}</span>
                    </RouteChip>
                  ))}
                </GroupRoutes>
              </GroupSection>
            ))}
          </Groups>
        </RouteHalf>

        <RouteHalf $variant="broadcast">
          <SectionHeader>
            <SectionTitle>Broadcast Navigator</SectionTitle>
            <SectionHint>New tab overlays</SectionHint>
          </SectionHeader>
          <Groups aria-label="Broadcast route groups">
            {broadcastGroups.map((group) => (
              <GroupSection key={group.title} $variant="broadcast" $accent={group.accent}>
                <GroupHeader>
                  <GroupBadge $variant="broadcast" $accent={group.accent} aria-hidden="true">
                    {getGroupInitials(group.title)}
                  </GroupBadge>
                  <GroupCopy>
                    <GroupTitle>{group.title}</GroupTitle>
                    <GroupDescription>{group.description}</GroupDescription>
                  </GroupCopy>
                  <GroupCount $accent={group.accent}>{group.routes.length}</GroupCount>
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
                      $accent={group.accent}
                    >
                      <ChipDot aria-hidden="true" $variant="broadcast" $accent={group.accent} />
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
    radial-gradient(circle at 12% 8%, rgba(var(--project-primary-rgb, 239, 68, 68), 0.32), transparent 28%),
    radial-gradient(circle at 84% 14%, rgba(var(--project-secondary-rgb, 56, 189, 248), 0.24), transparent 30%),
    linear-gradient(135deg, rgba(var(--project-accent-rgb, 191, 255, 0), 0.08), transparent 34%),
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
  width: min(1420px, calc(100% - 48px));
  margin: 0 auto;
  padding: 28px 0 48px;

  @media (max-width: 720px) {
    width: min(100% - 28px, 1420px);
    padding: 18px 0 34px;
  }
`;

const WindowBar = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 54px;
  margin-bottom: 34px;
  padding: 0 18px;
  border: 1px solid rgba(var(--project-primary-rgb, 239, 68, 68), 0.28);
  border-radius: 8px;
  background:
    linear-gradient(90deg, rgba(var(--project-primary-rgb, 239, 68, 68), 0.18), transparent 42%),
    rgba(2, 6, 23, 0.64);
  box-shadow: 0 18px 52px rgba(0, 0, 0, 0.26);
  backdrop-filter: blur(14px);
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
  font-size: 0.86rem;
  font-weight: 800;
  flex: 1;
`;

const LogoutButton = styled.button`
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid rgba(var(--project-danger-rgb, 239, 68, 68), 0.46);
  border-radius: 8px;
  background: rgba(var(--project-danger-rgb, 239, 68, 68), 0.16);
  color: var(--project-text-primary, #ffffff);
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 900;

  &:hover {
    background: var(--project-danger, #ef4444);
  }
`;

const Header = styled.header`
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 34px;
  margin-bottom: 34px;

  @media (max-width: 900px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const TitleBlock = styled.div`
  display: grid;
  gap: 12px;
  max-width: 920px;
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
  font-size: clamp(3rem, 6vw, 6.8rem);
  line-height: 0.9;
  letter-spacing: 0;
  text-shadow: 0 0 32px rgba(var(--project-primary-rgb, 239, 68, 68), 0.32);
`;

const Subtitle = styled.p`
  max-width: 820px;
  margin: 0;
  color: var(--project-text-secondary, #a8b3c7);
  font-size: clamp(1rem, 1.4vw, 1.12rem);
  line-height: 1.6;
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(112px, 1fr));
  gap: 14px;
  min-width: 300px;

  @media (max-width: 900px) {
    min-width: 0;
  }
`;

const Stat = styled.div`
  display: grid;
  align-content: center;
  gap: 4px;
  min-height: 122px;
  padding: 24px;
  border: 1px solid var(--project-border, rgba(148, 163, 184, 0.22));
  border-radius: 8px;
  background:
    linear-gradient(145deg, rgba(var(--project-secondary-rgb, 56, 189, 248), 0.18), rgba(2, 6, 23, 0.54)),
    var(--project-surface, #111827);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
`;

const RouteHalf = styled.section<{ $variant: "admin" | "broadcast" }>`
  display: grid;
  align-content: start;
  gap: 24px;
  margin-top: 22px;
  padding: clamp(20px, 2.5vw, 32px);
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
  box-shadow: 0 22px 70px rgba(0, 0, 0, 0.34);
  backdrop-filter: blur(12px);
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22px;
  padding-bottom: 4px;

  @media (max-width: 560px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: var(--project-text-primary, #ffffff);
  font-size: clamp(1.28rem, 2vw, 1.75rem);
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
  font-size: 2.35rem;
  line-height: 1;
`;

const StatLabel = styled.span`
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.88rem;
  font-weight: 700;
`;

const Groups = styled.section`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;

  @media (min-width: 1500px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const GroupSection = styled.section<{ $variant: "admin" | "broadcast"; $accent: GroupAccent }>`
  position: relative;
  min-width: 0;
  min-height: 0;
  padding: clamp(20px, 2vw, 28px);
  overflow: hidden;
  border: 1px solid ${({ $accent }) => $accent.line};
  border-radius: 8px;
  background:
    radial-gradient(circle at 10% 0%, ${({ $accent }) => $accent.glow}, transparent 34%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.08), transparent 36%),
    linear-gradient(
      145deg,
      ${({ $accent }) => $accent.glow},
      rgba(10, 15, 24, 0.88) 54%
    ),
    var(--project-surface-alt, #1f293d);
  box-shadow:
    0 18px 42px rgba(0, 0, 0, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;

  &::before {
    content: "";
    position: absolute;
    inset: 0 0 auto;
    height: 3px;
    background: ${({ $accent }) =>
      `linear-gradient(90deg, ${$accent.line}, transparent)`};
  }

  &::after {
    content: "";
    position: absolute;
    right: -48px;
    top: -48px;
    width: 128px;
    height: 128px;
    border: 1px solid ${({ $accent }) => $accent.line};
    opacity: 0.18;
    border-radius: 999px;
  }

  &:hover {
    border-color: ${({ $accent }) => $accent.line};
    box-shadow:
      0 24px 52px rgba(0, 0, 0, 0.28),
      0 0 36px ${({ $accent }) => $accent.glow},
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
  }
`;

const GroupHeader = styled.div`
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr) auto;
  align-items: start;
  gap: 16px;
  margin-bottom: 22px;
`;

const GroupBadge = styled.div<{ $variant: "admin" | "broadcast"; $accent: GroupAccent }>`
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  border: 1px solid ${({ $accent }) => $accent.line};
  border-radius: 8px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(2, 6, 23, 0.38)),
    ${({ $accent }) => $accent.badge};
  color: var(--project-text-primary, #ffffff);
  font-size: 0.88rem;
  font-weight: 900;
  box-shadow:
    inset 0 0 20px rgba(255, 255, 255, 0.04),
    0 0 22px ${({ $accent }) => $accent.glow};
`;

const GroupCopy = styled.div`
  min-width: 0;
`;

const GroupTitle = styled.h3`
  margin: 0;
  color: var(--project-text-primary, #ffffff);
  font-size: clamp(1.18rem, 1.6vw, 1.42rem);
  line-height: 1.1;
`;

const GroupDescription = styled.p`
  max-width: 540px;
  margin: 8px 0 0;
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.95rem;
  line-height: 1.55;
`;

const GroupCount = styled.div<{ $accent: GroupAccent }>`
  min-width: 36px;
  height: 32px;
  display: grid;
  place-items: center;
  border: 1px solid ${({ $accent }) => $accent.line};
  border-radius: 999px;
  background: rgba(2, 6, 23, 0.56);
  color: ${({ $accent }) => $accent.line};
  font-size: 0.78rem;
  font-weight: 900;
`;

const GroupRoutes = styled.div`
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(168px, 1fr));
  gap: 12px;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const chipStyles = `
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  width: 100%;
  padding: 9px 14px 9px 11px;
  border: 1px solid var(--chip-border);
  border-radius: 999px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent),
    rgba(2, 6, 23, 0.7);
  color: var(--project-text-primary, #e0f2fe);
  font-size: 0.9rem;
  font-weight: 800;
  text-decoration: none;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  transition: background 160ms ease, border-color 160ms ease, transform 160ms ease, color 160ms ease;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover {
    border-color: var(--chip-hover-border);
    background: var(--chip-hover-bg);
    color: #ffffff;
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid var(--project-accent, #5eead4);
    outline-offset: 2px;
  }
`;

const RouteChip = styled(Link)<{ $variant: "admin" | "broadcast"; $accent: GroupAccent }>`
  ${chipStyles}
  --chip-border: ${({ $accent }) => $accent.line};
  --chip-hover-border: ${({ $accent }) => $accent.line};
  --chip-hover-bg: ${({ $accent }) => $accent.glow};
`;

const AnchorChip = styled.a<{ $variant: "admin" | "broadcast"; $accent: GroupAccent }>`
  ${chipStyles}
  --chip-border: ${({ $accent }) => $accent.line};
  --chip-hover-border: ${({ $accent }) => $accent.line};
  --chip-hover-bg: ${({ $accent }) => $accent.glow};
`;

const ChipDot = styled.span<{ $variant: "admin" | "broadcast"; $accent: GroupAccent }>`
  flex: 0 0 auto;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: ${({ $accent }) => $accent.line};
  box-shadow: 0 0 14px ${({ $accent }) => $accent.line};
`;
