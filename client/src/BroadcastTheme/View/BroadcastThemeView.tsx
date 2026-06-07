import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import http from "../../AxiosFile/axios";
import {
  BROADCAST_DISPLAY_SETTINGS,
  GET_BROADCAST_DISPLAY_SETTINGS,
  CREATE_PROJECT_COLOR_THEME,
  GET_PROJECT_COLOR_THEME,
  PATCH_PROJECT_COLOR_THEME,
  UPDATE_BROADCAST_DISPLAY_SETTINGS,
} from "../../Routes/ApiRoutes/apiRoutes";
import { getSelectedTournamentSlug } from "../../Tournaments/tournamentState";
import {
  DEFAULT_PROJECT_THEME,
  getBroadcastDisplaySettings,
  ProjectColorTheme,
  setBroadcastDisplaySettings,
} from "../../Theme";

type ColorField = {
  key: keyof Omit<ProjectColorTheme, "useDefaultColors">;
  label: string;
  description: string;
};

const colorFields: ColorField[] = [
  { key: "primary", label: "Primary", description: "Main action, brand, and broadcast accent." },
  { key: "secondary", label: "Secondary", description: "Supporting accent for admin controls." },
  { key: "accent", label: "Accent", description: "Focus rings, highlights, and important markers." },
  { key: "background", label: "Background", description: "Page/backdrop only. Does not control text." },
  { key: "surface", label: "Surface", description: "Cards and panels only. Does not control text." },
  { key: "surfaceAlt", label: "Surface Alt", description: "Table headers and nested panels only." },
  { key: "textPrimary", label: "Text Primary", description: "Main readable text across admin and overlays." },
  { key: "textSecondary", label: "Text Secondary", description: "Muted/helper text across admin and overlays." },
  { key: "textInverse", label: "Text Inverse", description: "Dark text on bright bars, including roster player names." },
  { key: "border", label: "Border", description: "Input, card, and table borders." },
  { key: "success", label: "Success", description: "Success state color." },
  { key: "warning", label: "Warning", description: "Warning state color." },
  { key: "danger", label: "Danger", description: "Errors and destructive actions." },
];

// Production-safe hex checker: gracefully handles non-strings, nulls, and undefined
const isHexColor = (value: unknown): boolean => {
  if (typeof value !== "string") return false;
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
};

// Formats 3-digit short hex values (#fff) to 6-digits (#ffffff) so native <input type="color"> doesn't break
const convertToFullHex = (value: unknown): string => {
  if (typeof value !== "string") return "#000000";
  const clean = value.trim();
  if (/^#[0-9a-f]{3}$/i.test(clean)) {
    return `#${clean[1]}${clean[1]}${clean[2]}${clean[2]}${clean[3]}${clean[3]}`;
  }
  return /^#[0-9a-f]{6}$/i.test(clean) ? clean : "#000000";
};

const normalizeThemePayload = (data: Partial<ProjectColorTheme>): ProjectColorTheme => ({
  ...DEFAULT_PROJECT_THEME,
  ...data,
  useDefaultColors: data?.useDefaultColors !== false,
});

