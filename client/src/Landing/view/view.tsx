import React from "react";
import { Link } from "react-router-dom";
import styled, { createGlobalStyle, keyframes } from "styled-components";
import { useLandingController } from "../controller/controller";

const tournamentStats = [
  { value: "LIVE", label: "Broadcast Ready" },
  { value: "24/7", label: "Control Room" },
  { value: "PRO", label: "Esports Tools" },
];

const eventHighlights = [
  "Live standings overlays",
  "Result and MVP production",
  "Team assets and banners",
  "Tournament-ready admin deck",
];

const productionSteps = [
  {
    title: "Register Teams",
    text: "Upload rosters, country marks, team logos, and player identity assets.",
  },
  {
    title: "Control Match Day",
    text: "Manage match details, results, MVP screens, and tournament assets.",
  },
  {
    title: "Go Broadcast",
    text: "Open clean overlays for standings, eliminations, match number, and results.",
  },
];

const LandingView: React.FC = () => {
  const { developerUrl, loginPath } = useLandingController();

  return (
    <Page>
      <LandingGlobalStyles />
      <Hero>
        <HeroBackdrop aria-hidden="true" />
        <HeroFx aria-hidden="true">
          <span />
          <span />
          <span />
        </HeroFx>
        <TopNav>
          <Brand>
            <BrandMark>FF</BrandMark>
            <BrandText>
              <span>Garena Free Fire</span>
              <strong>Freefire Esports Nepal</strong>
            </BrandText>
          </Brand>
          <NavActions>
            <NavLink to={loginPath}>Host Tournament</NavLink>
            <DeveloperLink href={developerUrl} target="_blank" rel="noreferrer">
              Meet Developer
            </DeveloperLink>
          </NavActions>
        </TopNav>

        <HeroContent>
          <Kicker>Welcome to Garena Free Fire Esports</Kicker>
          <Title>Build the event. Run the room. Own the stream.</Title>
          <Subtitle>
            A tournament command center for serious Free Fire productions, from
            team setup to live overlays and result screens.
          </Subtitle>

          <HeroActions>
            <PrimaryCta to={loginPath}>Want to Host Tournament</PrimaryCta>
            <SecondaryCta href={developerUrl} target="_blank" rel="noreferrer">
              Want to Meet Developer
            </SecondaryCta>
          </HeroActions>
        </HeroContent>

        <StatsStrip aria-label="Tournament platform highlights">
          {tournamentStats.map((stat) => (
            <StatBlock key={stat.label}>
              <StatValue>{stat.value}</StatValue>
              <StatLabel>{stat.label}</StatLabel>
            </StatBlock>
          ))}
        </StatsStrip>
      </Hero>

      <Section>
        <SectionIntro>
          <SectionKicker>Tournament Hosting</SectionKicker>
          <SectionTitle>Everything you need before the first drop.</SectionTitle>
          <SectionText>
            Purpose-built pages for organizers who want a clean control room,
            polished broadcast graphics, and fast setup on event day.
          </SectionText>
        </SectionIntro>
        <FeatureGrid>
          {eventHighlights.map((item, index) => (
            <FeatureCard key={item}>
              <FeatureNumber>{String(index + 1).padStart(2, "0")}</FeatureNumber>
              <FeatureText>{item}</FeatureText>
            </FeatureCard>
          ))}
        </FeatureGrid>
      </Section>

      <ProcessBand>
        <ProcessInner>
          <SectionIntro>
            <SectionKicker>Production Flow</SectionKicker>
            <SectionTitle>From registration desk to final scoreboard.</SectionTitle>
          </SectionIntro>
          <ProcessGrid>
            {productionSteps.map((step, index) => (
              <ProcessCard key={step.title}>
                <ProcessIndex>{String(index + 1).padStart(2, "0")}</ProcessIndex>
                <ProcessTitle>{step.title}</ProcessTitle>
                <ProcessText>{step.text}</ProcessText>
              </ProcessCard>
            ))}
          </ProcessGrid>
        </ProcessInner>
      </ProcessBand>

      <SplitSection>
        <HostPanel>
          <PanelKicker>Start Production</PanelKicker>
          <PanelTitle>Want to host your next tournament?</PanelTitle>
          <PanelText>
            Login to open the tournament control deck and manage teams, assets,
            results, and broadcast pages from one place.
          </PanelText>
          <PanelButton to={loginPath}>Navigate to Login</PanelButton>
        </HostPanel>
        <DeveloperPanel>
          <PanelKicker>Creator</PanelKicker>
          <PanelTitle>Want to meet the developer?</PanelTitle>
          <PanelText>
            Visit Jhus Esports to connect with the team behind the production
            system and esports tools.
          </PanelText>
          <ExternalButton href={developerUrl} target="_blank" rel="noreferrer">
            Open jhuseesports.org
          </ExternalButton>
        </DeveloperPanel>
      </SplitSection>
    </Page>
  );
};

