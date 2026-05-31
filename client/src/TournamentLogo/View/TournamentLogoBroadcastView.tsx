import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import {
  TournamentLogo,
  getTournamentLogoName,
  getTournamentLogoUrl,
  getTournamentLogosApi,
  isTournamentLogoActive,
} from "../Repository/remote";

const TournamentLogoBroadcastView: React.FC = () => {
  const [logos, setLogos] = useState<TournamentLogo[]>([]);
  const [error, setError] = useState("");

  const activeLogo = useMemo(() => logos.find((logo) => isTournamentLogoActive(logo)), [logos]);
  const activeLogoUrl = getTournamentLogoUrl(activeLogo);

  useEffect(() => {
    let mounted = true;

    const loadLogos = async () => {
      try {
        const rows = await getTournamentLogosApi();
        if (mounted) {
          setLogos(rows);
          setError("");
        }
      } catch (err: any) {
        if (mounted) {
          setError(err?.response?.data?.message || err?.message || "Failed to load tournament logo");
        }
      }
    };

    loadLogos();
    const interval = window.setInterval(loadLogos, 5000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <Stage>
      <LogoWrap>
        {activeLogoUrl ? (
          <>
            <Shine aria-hidden="true" />
            <LogoImage src={activeLogoUrl} alt={getTournamentLogoName(activeLogo as TournamentLogo)} />
          </>
        ) : (
          <Fallback>{error || "No active tournament logo"}</Fallback>
        )}
      </LogoWrap>
    </Stage>
  );
};

export default TournamentLogoBroadcastView;

const shimmer = keyframes`
  0% {
    transform: translateX(-150%) skewX(-18deg);
    opacity: 0;
  }
  18% {
    opacity: 0.95;
  }
  56% {
    opacity: 0.7;
  }
  100% {
    transform: translateX(150%) skewX(-18deg);
    opacity: 0;
  }
`;

const floatIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(14px) scale(0.94);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const Stage = styled.main`
  min-height: 100vh;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: transparent;
  font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`;

const LogoWrap = styled.section`
  position: relative;
  display: grid;
  place-items: center;
  width: min(34vw, 520px);
  min-width: 260px;
  aspect-ratio: 1 / 1;
  animation: ${floatIn} 700ms ease both;
`;

const Shine = styled.div`
  position: absolute;
  z-index: 2;
  inset: 0;
  overflow: hidden;
  border-radius: 50%;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.28), transparent 34%, rgba(255, 255, 255, 0.1) 52%, transparent 72%),
    radial-gradient(ellipse at 28% 20%, rgba(255, 255, 255, 0.45), transparent 36%),
    radial-gradient(ellipse at 70% 80%, rgba(255, 255, 255, 0.16), transparent 42%);
  opacity: 0.82;
  pointer-events: none;
  mix-blend-mode: screen;

  &::before {
    content: "";
    position: absolute;
    top: -20%;
    bottom: -20%;
    left: 0;
    width: 48%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.9), transparent);
    animation: ${shimmer} 2.7s ease-in-out infinite;
  }
`;

const LogoImage = styled.img`
  position: relative;
  z-index: 1;
  max-width: 86%;
  max-height: 74%;
  object-fit: contain;
  filter: none;
`;

const Fallback = styled.div`
  display: grid;
  place-items: center;
  min-width: 280px;
  min-height: 120px;
  padding: 1rem 1.4rem;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.62);
  color: rgba(255, 255, 255, 0.82);
  font-size: 1rem;
  font-weight: 800;
`;
