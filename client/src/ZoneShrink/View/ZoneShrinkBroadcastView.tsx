import React from "react";
import styled, { keyframes } from "styled-components";
import {
  getZoneShrinkApi,
  getZoneShrinkState,
  patchZoneShrinkApi,
  ZONE_SHRINK_STORAGE_KEY,
  ZONE_SHRINK_UPDATED_EVENT,
  ZoneShrinkState,
} from "../zoneShrinkState";

const soundPath = "/ZoneShrinkSound/shrinkSound.mp3";

const ZoneShrinkBroadcastView: React.FC = () => {
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
      audio.volume = 1;
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
      audio.volume = 1;
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

  return (
    <Stage>
      {(soundBlocked || !soundUnlocked) && (
        <SoundUnlockButton type="button" onClick={unlockSound}>
          Enable Sound
        </SoundUnlockButton>
      )}
      {visible && (
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
      )}
    </Stage>
  );
};

export default ZoneShrinkBroadcastView;

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

const Stage = styled.main`
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: transparent;
  font-family: "Montserrat", "Arial Black", sans-serif;
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