export default LandingView;

const pulse = keyframes`
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.04); }
`;

const shimmer = keyframes`
  0% { transform: translateX(-120%); }
  100% { transform: translateX(120%); }
`;

const riseIn = keyframes`
  0% { opacity: 0; transform: translateY(22px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const glowSweep = keyframes`
  0% { transform: translateX(-60%) rotate(-18deg); opacity: 0; }
  18% { opacity: 0.78; }
  55% { opacity: 0.16; }
  100% { transform: translateX(160%) rotate(-18deg); opacity: 0; }
`;

const gridDrift = keyframes`
  0% { transform: translate3d(0, 0, 0); }
  100% { transform: translate3d(56px, 56px, 0); }
`;

const redSignal = keyframes`
  0%, 100% { box-shadow: 0 0 22px rgba(242, 13, 32, 0.34); }
  50% { box-shadow: 0 0 42px rgba(242, 13, 32, 0.72); }
`;

const borderRun = keyframes`
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
`;

const LandingGlobalStyles = createGlobalStyle`
  html,
  body,
  #root {
    min-height: 100%;
    margin: 0;
  }

  body {
    overflow-x: hidden;
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.001ms !important;
      animation-iteration-count: 1 !important;
      scroll-behavior: auto !important;
      transition-duration: 0.001ms !important;
    }
  }
`;

const Page = styled.main`
  min-height: 100vh;
  color: #ffffff;
  background:
    radial-gradient(circle at 15% 32%, rgba(242, 13, 32, 0.28), transparent 28%),
    radial-gradient(circle at 84% 48%, rgba(255, 255, 255, 0.1), transparent 28%),
    linear-gradient(180deg, #050509 0%, #15151a 48%, #08080c 100%);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
`;

const Hero = styled.header`
  position: relative;
  min-height: 92vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  overflow: hidden;
  isolation: isolate;

  &::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 180px;
    background: linear-gradient(180deg, transparent, #11121b);
    z-index: -1;
  }
`;

const HeroBackdrop = styled.div`
  position: absolute;
  inset: 0;
  z-index: -2;
  background:
    linear-gradient(90deg, rgba(6, 7, 13, 0.96) 0%, rgba(6, 7, 13, 0.78) 38%, rgba(6, 7, 13, 0.2) 78%),
    linear-gradient(180deg, rgba(6, 7, 13, 0.08), rgba(6, 7, 13, 0.9)),
    url("/landing/freefire-esports-hero.png") center / cover no-repeat;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
    background-size: 56px 56px;
    mask-image: linear-gradient(90deg, #000 0%, transparent 70%);
    animation: ${gridDrift} 18s linear infinite;
  }
`;

const HeroFx = styled.div`
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      repeating-linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.045) 0,
        rgba(255, 255, 255, 0.045) 1px,
        transparent 1px,
        transparent 7px
      );
    opacity: 0.16;
    mix-blend-mode: screen;
  }

  span {
    position: absolute;
    top: -18%;
    width: 190px;
    height: 150%;
    background: linear-gradient(90deg, transparent, rgba(242, 13, 32, 0.24), rgba(255, 255, 255, 0.16), transparent);
    filter: blur(1px);
    animation: ${glowSweep} 7s ease-in-out infinite;
  }

  span:nth-child(1) {
    left: 4%;
  }

  span:nth-child(2) {
    left: 42%;
    animation-delay: 2.2s;
    animation-duration: 8.4s;
  }

  span:nth-child(3) {
    left: 72%;
    animation-delay: 4.1s;
    animation-duration: 9.2s;
  }
