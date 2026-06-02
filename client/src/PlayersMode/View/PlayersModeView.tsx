import React from "react";
import styled, { createGlobalStyle } from "styled-components";
import useLiveStandingsController from "../../LiveStandingsTable/Controller/useLiveStandingsController";
import { Player, Team } from "../../LiveStandingsTable/Datamapper/liveStandingsMapper";

const fallbackLogo = (team: Team) => team.teamTag || String(team.id || "TM").slice(0, 3);

const getStatusLabel = (player: Player) => {
  if (player.status === "dead" || player.hasRecalled) return "OUT";
  if (player.status === "knocked" || player.isKnocked) return "KNOCK";
  return "LIVE";
};

const getHealthColor = (player: Player) => {
  if (player.status === "dead" || player.hasRecalled) return "#64748b";
  if (player.status === "knocked" || player.isKnocked) return "#f59e0b";
  if (player.hpPercent <= 35) return "#ef4444";
  return "#22c55e";
};

const normalizePlayers = (players: Player[] = []) =>
  Array.from({ length: 4 }, (_, index) => players[index] || null);

const TeamPanel = ({ team }: { team: Team }) => {
  const isTeamOut = team.isEliminated || team.playersAlive <= 0;
  const players = normalizePlayers(team.players);

  return (
    <Panel $dead={isTeamOut}>
      <TeamHeader>
        <LogoWrap>
          {team.logoUrl ? (
            <TeamLogo src={team.logoUrl} alt="" />
          ) : (
            <LogoFallback>{fallbackLogo(team)}</LogoFallback>
          )}
        </LogoWrap>
        <TeamInfo>
          <TeamName>{team.name}</TeamName>
          <MetaLine>
            <span>ID {team.permanentTeamId || team.id}</span>
            {team.roomTeamId ? <span>Room {team.roomTeamId}</span> : null}
            <span>{team.playersAlive}/{team.totalPlayers || 4} alive</span>
          </MetaLine>
        </TeamInfo>
        <KillsBox>
          <strong>{team.liveKills ?? team.kills}</strong>
          <span>Kills</span>
        </KillsBox>
      </TeamHeader>

      <PlayersGrid>
        {players.map((player, index) => (
          <PlayerCard key={player?.id || `${team.id}-${index}`} $dead={!player || player.status === "dead" || player.hasRecalled}>
            <PlayerImageWrap>
              {player?.playerPic ? (
                <PlayerImage src={player.playerPic} alt="" />
              ) : (
                <PlayerPlaceholder>{index + 1}</PlayerPlaceholder>
              )}
              <StatusBadge $color={player ? getHealthColor(player) : "#64748b"}>
                {player ? getStatusLabel(player) : "EMPTY"}
              </StatusBadge>
            </PlayerImageWrap>
            <PlayerName>{player?.name || "Waiting"}</PlayerName>
            <HealthBar>
              <HealthFill
                $color={player ? getHealthColor(player) : "#64748b"}
                $width={player ? player.hpPercent : 0}
              />
            </HealthBar>
            <HealthText>{player ? `${Math.max(0, Math.round(player.hp))}/${player.maxHp}` : "0/200"}</HealthText>
          </PlayerCard>
        ))}
      </PlayersGrid>
    </Panel>
  );
};

const PlayersModeView: React.FC = () => {
  const { standings, loading, matchNumber, dayName, modeName } = useLiveStandingsController();
  const teams = standings.filter((team) => team.isPlaying || team.players.length > 0);

  return (
    <Page>
      <GlobalPlayersModeStyles />
      <TopBar>
        <Title>Players Mode</Title>
        <MatchInfo>
          <span>Match {matchNumber || "-"}</span>
          <span>{dayName || "Live"}</span>
          <span>{modeName || "Broadcast"}</span>
        </MatchInfo>
      </TopBar>

      {loading && teams.length === 0 ? (
        <EmptyState>Waiting for live players...</EmptyState>
      ) : (
        <TeamsGrid>
          {teams.map((team) => (
            <TeamPanel key={`${team.id}-${team.roomTeamId || "room"}`} team={team} />
          ))}
        </TeamsGrid>
      )}
    </Page>
  );
};