const BroadcastThemeView: React.FC = () => {
  const [theme, setTheme] = useState<ProjectColorTheme>(DEFAULT_PROJECT_THEME);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [displaySettings, setDisplaySettings] = useState(getBroadcastDisplaySettings);
  const [openPanels, setOpenPanels] = useState({
    display: true,
    colors: true,
    payload: true,
  });

  const invalidFields = useMemo(
    () => colorFields.filter((field) => !isHexColor(theme[field.key])).map((field) => field.label),
    [theme]
  );
  
  const canSave = (!!theme.useDefaultColors || invalidFields.length === 0) && !isSaving;
  const jsonPreview = useMemo(() => JSON.stringify(theme, null, 2), [theme]);
  const displayPayloadPreview = useMemo(() => JSON.stringify({ settings: displaySettings }, null, 2), [displaySettings]);

  useEffect(() => {
    let isMounted = true;

    http
      .get(GET_PROJECT_COLOR_THEME)
      .then((response) => {
        if (isMounted) {
          setTheme(normalizeThemePayload(response.data || DEFAULT_PROJECT_THEME));
        }
      })
      .catch(() => {
        if (isMounted) {
          setStatus("No saved theme found. Using default values for a new setup.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const selectedTournamentSlug = getSelectedTournamentSlug();

    http
      .get(BROADCAST_DISPLAY_SETTINGS(selectedTournamentSlug) || GET_BROADCAST_DISPLAY_SETTINGS)
      .then((response) => {
        if (!isMounted) return;
        const nextSettings = {
          ...getBroadcastDisplaySettings(),
          ...(response.data?.settings || response.data || {}),
        };
        setDisplaySettings(nextSettings);
        setBroadcastDisplaySettings(nextSettings);
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const updateColor = (key: ColorField["key"], value: string) => {
    setTheme((current) => ({ ...current, [key]: value }));
  };

  const updateDefaultMode = (checked: boolean) => {
    setTheme((current) => ({ ...current, useDefaultColors: checked }));
  };

  const saveTheme = async (method: "create" | "update") => {
    if (!canSave) {
      setError(`Fix invalid hex colors: ${invalidFields.join(", ")}`);
      return;
    }

    setIsSaving(true);
    setError("");
    setStatus("");

    try {
      if (method === "create") {
        await http.post(CREATE_PROJECT_COLOR_THEME, theme);
      } else {
        await http.patch(PATCH_PROJECT_COLOR_THEME, theme);
      }

      window.dispatchEvent(new CustomEvent("project-theme-updated", { detail: theme }));
      setStatus(method === "create" ? "Theme created successfully." : "Theme updated successfully.");
    } catch (saveError) {
      setError("Theme save failed. Please check the backend API route.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    setTheme(DEFAULT_PROJECT_THEME);
    setError("");
    setStatus("Form reset to default colors.");
  };

  const updateDisplaySetting = async (key: keyof typeof displaySettings, checked: boolean) => {
    const nextSettings = { ...displaySettings, [key]: checked };
    const selectedTournamentSlug = getSelectedTournamentSlug();
    setDisplaySettings(nextSettings);
    setBroadcastDisplaySettings(nextSettings);

    try {
      await http.patch(BROADCAST_DISPLAY_SETTINGS(selectedTournamentSlug) || UPDATE_BROADCAST_DISPLAY_SETTINGS, { settings: nextSettings });
      setStatus("Broadcast settings updated.");
    } catch {
      setStatus("Broadcast settings saved locally. Add the backend route to sync it.");
    }
  };

  const togglePanel = (key: keyof typeof openPanels) => {
    setOpenPanels((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <Page data-theme-surface="page">
      <Shell>
        <Header>
          <TitleBlock>
            <Kicker>Theme Setup</Kicker>
            <Title>Broadcast Theme</Title>
            <Subtitle>
              Create or update the color payload used by the frontend theme provider.
            </Subtitle>
          </TitleBlock>

          <SwitchToggle>
            <SwitchInput
              type="checkbox"
              checked={!!theme.useDefaultColors}
              onChange={(event) => updateDefaultMode(event.target.checked)}
            />
            <SwitchTrack aria-hidden="true" />
            <ToggleCopy>
              <strong>Use default colors</strong>
              <small>Checked means current project colors stay unchanged.</small>
            </ToggleCopy>
          </SwitchToggle>
        </Header>

        {(status || error || isLoading) && (
          <StatusBar $tone={error ? "error" : "info"}>
            {error || (isLoading ? "Loading saved theme..." : status)}
          </StatusBar>
        )}

        <DisplaySettings data-theme-surface="panel">
          <PanelHeader onClick={() => togglePanel("display")} role="button" tabIndex={0}>
            <PanelHeading>
              <PanelArrow $open={openPanels.display} aria-hidden="true">&gt;</PanelArrow>
              <PanelTitle>Broadcast Display Switches</PanelTitle>
            </PanelHeading>
            <PanelNote>Saved locally and synced through the broadcast settings API.</PanelNote>
          </PanelHeader>
          {openPanels.display && (
            <ToggleGrid>
              <SwitchToggle>
                <SwitchInput
                  type="checkbox"
                  checked={displaySettings.broadcastThemeEnabled}
                  onChange={(event) => updateDisplaySetting("broadcastThemeEnabled", event.target.checked)}
                />
                <SwitchTrack aria-hidden="true" />
                <ToggleCopy>
                  <strong>Broadcast theme</strong>
                  <small>Turns custom project colors on or off for broadcast/admin surfaces.</small>
                </ToggleCopy>
              </SwitchToggle>
              <SwitchToggle>
                <SwitchInput
                  type="checkbox"
                  checked={displaySettings.championRushEnabled}
                  onChange={(event) => updateDisplaySetting("championRushEnabled", event.target.checked)}
                />
                <SwitchTrack aria-hidden="true" />
                <ToggleCopy>
                  <strong>Champion Rush</strong>
                  <small>Writes a body flag for overlays that need Champion Rush on/off.</small>
                </ToggleCopy>
              </SwitchToggle>
              <SwitchToggle>
                <SwitchInput
                  type="checkbox"
                  checked={displaySettings.showCountryFlags}
                  onChange={(event) => updateDisplaySetting("showCountryFlags", event.target.checked)}
                />
                <SwitchTrack aria-hidden="true" />
                <ToggleCopy>
                  <strong>Show country flags</strong>
                  <small>Controls flags across results, live standings, and broadcast overlays.</small>
                </ToggleCopy>
              </SwitchToggle>
              <SwitchToggle>
                <SwitchInput
                  type="checkbox"
                  checked={displaySettings.showLiveStandingsPoints}
                  onChange={(event) => updateDisplaySetting("showLiveStandingsPoints", event.target.checked)}
                />
                <SwitchTrack aria-hidden="true" />
                <ToggleCopy>
                  <strong>Show live standings points</strong>
                  <small>Hides the points column only in the live standings overlay.</small>
                </ToggleCopy>
              </SwitchToggle>
              <SwitchToggle>
                <SwitchInput
                  type="checkbox"
                  checked={displaySettings.showRosterTeamLogos}
                  onChange={(event) => updateDisplaySetting("showRosterTeamLogos", event.target.checked)}
                />
                <SwitchTrack aria-hidden="true" />
                <ToggleCopy>
                  <strong>Roster team logos</strong>
                  <small>Shows or hides team logos in front of team names on the roster overlay.</small>
                </ToggleCopy>
              </SwitchToggle>
              <SwitchToggle>
                <SwitchInput
                  type="checkbox"
                  checked={displaySettings.rosterPageSwitch}
                  onChange={(event) => updateDisplaySetting("rosterPageSwitch", event.target.checked)}
                />
                <SwitchTrack aria-hidden="true" />
                <ToggleCopy>
                  <strong>Switch roster page</strong>
                  <small>Toggle this once to open the next six-team roster batch on broadcast.</small>
                </ToggleCopy>
              </SwitchToggle>
            </ToggleGrid>
          )}
        </DisplaySettings>

        <ContentGrid>
          <FormPanel data-theme-surface="panel">
            <PanelHeader onClick={() => togglePanel("colors")} role="button" tabIndex={0}>
              <PanelHeading>
                <PanelArrow $open={openPanels.colors} aria-hidden="true">&gt;</PanelArrow>
                <PanelTitle>Color Fields</PanelTitle>
              </PanelHeading>
              <PanelNote>All color values must be hex, like #ef4444.</PanelNote>
            </PanelHeader>

            {openPanels.colors && <FieldGrid>
              {colorFields.map((field) => {
                const rawValue = theme[field.key];
                const isValid = isHexColor(rawValue);
                
                return (
                  <ColorFieldCard key={field.key} $invalid={!isValid}>
                    <FieldText>
                      <label htmlFor={field.key}>{field.label}</label>
                      <span>{field.description}</span>
                    </FieldText>
                    <ColorControls>
                      <ColorInput
                        id={field.key}
                        type="color"
                        value={convertToFullHex(isValid ? rawValue : DEFAULT_PROJECT_THEME[field.key])}
                        onChange={(event) => updateColor(field.key, event.target.value)}
                        disabled={!!theme.useDefaultColors}
                      />
                      <HexInput
                        value={typeof rawValue === "string" ? rawValue : ""}
                        onChange={(event) => updateColor(field.key, event.target.value)}
                        disabled={!!theme.useDefaultColors}
                        aria-label={`${field.label} hex color`}
                      />
                    </ColorControls>
                  </ColorFieldCard>
                );
              })}
            </FieldGrid>}

            {openPanels.colors && <Actions>
              <SecondaryButton type="button" onClick={resetToDefaults} disabled={isSaving}>
                Reset Default
              </SecondaryButton>
              <ActionGroup>
                <SecondaryButton type="button" onClick={() => saveTheme("create")} disabled={!canSave}>
                  Create
                </SecondaryButton>
                <PrimaryButton type="button" onClick={() => saveTheme("update")} disabled={!canSave}>
                  Update
                </PrimaryButton>
              </ActionGroup>
            </Actions>}
          </FormPanel>

          <PreviewPanel data-theme-surface="panel">
            <PanelHeader onClick={() => togglePanel("payload")} role="button" tabIndex={0}>
              <PanelHeading>
                <PanelArrow $open={openPanels.payload} aria-hidden="true">&gt;</PanelArrow>
                <PanelTitle>API Payload</PanelTitle>
              </PanelHeading>
              <PanelNote>Theme plus broadcast settings payloads.</PanelNote>
            </PanelHeader>
            {openPanels.payload && (
              <JsonPreview>{`PATCH /api/theme/colors\n${jsonPreview}\n\nPATCH /api/broadcast-display-settings\n${displayPayloadPreview}`}</JsonPreview>
            )}
          </PreviewPanel>
        </ContentGrid>
      </Shell>
    </Page>
  );
};

export default BroadcastThemeView;

// Styled components remain down here exactly as you designed them...
const Page = styled.main`
  min-height: 100vh;
  background:
    linear-gradient(180deg, rgba(var(--project-primary-rgb, 15, 23, 42), 0.08), transparent 42%),
    var(--project-background, #0b0f19);
  color: var(--project-text-primary, #f8fafc);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
`;

const Shell = styled.div`
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 28px 0 48px;
`;

const Header = styled.header`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;

  @media (max-width: 780px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const TitleBlock = styled.div`
  display: grid;
  gap: 8px;
`;

const Kicker = styled.span`
  color: var(--project-accent, #bfff00);
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.6rem);
  line-height: 1;
`;

const Subtitle = styled.p`
  max-width: 620px;
  margin: 0;
  color: var(--project-text-secondary, #94a3b8);
  line-height: 1.5;
`;

const SwitchToggle = styled.label`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 280px;
  padding: 14px;
  border: 1px solid var(--project-border, #334155);
  border-radius: 8px;
  background: var(--project-surface, #111827);
  cursor: pointer;

  small {
    color: var(--project-text-secondary, #94a3b8);
    line-height: 1.35;
  }
`;

const ToggleCopy = styled.span`
  display: grid;
  gap: 3px;
`;

const SwitchInput = styled.input`
  position: absolute;
  opacity: 0;
  pointer-events: none;

  &:checked + span::after {
    transform: translateX(22px);
  }

  &:checked + span {
    background: var(--project-primary, #ef4444);
    border-color: var(--project-primary, #ef4444);
  }

  &:focus-visible + span {
    outline: 2px solid var(--project-accent, #bfff00);
    outline-offset: 3px;
  }
`;

const SwitchTrack = styled.span`
  position: relative;
  flex: 0 0 48px;
  width: 48px;
  height: 26px;
  border: 1px solid var(--project-border, #334155);
  border-radius: 999px;
  background: var(--project-surface-alt, #1f293d);
  transition: background 160ms ease, border-color 160ms ease;

  &::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: var(--project-text-primary, #ffffff);
    transition: transform 160ms ease;
  }
`;

const StatusBar = styled.div<{ $tone: "error" | "info" }>`
  margin-bottom: 18px;
  padding: 12px 14px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === "error" ? "rgba(var(--project-danger-rgb, 239, 68, 68), 0.4)" : "var(--project-border, #334155)"};
  border-radius: 8px;
  background: ${({ $tone }) =>
    $tone === "error" ? "rgba(var(--project-danger-rgb, 239, 68, 68), 0.12)" : "var(--project-surface, #111827)"};
  color: ${({ $tone }) => ($tone === "error" ? "var(--project-danger, #ef4444)" : "var(--project-text-primary, #fff)")};
`;

const ContentGrid = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.8fr);
  gap: 18px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const DisplaySettings = styled.section`
  margin-bottom: 18px;
  padding: 18px;
  border: 1px solid var(--project-border, #334155);
  border-radius: 8px;
  background: var(--project-surface, #111827);
`;

const ToggleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 780px) {
    grid-template-columns: 1fr;
  }
`;

const FormPanel = styled.section`
  padding: 18px;
  border: 1px solid var(--project-border, #334155);
  border-radius: 8px;
  background: var(--project-surface, #111827);
`;

const PreviewPanel = styled.aside`
  padding: 18px;
  border: 1px solid var(--project-border, #334155);
  border-radius: 8px;
  background: var(--project-surface, #111827);
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 16px;
  cursor: pointer;
  user-select: none;
`;

const PanelHeading = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
`;

const PanelArrow = styled.span<{ $open: boolean }>`
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  color: var(--project-accent, #bfff00);
  font-size: 1.8rem;
  line-height: 1;
  transform: rotate(${({ $open }) => ($open ? "90deg" : "0deg")});
  transition: transform 160ms ease;
`;

const PanelTitle = styled.h2`
  margin: 0;
  font-size: 1.08rem;
`;

const PanelNote = styled.span`
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.82rem;
  font-weight: 700;
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const ColorFieldCard = styled.div<{ $invalid: boolean }>`
  display: grid;
  gap: 10px;
  padding: 14px;
  border: 1px solid
    ${({ $invalid }) => ($invalid ? "var(--project-danger, #ef4444)" : "var(--project-border, #334155)")};
  border-radius: 8px;
  background: var(--project-surface-alt, #1f293d);
`;

const FieldText = styled.div`
  display: grid;
  gap: 4px;

  label {
    font-size: 0.92rem;
    font-weight: 900;
  }

  span {
    color: var(--project-text-secondary, #94a3b8);
    font-size: 0.78rem;
    line-height: 1.4;
  }
`;

const ColorControls = styled.div`
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 10px;
`;

const ColorInput = styled.input`
  width: 44px;
  height: 40px;
  padding: 0;
  border: 1px solid var(--project-border, #334155);
  border-radius: 8px;
  background: transparent;
`;

const HexInput = styled.input`
  min-width: 0;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--project-border, #334155);
  border-radius: 8px;
  background: var(--project-background, #0b0f19);
  color: var(--project-text-primary, #ffffff);
  font: 800 0.9rem "SFMono-Regular", Consolas, "Liberation Mono", monospace;
`;

const Actions = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 18px;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const ActionGroup = styled.div`
  display: flex;
  gap: 10px;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const BaseButton = styled.button`
  min-height: 42px;
  padding: 0 16px;
  border-radius: 8px;
  font-weight: 900;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

const PrimaryButton = styled(BaseButton)`
  border: 1px solid var(--project-primary, #ef4444);
  background: var(--project-primary, #ef4444);
  color: var(--project-text-primary, #ffffff);
`;

const SecondaryButton = styled(BaseButton)`
  border: 1px solid var(--project-border, #334155);
  background: var(--project-surface-alt, #1f293d);
  color: var(--project-text-primary, #ffffff);
`;

const JsonPreview = styled.pre`
  min-height: 520px;
  margin: 0;
  overflow: auto;
  padding: 16px;
  border: 1px solid var(--project-border, #334155);
  border-radius: 8px;
  background: var(--project-background, #0b0f19);
  color: var(--project-accent, #bfff00);
  font-size: 0.82rem;
  line-height: 1.55;
`;
