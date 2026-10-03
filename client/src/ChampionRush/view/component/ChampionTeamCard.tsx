import React from "react";
import styled, { keyframes } from "styled-components";
import { ChampionRushTeam } from "../../repository/remote";
import { useProjectTheme } from "../../../Theme";

export default function ChampionTeamCard({ team }: { team: ChampionRushTeam }) {
  const { broadcastSettings: settings } = useProjectTheme();
  const style = {
    "--rush-accent": settings.liveStandings2Color5,
    "--rush-accent-text": settings.liveStandings2TextColor4,
    "--rush-surface": settings.liveStandings2Color1,
    "--rush-text": settings.liveStandings2TextColor3,
  } as React.CSSProperties;
  return (
    <Card style={style}>
      <CrownPanel><img src="/images/crown.png" alt="Champion Rush crown" /></CrownPanel>
      <Details>
        <NameRow>
          {team.logoUrl && <Logo src={team.logoUrl} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
          <Name title={team.name}>{team.name}</Name>
          <Points>{team.points}<small>POINTS</small></Points>
        </NameRow>
        <Activated>CHAMPION RUSH ACTIVATED</Activated>
      </Details>
    </Card>
  );
}

const enter = keyframes`
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
`;
const Card = styled.article`
  display: flex;
  min-height: 112px;
  background: var(--rush-surface);
  color: var(--rush-text);
  box-shadow: 0 8px 24px rgba(0,0,0,.5);
  border-bottom: 3px solid var(--rush-accent);
  animation: ${enter} .5s ease-out both;
  @media (prefers-reduced-motion: reduce) { animation: none; }
`;
const CrownPanel = styled.div`
  width: 104px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  background: var(--rush-accent);
  img { width: 76px; height: 76px; object-fit: contain; }
`;
const Details = styled.div`padding: 15px 18px; flex: 1; min-width: 0;`;
const NameRow = styled.div`display: flex; align-items: center; gap: 10px;`;
const Logo = styled.img`width: 36px; height: 36px; object-fit: contain;`;
const Name = styled.div`flex: 1; min-width: 0; font-size: 20px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`;
const Points = styled.div`
  font-size: 26px;
  text-align: center;
  small { display: block; font-size: 9px; letter-spacing: 1px; }
`;
const Activated = styled.div`
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--rush-accent);
  color: var(--rush-accent);
  font-size: 15px;
  letter-spacing: 1px;
`;