export default PlayersModeView;

const GlobalPlayersModeStyles = createGlobalStyle`
  html,
  body,
  #root {
    min-height: 100%;
    margin: 0;
    background: #06080d;
  }
`;

const Page = styled.main`
  min-height: 100vh;
  padding: 22px;
  color: #f8fafc;
  background:
    radial-gradient(circle at top left, rgba(239, 68, 68, 0.22), transparent 34%),
    linear-gradient(180deg, #0b1020 0%, #06080d 100%);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
`;

const TopBar = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 18px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 28px;
  letter-spacing: 0;
  text-transform: uppercase;
`;

const MatchInfo = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;

  span {
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: rgba(15, 23, 42, 0.72);
    border-radius: 6px;
    padding: 8px 10px;
    font-size: 13px;
    color: #cbd5e1;
  }
`;

const TeamsGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 1000px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.article<{ $dead: boolean }>`
  min-width: 0;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.8);
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.28);
  opacity: ${(props) => (props.$dead ? 0.46 : 1)};
  filter: ${(props) => (props.$dead ? "grayscale(0.75)" : "none")};
  transition: opacity 180ms ease, filter 180ms ease;
`;

const TeamHeader = styled.div`
  display: grid;
  grid-template-columns: 68px minmax(0, 1fr) 72px;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(90deg, rgba(239, 68, 68, 0.28), rgba(15, 23, 42, 0.22));
`;

const LogoWrap = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: rgba(2, 6, 23, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.12);
  overflow: hidden;
`;

const TeamLogo = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const LogoFallback = styled.span`
  font-size: 18px;
  font-weight: 900;
`;

const TeamInfo = styled.div`
  min-width: 0;
`;

const TeamName = styled.h2`
  margin: 0 0 7px;
  font-size: 22px;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MetaLine = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  color: #cbd5e1;
  font-size: 12px;
  text-transform: uppercase;
`;

const KillsBox = styled.div`
  text-align: center;
  border-radius: 8px;
  padding: 8px 6px;
  background: rgba(2, 6, 23, 0.66);

  strong {
    display: block;
    font-size: 24px;
  }

  span {
    font-size: 11px;
    color: #94a3b8;
    text-transform: uppercase;
  }
`;

const PlayersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  padding: 12px;
`;

const PlayerCard = styled.div<{ $dead: boolean }>`
  min-width: 0;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(2, 6, 23, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.1);
  opacity: ${(props) => (props.$dead ? 0.38 : 1)};
  filter: ${(props) => (props.$dead ? "grayscale(1)" : "none")};
`;

const PlayerImageWrap = styled.div`
  position: relative;
  aspect-ratio: 1 / 1;
  background: #111827;
`;

const PlayerImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const PlayerPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 34px;
  font-weight: 900;
  color: #64748b;
`;

const StatusBadge = styled.div<{ $color: string }>`
  position: absolute;
  left: 8px;
  bottom: 8px;
  border-radius: 5px;
  padding: 4px 6px;
  background: ${(props) => props.$color};
  color: #020617;
  font-size: 10px;
  font-weight: 900;
`;

const PlayerName = styled.div`
  padding: 8px 8px 6px;
  min-height: 34px;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const HealthBar = styled.div`
  height: 8px;
  margin: 0 8px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(148, 163, 184, 0.22);
`;

const HealthFill = styled.div<{ $width: number; $color: string }>`
  width: ${(props) => Math.max(0, Math.min(100, props.$width))}%;
  height: 100%;
  background: ${(props) => props.$color};
  transition: width 160ms ease;
`;

const HealthText = styled.div`
  padding: 6px 8px 8px;
  color: #cbd5e1;
  font-size: 11px;
  text-align: right;
`;

const EmptyState = styled.div`
  height: calc(100vh - 110px);
  display: grid;
  place-items: center;
  color: #cbd5e1;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.64);
`;
