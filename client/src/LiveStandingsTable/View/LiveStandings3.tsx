import React from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";

/* ================= CONFIGURATION ================= */

const DIMENSIONS = {
  ROW_HEIGHT: 46,
  SKEW: -20,
  OVERLAP: -16,
  RANK_WIDTH: 80,
  // This grid must be identical in Header and Row
  GRID_LAYOUT: "34px 42px 1fr 70px 110px" 
};

const Theme = {
  gold: "linear-gradient(135deg, #FFD700 0%, #B8860B 100%)",
  silver: "linear-gradient(135deg, #E0E0E0 0%, #707070 100%)",
  bronze: "linear-gradient(135deg, #CD7F32 0%, #5C2E01 100%)",
  defaultRank: "#1c1e22",
  accent: "#FFB400",
  danger: "#FF3E3E",
  headerDark: "#08090b",
  rowBg: "rgba(15, 17, 20, 0.98)",
  border: "rgba(255, 255, 255, 0.08)",
};

interface Player {
  hpPercent: number;
  isKnocked: boolean;
  status: "alive" | "knocked" | "dead";
}

interface Team {
  id: string | number;
  rank: number;
  name: string;
  teamTag?: string;
  shortName?: string;
  tag?: string;
  logoUrl?: string;
  countryUrl?: string;
  kills: number;
  playersAlive: number;
  players: Player[];
}

/* ================= HEADER COMPONENTS ================= */

const HeaderArmor = styled.div`
  display: flex;
  align-items: flex-end;
  margin-bottom: 4px;
`;

const RankPlate = styled.div`
  width: ${DIMENSIONS.RANK_WIDTH}px;
  height: ${DIMENSIONS.ROW_HEIGHT}px;
  background: ${Theme.accent};
  transform: skewX(${DIMENSIONS.SKEW}deg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;

  span {
    transform: skewX(${-DIMENSIONS.SKEW}deg);
    color: #000;
    font-weight: 900;
    font-size: 15px;
    letter-spacing: -0.5px;
  }
`;

const MainPlate = styled.div`
  flex: 1;
  height: ${DIMENSIONS.ROW_HEIGHT}px;
  background: ${Theme.headerDark};
  margin-left: ${DIMENSIONS.OVERLAP}px;
  transform: skewX(${DIMENSIONS.SKEW}deg);
  border-top: 2px solid ${Theme.accent};
  display: flex;
  align-items: center;
  padding: 0 30px; /* Reduced to help grid alignment */
  position: relative;
`;

const HeaderGrid = styled.div`
  transform: skewX(${-DIMENSIONS.SKEW}deg);
  display: grid;
  grid-template-columns: ${DIMENSIONS.GRID_LAYOUT};
  width: 100%;
  align-items: center;
  
  div {
    font-size: 13px;
    font-weight: 900; /* Matched to row weight */
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 1px;
    opacity: 0.9;
  }
`;

/* ================= ROW COMPONENTS ================= */

const OverlayContainer = styled.div`
  position: fixed;
  right: 40px;
  top: 50%;
  transform: translateY(-50%);
  width: 580px;
  font-family: 'Oswald', sans-serif;
`;

const TeamRow = styled(motion.div)`
  display: flex;
  align-items: center;
  margin-bottom: 2px;
`;

const RankBox = styled.div<{ rank: number }>`
  width: ${DIMENSIONS.RANK_WIDTH}px;
  height: ${DIMENSIONS.ROW_HEIGHT}px;
  background: ${props => {
    if (props.rank === 1) return Theme.gold;
    if (props.rank === 2) return Theme.silver;
    if (props.rank === 3) return Theme.bronze;
    return Theme.defaultRank;
  }};
  transform: skewX(${DIMENSIONS.SKEW}deg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;

  .num {
    transform: skewX(${-DIMENSIONS.SKEW}deg);
    font-size: 26px;
    font-weight: 900;
    color: ${props => props.rank <= 3 ? "#000" : "#fff"};
    font-style: italic;
  }
`;

