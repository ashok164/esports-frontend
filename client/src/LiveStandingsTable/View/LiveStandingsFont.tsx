import { createGlobalStyle } from "styled-components";
import gffLatinBoldUrl from "../../Font/gffLatinBold.ttf";
import gffLatinExtraBoldUrl from "../../Font/gffLatinExtraBold.otf";

export const LIVE_STANDINGS_FONT_FAMILY = "GFF Latin Bold";
export const GFF_LATIN_EXTRA_BOLD_FONT_FAMILY = "GFF Latin Extra Bold";

const LiveStandingsFont = createGlobalStyle`
  @font-face {
    font-family: "${LIVE_STANDINGS_FONT_FAMILY}";
    src: url(${gffLatinBoldUrl}) format("truetype");
    font-weight: 700;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: "${GFF_LATIN_EXTRA_BOLD_FONT_FAMILY}";
    src: url(${gffLatinExtraBoldUrl}) format("opentype");
    font-weight: 800;
    font-style: normal;
    font-display: swap;
  }
`;

export default LiveStandingsFont;
