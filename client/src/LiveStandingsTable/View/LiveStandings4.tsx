import React, { useEffect, useState } from "react";
import styled, { keyframes, css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";

/* ================= ANIMATIONS ================= */

const pulseHealth = keyframes`
  0% { box-shadow: 0 0 2px #FF3E3E; filter: brightness(1); }
  50% { box-shadow: 0 0 10px #FF3E3E; filter: brightness(1.4); }
  100% { box-shadow: 0 0 2px #FF3E3E; filter: brightness(1); }
`;

/* ================= CONFIGURATION ================= */

const DIMENSIONS = {
  ROW_HEIGHT: 44,
  SKEW: -20,
  GAP: 4,
  RANK_W: 80,
  NAME_W: 240,
  KILLS_W: 80,
  STATUS_W: 130,
};

const ELIMINATION_BANNER_MS = 3200;

const Theme = {
  accent: "#FFB400",
  danger: "#FF3E3E",
  warning: "#FFEA00",
  plateBg: "rgba(15, 17, 20, 0.98)",
  headerBg: "#08090b",
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

/* ================= ATOMIC COMPONENTS ================= */

const TableWrapper = styled.div`
  position: fixed;
  right: 40px;
  top: 50%;
  transform: translateY(-50%);
  font-family: 'Oswald', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const RowLayout = styled(motion.div)<{ isAlive: boolean }>`
  display: flex;
  gap: ${DIMENSIONS.GAP}px;
  align-items: center;
  position: relative;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden; /* Keeps the elimination banner contained */

  ${props => !props.isAlive && css`
    filter: grayscale(0.7) brightness(0.55);
  `}
`;

/* The Red Banner that overlaps from Rank to Kills */
const EliminatedBanner = styled(motion.div)`
  position: absolute;
  left: 0;
  /* Width covers Rank + Name + Kills + Gaps */
  width: ${DIMENSIONS.RANK_W + DIMENSIONS.NAME_W + DIMENSIONS.KILLS_W + (DIMENSIONS.GAP * 2)}px;
  height: 100%;
  background: ${Theme.danger};
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: skewX(${DIMENSIONS.SKEW}deg);
  border-right: 4px solid rgba(255,180,0,0.75);
  box-shadow: 10px 0 20px rgba(0,0,0,0.5);
`;

const EliminatedText = styled.div`
  color: #fff;
  font-weight: 900;
  font-size: 24px;
  letter-spacing: 8px;
  text-transform: uppercase;
  font-style: italic;
  /* Reverse skew to keep text straight */
  transform: skewX(${-DIMENSIONS.SKEW}deg); 
  text-shadow: 2px 2px 0px rgba(0,0,0,0.3);
`;

const Plate = styled.div<{ width: number; bg?: string; isHeader?: boolean; borderAccent?: string; isDimmed?: boolean }>`
  width: ${props => props.width}px;
  height: ${DIMENSIONS.ROW_HEIGHT}px;
  background: ${props => props.isDimmed ? "rgba(7,8,11,0.98)" : props.bg || Theme.plateBg};
  transform: skewX(${DIMENSIONS.SKEW}deg);
  display: flex;
  align-items: center;
  position: relative;
  border-top: 1px solid ${Theme.border};
  
  ${props => props.isHeader && css`
    background: ${Theme.headerBg};
    border-top: 2px solid ${props.borderAccent || Theme.accent};
  `}

  ${props => props.borderAccent && !props.isHeader && css`
    border-right: 4px solid ${props.borderAccent};
  `}
`;

const Content = styled.div`
  transform: skewX(${-DIMENSIONS.SKEW}deg);
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0 15px;
`;

/* ================= STATUS/HEALTH COMPONENTS ================= */

const HPGroup = styled.div`
  display: flex;
  gap: 6px;
  justify-content: center;
  width: 100%;
`;

const PlayerBarContainer = styled.div<{ isDead: boolean; isLow: boolean }>`
  width: 9px;
  height: 24px;
  background: rgba(0, 0, 0, 0.6);
  position: relative;
  box-sizing: border-box;
  border: ${props => props.isDead 
    ? `1.5px solid ${Theme.danger}` 
    : `1px solid rgba(255, 255, 255, 0.15)`};

  ${props => props.isLow && !props.isDead && css`
    animation: ${pulseHealth} 0.8s infinite;
    border-color: ${Theme.danger};
  `}
`;

const HealthFill = styled.div<{ percent: number; isKnocked: boolean }>`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: ${props => props.percent}%;
  background: ${props => {
    if (props.isKnocked) return Theme.danger;
    if (props.percent < 30) return Theme.warning;
    return Theme.accent;
  }};
  transition: height 0.3s ease;
`;

const TeamLogo = styled.img`
  width: 24px;
  height: 24px;
  object-fit: contain;
`;

const CountryLogo = styled.img`
  width: 22px;
  height: 22px;
  object-fit: cover;
  border-radius: 50%;
`;

const TeamIdentity = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

const CountryBadge = styled.div`
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border-radius: 50%;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.16);
`;

const TeamLogoBadge = styled.div`
  width: 32px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  background: rgba(0,0,0,0.35);
  border: 1px solid rgba(255,255,255,0.12);
  transform: skewX(${DIMENSIONS.SKEW}deg);

  ${TeamLogo} {
    transform: skewX(${-DIMENSIONS.SKEW}deg);
  }
`;

const Label = styled.div<{ color?: string; bold?: boolean }>`
  font-size: ${props => props.bold ? '22px' : '13px'};
  font-weight: 900;
  text-transform: uppercase;
  color: ${props => props.color || "#fff"};
  width: 100%;
  text-align: center;
`;

const TeamNameText = styled.span`
  min-width: 0;
  padding: 4px 10px;
  font-weight: 700;
  font-size: 19px;
  color: #fff;
  text-transform: uppercase;
  line-height: 1;
  background: rgba(255,255,255,0.07);
  border-left: 2px solid ${Theme.accent};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const getTeamTag = (team: Team) => team.teamTag || team.shortName || team.tag || team.name || "";

const TimedEliminatedBanner = ({ isAlive }: { isAlive: boolean }) => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (isAlive) {
      setShowBanner(false);
      return;
    }

    setShowBanner(true);
    const timer = window.setTimeout(() => setShowBanner(false), ELIMINATION_BANNER_MS);

    return () => window.clearTimeout(timer);
  }, [isAlive]);

  return (
    <AnimatePresence>
      {showBanner && (
        <EliminatedBanner
          initial={{ x: "-100%" }}
          animate={{ x: "0%" }}
          exit={{ x: "40%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        >
          <EliminatedText>ELIMINATED</EliminatedText>
        </EliminatedBanner>
      )}
    </AnimatePresence>
  );
};

/* ================= MAIN COMPONENT ================= */

const StandingsTable = ({ teams = [] }: { teams?: Team[] }) => {
  return (
    <TableWrapper>
      {/* HEADER ROW */}
      <RowLayout isAlive={true}>
        <Plate width={DIMENSIONS.RANK_W} bg={Theme.headerBg} isHeader>
          <Content><Label>RANK</Label></Content>
        </Plate>
        <Plate width={DIMENSIONS.NAME_W} isHeader>
          <Content><Label style={{ textAlign: 'left', paddingLeft: '36px' }}>TEAM NAME</Label></Content>
        </Plate>
        <Plate width={DIMENSIONS.KILLS_W} isHeader>
          <Content><Label>KILLS</Label></Content>
        </Plate>
        <Plate width={DIMENSIONS.STATUS_W} isHeader>
          <Content><Label>ALIVE</Label></Content>
        </Plate>
      </RowLayout>

      {/* DATA ROWS */}
      <AnimatePresence mode="popLayout">
        {teams.sort((a, b) => a.rank - b.rank).map((team) => {
          const isAlive = team.playersAlive > 0;
          
          return (
            <RowLayout
              key={team.id}
              isAlive={isAlive}
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
            >
              {/* ELIMINATED OVERLAY - Slides in when team dies */}
              <TimedEliminatedBanner isAlive={isAlive} />

              {/* Rank */}
              <Plate width={DIMENSIONS.RANK_W} isDimmed={!isAlive}>
                <Content>
                   <Label bold color={isAlive ? Theme.accent : "#555"}>{team.rank}</Label>
                </Content>
              </Plate>

              {/* Logo + Name */}
              <Plate width={DIMENSIONS.NAME_W} isDimmed={!isAlive}>
                <Content>
                  <TeamIdentity>
                    {team.countryUrl && (
                      <CountryBadge>
                        <CountryLogo
                          src={team.countryUrl}
                          alt={`${getTeamTag(team)} country`}
                        />
                      </CountryBadge>
                    )}
                    <TeamLogoBadge>
                      <TeamLogo src={team.logoUrl} alt={getTeamTag(team)} />
                    </TeamLogoBadge>
                    <TeamNameText>{getTeamTag(team)}</TeamNameText>
                  </TeamIdentity>
                </Content>
              </Plate>

              {/* Kills */}
              <Plate width={DIMENSIONS.KILLS_W} isDimmed={!isAlive}>
                <Content>
                  <Label bold color={isAlive ? Theme.accent : "#555"}>{team.kills}</Label>
                </Content>
              </Plate>

              {/* Status Plate (Stays visible as dead signs) */}
              <Plate width={DIMENSIONS.STATUS_W} borderAccent={isAlive ? Theme.accent : Theme.danger} isDimmed={!isAlive}>
                <Content>
                  <HPGroup>
                    {team.players.map((p, i) => {
                      const isDead = p.status === 'dead';
                      const isLow = p.hpPercent > 0 && p.hpPercent < 30;
                      return (
                        <PlayerBarContainer key={i} isDead={isDead} isLow={isLow}>
                          {!isDead && (
                            <HealthFill 
                              percent={p.hpPercent} 
                              isKnocked={p.isKnocked} 
                            />
                          )}
                        </PlayerBarContainer>
                      );
                    })}
                  </HPGroup>
                </Content>
              </Plate>
            </RowLayout>
          );
        })}
      </AnimatePresence>
    </TableWrapper>
  );
};

export default StandingsTable;