const RowBody = styled.div<{ isAlive: boolean }>`
  flex: 1;
  height: ${DIMENSIONS.ROW_HEIGHT}px;
  background: ${props => props.isAlive ? Theme.rowBg : "#1a0808"};
  filter: ${props => props.isAlive ? "none" : "grayscale(0.7) brightness(0.55)"};
  margin-left: ${DIMENSIONS.OVERLAP}px;
  transform: skewX(${DIMENSIONS.SKEW}deg);
  border-right: 4px solid ${props => props.isAlive ? Theme.accent : Theme.danger};
  border-top: 1px solid ${Theme.border};
  display: flex;
  align-items: center;
  padding: 0 30px;
`;

const RowContent = styled.div`
  transform: skewX(${-DIMENSIONS.SKEW}deg);
  display: grid;
  grid-template-columns: ${DIMENSIONS.GRID_LAYOUT};
  align-items: center;
  width: 100%;
`;

const TeamLogo = styled.img`
  width: 28px;
  height: 28px;
  object-fit: contain;
`;

const CountryLogo = styled.img`
  width: 22px;
  height: 22px;
  object-fit: cover;
  border-radius: 50%;
`;

const CountryBadge = styled.div`
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
`;

const TeamLogoBadge = styled.div`
  width: 34px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.32);
  border: 1px solid rgba(255,255,255,0.12);
  transform: skewX(${DIMENSIONS.SKEW}deg);

  ${TeamLogo} {
    transform: skewX(${-DIMENSIONS.SKEW}deg);
  }
`;

const TeamName = styled.div`
  font-weight: 700;
  font-size: 19px;
  color: #fff;
  text-transform: uppercase;
  padding-left: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const getTeamTag = (team: Team) => team.teamTag || team.shortName || team.tag || team.name || "";

const KillsValue = styled.div`
  font-size: 22px;
  font-weight: 900;
  text-align: center;
  color: ${Theme.accent};
`;

const HPGroup = styled.div`
  display: flex;
  gap: 4px;
  justify-content: flex-end;
  padding-right: 5px;
`;

const PlayerBar = styled.div<{ percent: number; isKnocked: boolean; isDead: boolean }>`
  width: 7px;
  height: 22px;
  background: rgba(255,255,255,0.1);
  position: relative;
  opacity: ${props => props.isDead ? 0.2 : 1};
  
  &::after {
    content: "";
    position: absolute;
    bottom: 0; left: 0; width: 100%;
    height: ${props => props.percent}%;
    background: ${props => props.isKnocked ? Theme.danger : Theme.accent};
  }
`;

/* ================= MAIN COMPONENT ================= */

const StandingsTable = ({ teams = [] }: { teams?: Team[] }) => {
  return (
    <OverlayContainer>
      {/* HEADER SECTION */}
      <HeaderArmor>
        <RankPlate>
          <span>RANK</span>
        </RankPlate>
        <MainPlate>
          <HeaderGrid>
            <div /> {/* Country Spacer */}
            <div /> {/* Logo Spacer */}
            <div>Team</div>
            <div style={{ textAlign: "center" }}>Kills</div>
            <div style={{ textAlign: "right", paddingRight: "5px" }}>Status</div>
          </HeaderGrid>
        </MainPlate>
      </HeaderArmor>

      {/* BODY SECTION */}
      <AnimatePresence mode="popLayout">
        {teams
          .sort((a, b) => a.rank - b.rank)
          .map((team) => (
            <TeamRow
              key={team.id}
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
            >
              <RankBox rank={team.rank}>
                <div className="num">{team.rank}</div>
              </RankBox>

              <RowBody isAlive={team.playersAlive > 0}>
                <RowContent>
                  <CountryBadge>
                    {team.countryUrl && (
                      <CountryLogo
                        src={team.countryUrl}
                        alt={`${getTeamTag(team)} country`}
                      />
                    )}
                  </CountryBadge>
                  <TeamLogoBadge>
                    <TeamLogo src={team.logoUrl} alt={getTeamTag(team)} />
                  </TeamLogoBadge>
                  <TeamName>
                    {getTeamTag(team)}
                  </TeamName>
                  <KillsValue>{team.kills}</KillsValue>
                  <HPGroup>
                    {team.players.slice(0, 4).map((p, i) => (
                      <PlayerBar 
                        key={i} 
                        percent={p.hpPercent} 
                        isKnocked={p.isKnocked} 
                        isDead={p.status === 'dead'}
                      />
                    ))}
                  </HPGroup>
                </RowContent>
              </RowBody>
            </TeamRow>
          ))}
      </AnimatePresence>
    </OverlayContainer>
  );
};

export default StandingsTable;