`;

const TopNav = styled.nav`
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 18px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  animation: ${riseIn} 700ms ease both;

  @media (max-width: 720px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const Brand = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-height: 58px;
  padding: 8px 12px 8px 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  background: rgba(5, 7, 13, 0.46);
  backdrop-filter: blur(16px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
`;

const BrandMark = styled.div`
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.36);
  background: linear-gradient(135deg, #f20d20, #9f0715);
  color: #ffffff;
  font-weight: 1000;
  box-shadow: 0 0 34px rgba(242, 13, 32, 0.42);
  animation: ${redSignal} 3.2s ease-in-out infinite;
`;

const BrandText = styled.div`
  display: grid;
  gap: 2px;

  span {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.74rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  strong {
    font-size: 1rem;
  }
`;

const NavActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 7px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  background: rgba(5, 7, 13, 0.42);
  backdrop-filter: blur(16px);
`;

const linkButton = `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 17px;
  border-radius: 8px;
  font-size: 0.86rem;
  font-weight: 950;
  color: #ffffff !important;
  text-decoration: none;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
  transform: translateZ(0);
  transition: transform 170ms ease, border-color 170ms ease, background 170ms ease, box-shadow 170ms ease, filter 170ms ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 38px rgba(0, 0, 0, 0.26);
    filter: saturate(1.16);
  }

  &:focus-visible {
    outline: 2px solid #47e6ff;
    outline-offset: 3px;
  }
`;

const NavLink = styled(Link)`
  ${linkButton}
  border: 0;
  background: linear-gradient(135deg, #f20d20, #9f0715);
  color: #ffffff !important;
`;

const DeveloperLink = styled.a`
  ${linkButton}
  border: 0;
  background: rgba(242, 13, 32, 0.16);
  color: #ffffff !important;
`;

const HeroContent = styled.div`
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  align-self: center;
  padding: 58px 0 120px;
`;

const Kicker = styled.div`
  width: fit-content;
  margin-bottom: 16px;
  padding: 8px 12px;
  border: 1px solid rgba(242, 13, 32, 0.4);
  border-left: 4px solid #f20d20;
  background: rgba(242, 13, 32, 0.16);
  color: #ffffff;
  font-size: 0.78rem;
  font-weight: 1000;
  text-transform: uppercase;
  animation: ${riseIn} 680ms ease 110ms both;
`;

const Title = styled.h1`
  max-width: 840px;
  margin: 0;
  color: #ffffff;
  font-size: clamp(3.2rem, 7.6vw, 7.2rem);
  line-height: 0.9;
  letter-spacing: 0;
  text-shadow:
    0 0 38px rgba(242, 13, 32, 0.36),
    0 4px 0 rgba(0, 0, 0, 0.28);
  animation: ${riseIn} 760ms ease 210ms both;
`;

const Subtitle = styled.p`
  max-width: 650px;
  margin: 24px 0 0;
  color: rgba(255, 255, 255, 0.78);
  font-size: clamp(1rem, 2vw, 1.22rem);
  line-height: 1.65;
  animation: ${riseIn} 760ms ease 330ms both;
`;

const HeroActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 32px;
  animation: ${riseIn} 760ms ease 450ms both;
`;

const PrimaryCta = styled(Link)`
  ${linkButton}
  position: relative;
  min-height: 56px;
  padding: 0 24px;
  overflow: hidden;
  border: 0;
  background: linear-gradient(135deg, #f20d20, #9f0715);
  color: #ffffff !important;
  box-shadow: 0 18px 48px rgba(242, 13, 32, 0.32);

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    width: 42%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.46), transparent);
    animation: ${shimmer} 3.4s ease-in-out infinite;
  }
`;

const SecondaryCta = styled.a`
  ${linkButton}
  min-height: 56px;
  padding: 0 22px;
  border: 0;
  background: rgba(242, 13, 32, 0.16);
  color: #ffffff !important;
  backdrop-filter: blur(12px);
`;

const StatsStrip = styled.div`
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding-bottom: 28px;
  animation: ${riseIn} 780ms ease 560ms both;

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

const StatBlock = styled.div`
  position: relative;
  min-height: 82px;
  padding: 18px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.1), transparent),
    rgba(8, 10, 16, 0.66);
  backdrop-filter: blur(14px);
  transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;

  &::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 4px;
    background: linear-gradient(180deg, #f20d20, #ffffff, #f20d20);
  }

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(242, 13, 32, 0.46);
    background:
      linear-gradient(145deg, rgba(242, 13, 32, 0.18), rgba(255, 255, 255, 0.08)),
      rgba(8, 10, 16, 0.76);
  }
`;

const StatValue = styled.div`
  color: #ffffff;
  font-size: 1.65rem;
  font-weight: 1000;
  animation: ${pulse} 4s ease-in-out infinite;
`;

const StatLabel = styled.div`
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.82rem;
  font-weight: 850;
  text-transform: uppercase;
`;

const Section = styled.section`
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 70px 0;
`;

const SectionIntro = styled.div`
  display: grid;
  gap: 8px;
  margin-bottom: 20px;
  animation: ${riseIn} 700ms ease both;
`;

const SectionKicker = styled.div`
  color: #f20d20;
  font-size: 0.78rem;
  font-weight: 1000;
  text-transform: uppercase;
`;

const SectionTitle = styled.h2`
  max-width: 680px;
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.7rem);
  line-height: 1;
`;

const SectionText = styled.p`
  max-width: 620px;
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.68);
  font-size: 1rem;
  line-height: 1.7;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 920px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled.article`
  position: relative;
  min-height: 150px;
  padding: 20px;
  overflow: hidden;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background:
    linear-gradient(145deg, rgba(242, 13, 32, 0.16), rgba(255, 255, 255, 0.06)),
    #121217;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.22);
  transition: transform 210ms ease, border-color 210ms ease, box-shadow 210ms ease, background 210ms ease;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    padding: 1px;
    border-radius: 8px;
    background: linear-gradient(110deg, rgba(242, 13, 32, 0.08), rgba(255, 255, 255, 0.32), rgba(242, 13, 32, 0.08));
    background-size: 200% 100%;
    mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    mask-composite: exclude;
    opacity: 0;
    animation: ${borderRun} 3.8s linear infinite;
    pointer-events: none;
  }

  &::after {
    content: "";
    position: absolute;
    right: -22px;
    top: -22px;
    width: 76px;
    height: 76px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 999px;
  }

  &:hover {
    transform: translateY(-8px);
    border-color: rgba(242, 13, 32, 0.42);
    box-shadow: 0 26px 64px rgba(0, 0, 0, 0.36);
    background:
      linear-gradient(145deg, rgba(242, 13, 32, 0.24), rgba(255, 255, 255, 0.07)),
      #15151b;
  }

  &:hover::before {
    opacity: 1;
  }
