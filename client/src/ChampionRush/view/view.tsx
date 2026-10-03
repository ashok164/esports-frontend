import React from "react";
import styled from "styled-components";
import useChampionRushController from "../controller/controller";
import ChampionTeamCard from "./component/ChampionTeamCard";

export default function ChampionRushView() {
  const { teams, loading, enabled } = useChampionRushController();
  if (loading || !enabled || !teams.length) return null;
  return (
    <Overlay aria-label="Champion Rush activated teams">
      <Heading>CHAMPION RUSH <span>ACTIVATED TEAMS</span></Heading>
      <TeamList>
        {teams.map((team) => <ChampionTeamCard key={team.id} team={team} />)}
      </TeamList>
    </Overlay>
  );
}

const Overlay = styled.section`
  position: fixed;
  top: 26px;
  left: 50%;
  width: min(540px, calc(100vw - 32px));
  transform: translateX(-50%);
  font-family: "Arial Black", "Roboto Condensed", sans-serif;
  text-transform: uppercase;
  @media (min-width: 2560px) { transform: translateX(-50%) scale(1.96); transform-origin: top center; }
`;
const Heading = styled.h1`
  margin: 0 0 12px;
  color: #fff7a5;
  text-align: center;
  font-size: 28px;
  text-shadow: 0 2px 8px #000;
  span { display: block; font-size: 13px; letter-spacing: 4px; margin-top: 5px; color: white; }
`;
const TeamList = styled.div`
  display: grid;
  gap: 10px;
  max-height: calc(100vh - 115px);
  overflow-y: auto;
`;
