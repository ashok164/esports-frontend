import React from "react";
import styled from "styled-components";

type MatchNumberImageOverlayProps = {
  imageUrl: string;
};

const MatchNumberImageOverlay: React.FC<MatchNumberImageOverlayProps> = ({
  imageUrl,
}) => {
  if (!imageUrl) return null;

  return (
    <Overlay>
      <Image src={imageUrl} alt="Match number overlay" />
    </Overlay>
  );
};

export default MatchNumberImageOverlay;

const Overlay = styled.div`
  position: fixed;
  right: 26px;
  bottom: 40px;
  z-index: 999;
  pointer-events: none;

  @media (min-width: 2560px) {
    transform: scale(1.96);
    transform-origin: right bottom;
  }
`;

const Image = styled.img`
  display: block;
  max-width: 420px;
  max-height: 180px;
  object-fit: contain;
`;