`;

const FeatureNumber = styled.div`
  color: #f20d20;
  font-size: 0.82rem;
  font-weight: 1000;
`;

const FeatureText = styled.div`
  margin-top: 28px;
  color: #ffffff;
  font-size: 1.12rem;
  font-weight: 950;
  line-height: 1.25;
`;

const ProcessBand = styled.section`
  position: relative;
  padding: 64px 0;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(242, 13, 32, 0.12), transparent 36%),
    linear-gradient(135deg, #ffffff, #f1f1f3);
  color: #10121a;

  &::before {
    content: "";
    position: absolute;
    inset: auto -10% 16px -10%;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(242, 13, 32, 0.8), #10121a, rgba(242, 13, 32, 0.8), transparent);
    animation: ${shimmer} 5.4s ease-in-out infinite;
  }
`;

const ProcessInner = styled.div`
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;

  ${SectionKicker} {
    color: #d61f35;
  }

  ${SectionTitle} {
    color: #10121a;
  }
`;

const ProcessGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 24px;

  @media (max-width: 780px) {
    grid-template-columns: 1fr;
  }
`;

const ProcessCard = styled.article`
  position: relative;
  min-height: 210px;
  padding: 22px;
  border: 1px solid rgba(16, 18, 26, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.12);
  transition: transform 210ms ease, box-shadow 210ms ease, border-color 210ms ease;

  &:hover {
    transform: translateY(-7px);
    border-color: rgba(242, 13, 32, 0.28);
    box-shadow: 0 28px 64px rgba(15, 23, 42, 0.18);
  }
`;

const ProcessIndex = styled.div`
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #10121a;
  color: #ffffff;
  font-weight: 1000;
`;

const ProcessTitle = styled.h3`
  margin: 36px 0 0;
  color: #10121a;
  font-size: 1.34rem;
`;

const ProcessText = styled.p`
  margin: 12px 0 0;
  color: rgba(16, 18, 26, 0.68);
  line-height: 1.65;
`;

const SplitSection = styled.section`
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 72px 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 780px) {
    grid-template-columns: 1fr;
  }
`;

const DecisionPanel = styled.article`
  position: relative;
  min-height: 290px;
  padding: clamp(22px, 4vw, 34px);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  display: grid;
  align-content: end;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
  transition: transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease;

  &::before {
    content: "";
    position: absolute;
    inset: 18px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    pointer-events: none;
  }

  &::after {
    content: "";
    position: absolute;
    inset: auto 0 0 0;
    height: 5px;
    background: linear-gradient(90deg, #f20d20, #ffffff, #f20d20);
    background-size: 200% 100%;
    animation: ${borderRun} 3s linear infinite;
  }

  &:hover {
    transform: translateY(-8px);
    border-color: rgba(242, 13, 32, 0.42);
    box-shadow: 0 34px 78px rgba(0, 0, 0, 0.36);
  }
`;

const HostPanel = styled(DecisionPanel)`
  background:
    linear-gradient(145deg, rgba(242, 13, 32, 0.28), rgba(255, 255, 255, 0.08)),
    #171018;
`;

const DeveloperPanel = styled(DecisionPanel)`
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.13), rgba(242, 13, 32, 0.18)),
    #0d0d12;
`;

const PanelKicker = styled.div`
  color: #ffffff;
  font-size: 0.78rem;
  font-weight: 1000;
  text-transform: uppercase;
`;

const PanelTitle = styled.h3`
  max-width: 480px;
  margin: 10px 0 0;
  font-size: clamp(1.8rem, 3vw, 3rem);
  line-height: 1;
`;

const PanelText = styled.p`
  max-width: 520px;
  margin: 16px 0 0;
  color: rgba(255, 255, 255, 0.76);
  line-height: 1.6;
`;

const PanelButton = styled(Link)`
  ${linkButton}
  width: fit-content;
  margin-top: 22px;
  border: 0;
  background: #f20d20;
  color: #ffffff !important;
`;

const ExternalButton = styled.a`
  ${linkButton}
  width: fit-content;
  margin-top: 22px;
  border: 0;
  background: #f20d20;
  color: #ffffff !important;
`;
