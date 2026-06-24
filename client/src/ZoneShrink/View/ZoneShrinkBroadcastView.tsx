import React from "react";
import styled, { keyframes } from "styled-components";
import { useProjectTheme } from "../../Theme";
import {
  getZoneShrinkApi,
  getZoneShrinkState,
  patchZoneShrinkApi,
  ZONE_SHRINK_STORAGE_KEY,
  ZONE_SHRINK_UPDATED_EVENT,
  ZoneShrinkState,
} from "../zoneShrinkState";

const soundPath = "/ZoneShrinkSound/shrinkSound.mp3";
const STYLE3_ALERT_RED = "#ff1010";

const ZoneShrinkBroadcastView: React.FC = () => {
  const { broadcastSettings, isLoading: isThemeLoading } = useProjectTheme();
  const [state, setState] = React.useState<ZoneShrinkState>(getZoneShrinkState);
  const [visible, setVisible] = React.useState(false);
  const [isDissolving, setIsDissolving] = React.useState(false);
  const [secondsLeft, setSecondsLeft] = React.useState(10);
  const [soundBlocked, setSoundBlocked] = React.useState(false);
  const [soundUnlocked, setSoundUnlocked] = React.useState(false);
  const lastTriggerId = React.useRef(0);
  const timeoutRef = React.useRef<number | null>(null);
  const intervalRef = React.useRef<number | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const clearTimers = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  };

  const openOverlay = React.useCallback((nextState: ZoneShrinkState) => {
    clearTimers();
    setVisible(true);
    setIsDissolving(false);
    setSecondsLeft(nextState.durationSeconds);

    if (nextState.playSound) {
      const audio = audioRef.current || new Audio(soundPath);
      audioRef.current = audio;
      audio.preload = "auto";
      audio.volume = Math.max(0, Math.min(1, nextState.soundVolume));
      audio.currentTime = 0;
      audio
        .play()
        .then(() => setSoundBlocked(false))
        .catch(() => setSoundBlocked(true));
    }

    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(0, value - 1));
    }, 1000);

    timeoutRef.current = window.setTimeout(() => {
      setSecondsLeft(0);
      setIsDissolving(true);
      window.setTimeout(() => {
        setVisible(false);
        setIsDissolving(false);
        patchZoneShrinkApi(false).catch(() => undefined);
        clearTimers();
      }, 700);
    }, nextState.durationSeconds * 1000);
  }, []);

  const unlockSound = async () => {
    const audio = audioRef.current || new Audio(soundPath);
    audioRef.current = audio;
    audio.preload = "auto";
    audio.volume = 0.001;

    try {
      await audio.play();
      audio.pause();
      audio.currentTime = 0;
      audio.volume = Math.max(0, Math.min(1, state.soundVolume));
      setSoundUnlocked(true);
      setSoundBlocked(false);
    } catch {
      setSoundBlocked(true);
    }
  };

  React.useEffect(() => {
    const syncState = () => {
      const nextState = getZoneShrinkState();
      setState(nextState);

      if (nextState.enabled && nextState.triggerId !== lastTriggerId.current) {
        lastTriggerId.current = nextState.triggerId;
        openOverlay(nextState);
      }

      if (!nextState.enabled) {
        setVisible(false);
        setIsDissolving(false);
        clearTimers();
      }
    };

    const syncApiState = () => {
      getZoneShrinkApi()
        .then((nextState) => {
          if (nextState.enabled && nextState.triggerId !== lastTriggerId.current) {
            localStorage.setItem(ZONE_SHRINK_STORAGE_KEY, JSON.stringify(nextState));
            lastTriggerId.current = nextState.triggerId;
            setState(nextState);
            openOverlay(nextState);
          }

          if (!nextState.enabled) {
            setState(nextState);
            setVisible(false);
            setIsDissolving(false);
            clearTimers();
          }
        })
        .catch(() => undefined);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === ZONE_SHRINK_STORAGE_KEY) syncState();
    };

    syncState();
    syncApiState();
    const poll = window.setInterval(syncApiState, 1000);
    window.addEventListener(ZONE_SHRINK_UPDATED_EVENT, syncState);
    window.addEventListener("storage", handleStorage);

    return () => {
      clearTimers();
      window.clearInterval(poll);
      window.removeEventListener(ZONE_SHRINK_UPDATED_EVENT, syncState);
      window.removeEventListener("storage", handleStorage);
    };
  }, [openOverlay]);

  // Inject Google Fonts dynamic fallback directly into the document frame context if missing
  React.useEffect(() => {
    if (!document.getElementById("broadcast-font-oswald")) {
      const link = document.createElement("link");
      link.id = "broadcast-font-oswald";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Oswald:wght@400;700;900&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  if (isThemeLoading) return null;

  const isStyle2 = broadcastSettings.selectedBroadcastStyle === "theme2";
  const isStyle3 = broadcastSettings.selectedBroadcastStyle === "theme3";
  const style2Colors = {
    base: broadcastSettings.liveStandings2Color1,
    bar: broadcastSettings.liveStandings2Color2,
    accent: broadcastSettings.liveStandings2Color5,
    dark: broadcastSettings.liveStandings2Color4,
    text: broadcastSettings.liveStandings2TextColor1,
    textDark: broadcastSettings.liveStandings2TextColor2,
  };

  const formattedTimer = secondsLeft < 10 ? `0${Math.max(0, secondsLeft)}` : Math.max(0, secondsLeft);

  return (
    <Stage>
      {(soundBlocked || !soundUnlocked) && (
        <SoundUnlockButton type="button" onClick={unlockSound}>
          Enable Sound
        </SoundUnlockButton>
      )}
      {visible && (
        isStyle3 ? (
          <ZoneCardStyle3 $dissolving={isDissolving}>
            <Style3MainBanner $border={STYLE3_ALERT_RED}>
              <Style3LogoZone $background={STYLE3_ALERT_RED}>
                <Style3LogoGlow />
                <Style3ClockWrap>
                  <Style3ClockSvg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#ffffff" strokeWidth="5" />
                    <path
                      d="M50 8 L50 14 M50 92 L50 86 M8 50 L14 50 M92 50 L86 50"
                      stroke="#ffffff"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    <circle cx="50" cy="50" r="4" fill="#ffffff" />
                    <Style3ClockHand x1="50" y1="50" x2="50" y2="18" />
                  </Style3ClockSvg>
                </Style3ClockWrap>
              </Style3LogoZone>

              <Style3TextZone>
                <Style3TimerSub $color={STYLE3_ALERT_RED}>
                  {secondsLeft <= 0 ? "Zone Collapsed" : "Playzone Warning"}
                </Style3TimerSub>
                <Style3AlertMain>Zone Shrink</Style3AlertMain>
              </Style3TextZone>

              <Style3TimerZone>
                <Style3TimerStack>
                  <Style3TimerCountdown $urgent={secondsLeft <= 3}>
                    00:{formattedTimer}
                  </Style3TimerCountdown>
                </Style3TimerStack>
              </Style3TimerZone>
            </Style3MainBanner>

            <Style3BottomTickerContainer>
              <Style3BottomTicker $background={STYLE3_ALERT_RED}>
                {secondsLeft <= 0
                  ? "PLAYZONE HAS LOCKED IN"
                  : secondsLeft <= 3
                    ? "CRITICAL TIME WARNING"
                    : "ATTENTION: BLUE ZONE MOVEMENT COMMENCING"}
              </Style3BottomTicker>
            </Style3BottomTickerContainer>
          </ZoneCardStyle3>
        ) : isStyle2 ? (
          <ZoneCardStyle2 $dissolving={isDissolving}>
            <Style2Body>
              <Style2WatchPanel $accent={style2Colors.accent}>
                <Style2WatchRing>
                  <Style2WatchFace>
                    <Style2WatchTick $top="10px" $left="50%" $rotate="0deg" />
                    <Style2WatchTick $top="50%" $left="10px" $rotate="90deg" />
                    <Style2WatchTick $top="50%" $left="calc(100% - 10px)" $rotate="90deg" />
                    <Style2WatchTick $top="calc(100% - 10px)" $left="50%" $rotate="0deg" />
                    <Style2WatchHandLong />
                    <Style2WatchHandShort />
                    <Style2WatchCenter />
                  </Style2WatchFace>
                  <Style2WatchButton />
                </Style2WatchRing>
              </Style2WatchPanel>
              <Style2InfoPanel $base={style2Colors.base}>
                <Style2Header $bar={style2Colors.bar} $text={style2Colors.textDark}>Zone Shrinks In</Style2Header>
                <Style2TimerPanel $base={style2Colors.base}>
                  <Style2NumberRow $text={style2Colors.text}>
                    <Style2Number>{secondsLeft}</Style2Number>
                    <Style2Secs>SECONDS</Style2Secs>
                  </Style2NumberRow>
                </Style2TimerPanel>
              </Style2InfoPanel>
            </Style2Body>
          </ZoneCardStyle2>
        ) : (
          <ZoneCard $dissolving={isDissolving}>
            <TopStripe aria-hidden="true" />
            <BrandPanel>
              <TopLine>Zone</TopLine>
              <MainLine>Shrink</MainLine>
              <BottomLine>Closing In</BottomLine>
            </BrandPanel>
            <TimerPanel $singleDigit={secondsLeft < 10}>
              <Number $singleDigit={secondsLeft < 10}>{secondsLeft}</Number>
              <Secs>Secs</Secs>
            </TimerPanel>
          </ZoneCard>
        )
      )}
    </Stage>
  );
};

export default ZoneShrinkBroadcastView;

/* --- Animations & Keyframes --- */
const slideIn = keyframes`
  0% {
    opacity: 0;
    transform: translateX(120%);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
`;

const dissolveOut = keyframes`
  0% {
    opacity: 1;
    filter: blur(0);
    transform: translateX(0) scale(1);
  }
  100% {
    opacity: 0;
    filter: blur(8px);
    transform: translateX(22px) scale(0.96);
  }
`;

const watchSweep = keyframes`
  from {
    transform: translate(-50%, -100%) rotate(0deg);
  }
  to {
    transform: translate(-50%, -100%) rotate(360deg);
  }
`;

const watchPulse = keyframes`
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 rgba(255, 255, 255, 0.18);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 0 16px rgba(255, 255, 255, 0.18);
  }
`;

const style3ClockRotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const style3Urgent = keyframes`
  0% {
    color: #ffffff;
    text-shadow: 0 0 20px rgba(255, 26, 26, 0.7), 2px 2px 0 #ff1a1a;
  }
  100% {
    color: #ff1a1a;
    text-shadow: 0 0 30px rgba(255, 26, 26, 0.9), 2px 2px 0 #ffffff;
  }
`;

/* --- Layout Components --- */
const Stage = styled.main`
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: transparent;
  font-family: "Oswald", "Montserrat", "Arial Black", sans-serif;
`;

const SoundUnlockButton = styled.button`
  position: fixed;
  right: 14px;
  top: 14px;
  z-index: 20;
  min-height: 36px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 6px;
  background: rgba(2, 6, 23, 0.82);
  color: #ffffff;
  padding: 0 12px;
  font: 700 12px/1 "Segoe UI", sans-serif;
  cursor: pointer;
`;

/* --- Default Layout Panel --- */
const ZoneCard = styled.section<{ $dissolving: boolean }>`
  position: absolute;
  right: 8px;
  bottom: 40px;
  display: flex;
  align-items: stretch;
  width: 430px;
  height: 118px;
  overflow: hidden;
  border-radius: 8px;
  background:
    linear-gradient(105deg, var(--project-primary, #5b21b6), var(--project-surface, #21105a) 58%, var(--project-background, #130831)),
    var(--project-primary, #5b21b6);
  box-shadow: none;
  animation: ${({ $dissolving }) => ($dissolving ? dissolveOut : slideIn)}
    ${({ $dissolving }) => ($dissolving ? "700ms" : "360ms")} ease-out both;
  transform-origin: right bottom;
`;

/* --- Theme Style 2 Layout --- */
const ZoneCardStyle2 = styled.section<{ $dissolving: boolean }>`
  position: absolute;
  right: 26px;
  bottom: 40px;
  width: 348px;
  height: 108px;
  overflow: hidden;
  animation: ${({ $dissolving }) => ($dissolving ? dissolveOut : slideIn)}
    ${({ $dissolving }) => ($dissolving ? "700ms" : "360ms")} ease-out both;
  transform-origin: right bottom;

  @media (min-width: 2560px) {
    right: 26px;
    bottom: 40px;
    transform: scale(1.96);
    transform-origin: right bottom;
  }
`;

/* --- Theme Style 3 Layout (Fixes Applied Here) --- */
const ZoneCardStyle3 = styled.section<{ $dissolving: boolean }>`
  position: absolute;
  right: 26px;
  bottom: 40px;
  width: 900px; /* Perfect wide fit frame dimensions */
  animation: ${({ $dissolving }) => ($dissolving ? dissolveOut : slideIn)}
    ${({ $dissolving }) => ($dissolving ? "700ms" : "360ms")} ease-out both;
  transform-origin: right bottom;
  z-index: 10;

  @media (min-width: 2560px) {
    transform: scale(1.96);
    transform-origin: right bottom;
  }
`;

const Style3MainBanner = styled.div<{ $border: string }>`
  width: 100%;
  height: 220px; /* Aligned height parameters */
  display: flex;
  position: relative;
  overflow: hidden;
  background: #12161a;
  border: 3px solid ${({ $border }) => $border};
  box-shadow:
    inset 0 0 20px rgba(255, 26, 26, 0.2),
    0 10px 30px rgba(0, 0, 0, 0.7);

  &::before {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    width: 40px;
    height: 40px;
    border-top: 4px solid ${({ $border }) => $border};
    border-right: 4px solid ${({ $border }) => $border};
  }
`;

const Style3LogoZone = styled.div<{ $background: string }>`
  width: 25%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #990000 0%, ${({ $background }) => $background} 50%, #990000 100%);
  border-right: 3px solid #ff1a1a;
  box-shadow: 5px 0 15px rgba(0, 0, 0, 0.5);
`;

const Style3LogoGlow = styled.div`
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 70%);
`;

const Style3ClockWrap = styled.div`
  position: relative;
  z-index: 2;
  width: 100px;
  height: 100px;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.6));
`;

const Style3ClockSvg = styled.svg`
  width: 100%;
  height: 100%;
`;

const Style3ClockHand = styled.line`
  stroke: #ffffff;
  stroke-width: 5;
  stroke-linecap: round;
  transform-origin: 50px 50px;
  animation: ${style3ClockRotate} 10s linear infinite;
`;

const Style3TextZone = styled.div`
  width: 48%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: 35px;
  z-index: 1;
`;

const Style3TimerSub = styled.div<{ $color: string }>`
  font-family: 'Oswald', 'Arial Black', sans-serif;
  font-size: 28px;
  color: ${({ $color }) => $color};
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 1px;
  line-height: 1.1;
`;

const Style3AlertMain = styled.div`
  margin-top: 2px;
  font-family: 'Oswald', 'Arial Black', sans-serif;
  font-size: 72px;
  font-weight: 900;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: -1px;
  line-height: 0.95;
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
`;

const Style3TimerZone = styled.div`
  width: 27%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.02);
  border-left: 2px solid rgba(255, 26, 26, 0.2);
`;

const Style3TimerStack = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Style3TimerCountdown = styled.div<{ $urgent: boolean }>`
  font-family: 'Oswald', 'Arial Black', sans-serif;
  font-size: 95px;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: -2px;
  line-height: 1;
  text-shadow: 0 0 20px rgba(255, 26, 26, 0.7), 2px 2px 0px #ff1a1a;
  animation: ${({ $urgent }) => ($urgent ? style3Urgent : "none")} 0.5s ease-in-out infinite alternate;
`;

const Style3BottomTickerContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: -3px;
  z-index: 2;
`;

const Style3BottomTicker = styled.div<{ $background: string }>`
  background: linear-gradient(90deg, transparent 0%, ${({ $background }) => $background} 15%, ${({ $background }) => $background} 85%, transparent 100%);
  color: #ffffff;
  padding: 6px 50px;
  font-family: 'Oswald', sans-serif;
  font-size: 18px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  border-bottom: 2px solid #ff1a1a;
  min-width: 500px;
  text-align: center;
`;

/* --- Remaining Substyles for Style 2 --- */
const Style2Body = styled.div`
  display: grid;
  grid-template-columns: 92px 1fr;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
`;

const Style2WatchPanel = styled.div<{ $accent: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $accent }) => $accent};
`;

const Style2WatchRing = styled.div`
  position: relative;
  width: 58px;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.96);
  background: rgba(0, 0, 0, 0.18);
  animation: ${watchPulse} 1.8s ease-in-out infinite;
`;

const Style2WatchFace = styled.div`
  position: relative;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.06);
`;

const Style2WatchTick = styled.span<{ $top: string; $left: string; $rotate: string }>`
  position: absolute;
  top: ${({ $top }) => $top};
  left: ${({ $left }) => $left};
  width: 2px;
  height: 7px;
  background: rgba(255, 255, 255, 0.9);
  transform: translate(-50%, -50%) rotate(${({ $rotate }) => $rotate});
  transform-origin: center;
`;

const Style2WatchHandLong = styled.span`
  position: absolute;
  left: 50%;
  top: 50%;
  width: 2px;
  height: 14px;
  background: #ffffff;
  border-radius: 999px;
  transform-origin: bottom center;
  animation: ${watchSweep} 2s linear infinite;
`;

const Style2WatchHandShort = styled.span`
  position: absolute;
  left: 50%;
  top: 50%;
  width: 2px;
  height: 10px;
  background: rgba(255, 255, 255, 0.82);
  border-radius: 999px;
  transform: translate(-50%, -100%) rotate(42deg);
  transform-origin: bottom center;
`;

const Style2WatchCenter = styled.span`
  position: absolute;
  left: 50%;
  top: 50%;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ffffff;
  transform: translate(-50%, -50%);
`;

const Style2WatchButton = styled.span`
  position: absolute;
  top: -6px;
  right: 8px;
  width: 12px;
  height: 8px;
  border-radius: 3px 3px 0 0;
  background: rgba(255, 255, 255, 0.92);
`;

const Style2InfoPanel = styled.div<{ $base: string }>`
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: ${({ $base }) => $base};
`;

const Style2Header = styled.div<{ $bar: string; $text: string }>`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 34px;
  padding: 0 14px;
  background: ${({ $bar }) => $bar};
  color: ${({ $text }) => $text};
  font-family: "Oswald", "Arial Black", sans-serif;
  font-size: 21px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  line-height: 1;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
`;

const Style2TimerPanel = styled.div<{ $base: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 8px 14px 10px 16px;
  background: ${({ $base }) => $base};
`;

const Style2NumberRow = styled.div<{ $text: string }>`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  color: ${({ $text }) => $text};
`;

const Style2Number = styled.div`
  font-family: "Oswald", "Bebas Neue", sans-serif;
  font-size: 60px;
  font-weight: 700;
  line-height: 0.78;
  letter-spacing: -1px;
  text-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
`;

const Style2Secs = styled.div`
  margin-bottom: 7px;
  font-family: "Oswald", sans-serif;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1.8px;
  text-transform: uppercase;
`;

const TopStripe = styled.span`
  position: absolute;
  inset: 0;
  height: 8px;
  background: linear-gradient(
    90deg,
    var(--project-accent, #bef264) 0 26%,
    transparent 26% 74%,
    var(--project-primary, #ef4444) 74% 100%
  );
  z-index: 3;
`;

const BrandPanel = styled.div`
  position: relative;
  z-index: 2;
  flex: 1 1 auto;
  display: grid;
  align-content: center;
  padding: 18px 24px 14px 28px;
  color: #ffffff;
  text-transform: uppercase;
`;

const TopLine = styled.div`
  font-size: 34px;
  line-height: 0.78;
  letter-spacing: 0;
`;

const MainLine = styled.div`
  color: var(--project-text-primary, #ffffff);
  font-size: 30px;
  line-height: 0.9;
  text-shadow: 3px 3px 0 rgba(0, 0, 0, 0.35);
`;

const BottomLine = styled.div`
  width: fit-content;
  margin-top: 4px;
  padding: 3px 9px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--project-primary, #4c1d95);
  font-size: 15px;
  line-height: 1;
`;

const TimerPanel = styled.div<{ $singleDigit: boolean }>`
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 7px;
  min-width: 194px;
  padding: 10px 24px 10px 28px;
  transform: translateX(${({ $singleDigit }) => ($singleDigit ? "-10px" : "0")});
  color: #ffffff;
  clip-path: polygon(16% 0, 100% 0, 100% 100%, 0 100%);
  background: linear-gradient(110deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
`;

const Number = styled.div<{ $singleDigit: boolean }>`
  min-width: 86px;
  text-align: right;
  font-size: 82px;
  line-height: 0.8;
  letter-spacing: -2px;
  text-shadow: 4px 4px 0 rgba(0, 0, 0, 0.22);
  transform: translateX(${({ $singleDigit }) => ($singleDigit ? "-8px" : "0")});
`;

const Secs = styled.div`
  flex: 0 0 42px;
  font-size: 20px;
  line-height: 0.92;
`;