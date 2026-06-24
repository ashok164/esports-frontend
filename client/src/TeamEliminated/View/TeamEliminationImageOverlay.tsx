import React from "react";
import styled from "styled-components";

type TeamEliminationImageOverlayProps = {
  imageUrl: string;
};

const TeamEliminationImageOverlay: React.FC<TeamEliminationImageOverlayProps> = ({
  imageUrl,
}) => {
  if (!imageUrl) return null;

  return (
    <Overlay>
      <Image src={imageUrl} alt="Team elimination overlay" />
    </Overlay>
  );
};

export default TeamEliminationImageOverlay;

const Overlay = styled.div`
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  pointer-events: none;

  @media (min-width: 2560px) {
    transform: translateX(-50%) scale(1.96);
    transform-origin: center top;
  }
`;

const Image = styled.img`
  display: block;
  max-width: min(92vw, 980px);
  max-height: 340px;
  object-fit: contain;
`;
