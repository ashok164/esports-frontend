import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled, { createGlobalStyle } from "styled-components";
import { assignUserTournament, getAuthUsers, updateAuthUser } from "../../Auth/Repository/remote";
import { AuthUser, getAuthUser } from "../../Auth/Repository/authStorage";
import {
  createTournamentApi,
  deleteTournamentApi,
  getTournamentsApi,
  Tournament,
  updateTournamentApi,
} from "../Repository/remote";
import {
  getSelectedTournamentSlug,
  getTournamentPath,
  setSelectedTournament,
} from "../tournamentState";

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

type TournamentManagerMode = "list" | "create" | "roles";

type TournamentManagerViewProps = {
  mode?: TournamentManagerMode;
};

const TournamentManagerView: React.FC<TournamentManagerViewProps> = ({ mode = "list" }) => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [userDrafts, setUserDrafts] = useState<Record<string, { role: string; isActive: boolean; tournamentSlug: string; tournamentRole: string }>>({});
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [domain, setDomain] = useState("");
  const [pullTournamentAssets, setPullTournamentAssets] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editDraft, setEditDraft] = useState({ name: "", slug: "", domain: "", pullTournamentAssets: false });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedSlug, setSelectedSlug] = useState(getSelectedTournamentSlug());

  const generatedSlug = useMemo(() => slugify(slug || name), [name, slug]);
  const authUser = getAuthUser();
  const canManageUsers = ["admin", "super_admin"].includes(authUser?.role || "");
  const canDeleteTournaments = ["admin", "super_admin"].includes(authUser?.role || "");
  const visibleUsers = canManageUsers ? users : authUser ? [authUser] : [];
  const pageTitle =
    mode === "create"
      ? "Create Tournament"
      : mode === "roles"
        ? "Roles"
        : "Tournaments";

  const loadTournaments = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      setTournaments(await getTournamentsApi());
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Could not load tournaments.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const nextUsers = await getAuthUsers();
      setUsers(nextUsers);
      setUserDrafts((currentDrafts) =>
        nextUsers.reduce<Record<string, { role: string; isActive: boolean; tournamentSlug: string; tournamentRole: string }>>(
          (drafts, user) => {
            const key = String(user.id || "");
            if (!key) return drafts;
            drafts[key] = currentDrafts[key] || {
              role: user.role || "user",
              isActive: Boolean(user.isActive),
              tournamentSlug: selectedSlug,
              tournamentRole: "viewer",
            };
            return drafts;
          },
          {},
        ),
      );
    } catch (err: any) {
      if (err?.response?.status !== 403) {
        setError(err?.response?.data?.message || err?.message || "Could not load users.");
      }
    }
  }, [selectedSlug]);

  useEffect(() => {
    loadTournaments();
    loadUsers();
  }, [loadTournaments, loadUsers]);

  const patchUserDraft = (userId: string | number | undefined, patch: Partial<{ role: string; isActive: boolean; tournamentSlug: string; tournamentRole: string }>) => {
    if (!userId) return;
    const key = String(userId);
    setUserDrafts((drafts) => ({
      ...drafts,
      [key]: {
        role: "user",
        isActive: false,
        tournamentSlug: selectedSlug,
        tournamentRole: "viewer",
        ...drafts[key],
        ...patch,
      },
    }));
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!name.trim()) {
      setError("Tournament name is required.");
      return;
    }

    if (!generatedSlug) {
      setError("Slug could not be generated. Use letters or numbers.");
      return;
    }

    setIsSaving(true);

    try {
      const created = await createTournamentApi({
        name: name.trim(),
        slug: generatedSlug,
        domain: domain.trim() || undefined,
        pullTournamentAssets,
      });
      const nextSlug = created?.slug || generatedSlug;
      setSelectedTournament(nextSlug, created?.name || name.trim());
      setSelectedSlug(nextSlug);
      setMessage(`Created and selected ${created?.name || name.trim()} (${nextSlug}).`);
      setName("");
      setSlug("");
      setDomain("");
      setPullTournamentAssets(false);
      setIsCreateOpen(false);
      await loadTournaments();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Could not create tournament.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectTournament = (tournament: Tournament) => {
    if (!tournament.slug) return;
    setSelectedTournament(tournament.slug, tournament.name);
    setSelectedSlug(tournament.slug);
    setMessage(`Selected ${tournament.name}. Existing pages now use this tournament.`);
    setError("");
    navigate(getTournamentPath("/routes", tournament.slug));
  };

  const startEditTournament = (tournament: Tournament) => {
    if (!tournament.id) return;
    setEditingId(tournament.id);
    setEditDraft({
      name: tournament.name || "",
      slug: tournament.slug || "",
      domain: tournament.domain || "",
      pullTournamentAssets: Boolean(tournament.pullTournamentAssets),
    });
    setError("");
    setMessage("");
  };

  const cancelEditTournament = () => {
    setEditingId(null);
    setEditDraft({ name: "", slug: "", domain: "", pullTournamentAssets: false });
  };

  const handleUpdateTournament = async (tournament: Tournament) => {
    if (!tournament.id) return;
    const nextName = editDraft.name.trim();
    const nextSlug = slugify(editDraft.slug || nextName);

    if (!nextName) {
      setError("Tournament name is required.");
      return;
    }

    if (!nextSlug) {
      setError("Tournament slug is required.");
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const updated = await updateTournamentApi(tournament.id, {
        name: nextName,
        slug: nextSlug,
        domain: editDraft.domain.trim(),
        pullTournamentAssets: editDraft.pullTournamentAssets,
      });
      const updatedSlug = updated?.slug || nextSlug;
      setMessage(`Updated ${updated?.name || nextName}.`);
      if (selectedSlug === tournament.slug) {
        setSelectedTournament(updatedSlug, updated?.name || nextName);
        setSelectedSlug(updatedSlug);
      }
      cancelEditTournament();
      await loadTournaments();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Could not update tournament.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTournament = async (tournament: Tournament) => {
    if (!tournament.id) return;
    const label = tournament.name || tournament.slug;
    if (!window.confirm(`Delete ${label}? The tournament data will be hidden, not physically removed.`)) {
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      await deleteTournamentApi(tournament.id);
      if (selectedSlug === tournament.slug) {
        setSelectedSlug("");
      }
      setMessage(`Deleted ${label}.`);
      await loadTournaments();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Could not delete tournament.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveUser = async (user: AuthUser) => {
    if (!user.id) return;
    const draft = userDrafts[String(user.id)];
    if (!draft) return;

    setError("");
    setMessage("");

    try {
      await updateAuthUser(user.id, {
        role: draft.role,
        isActive: draft.isActive,
      });
      setMessage(`Saved ${user.email || user.name || "user"} role.`);
      await loadUsers();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Could not save user role.");
    }
  };

  const handleAssignTournament = async (user: AuthUser) => {
    if (!user.id) return;
    const draft = userDrafts[String(user.id)];
    if (!draft?.tournamentSlug) return;

    setError("");
    setMessage("");

    try {
      await assignUserTournament(user.id, {
        tournamentSlug: draft.tournamentSlug,
        role: draft.tournamentRole,
      });
      setMessage(`Assigned ${user.email || user.name || "user"} to ${draft.tournamentSlug}.`);
      await loadUsers();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Could not assign tournament.");
    }
  };

  return (
    <Page>
      <GlobalStyle />
      <Shell>
        <Header>
          <div>
            <Kicker>Tournament Setup</Kicker>
            <Title>{pageTitle}</Title>
          </div>
          <HeaderActions>
            {mode === "list" && (
              <AddButton type="button" onClick={() => setIsCreateOpen(true)} title="Create tournament">
                +
              </AddButton>
            )}
            <RefreshButton type="button" onClick={loadTournaments} disabled={isLoading}>
              {isLoading ? "Refreshing..." : "Refresh"}
            </RefreshButton>
          </HeaderActions>
        </Header>

        <Notice>
          Selected tournament controls teams, players, game details, assets, theme,
          realtime identity matching, and saved results. Existing data stays in SAGGU FAMILY.
        </Notice>

        {error && <Alert $tone="danger">{error}</Alert>}
        {message && <Alert $tone="success">{message}</Alert>}

        {mode === "create" && (
          <SinglePanel>
            <PanelTitle>Create Tournament</PanelTitle>
            <Form onSubmit={handleCreate}>
              <Field>
                <label htmlFor="tournament-name">Name</label>
                <input
                  id="tournament-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Nepal Pro League"
                />
              </Field>

              <Field>
                <label htmlFor="tournament-slug">Slug</label>
                <input
                  id="tournament-slug"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  placeholder={slugify(name) || "nepal-pro-league"}
                />
                <Hint>URL slug: {generatedSlug || "-"}</Hint>
              </Field>

              <Field>
                <label htmlFor="tournament-domain">Domain</label>
                <input
                  id="tournament-domain"
                  value={domain}
                  onChange={(event) => setDomain(event.target.value)}
                  placeholder="optional.example.com"
                />
              </Field>

              <SwitchLabel>
                <input
                  type="checkbox"
                  checked={pullTournamentAssets}
                  onChange={(event) => setPullTournamentAssets(event.target.checked)}
                />
                <span>
                  <strong>Pull tournament assets</strong>
                  <small>Show shared weapon, character, skill, role, equipment, logo, banner, and tournament asset rows as read-only.</small>
                </span>
              </SwitchLabel>

              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Creating..." : "Create Tournament"}
              </Button>
            </Form>
          </SinglePanel>
        )}

        {mode === "list" && isCreateOpen && (
          <DialogBackdrop onMouseDown={() => setIsCreateOpen(false)}>
            <DialogPanel onMouseDown={(event) => event.stopPropagation()}>
              <DialogHeader>
                <PanelTitle>Create Tournament</PanelTitle>
                <IconButton type="button" onClick={() => setIsCreateOpen(false)} aria-label="Close create tournament">
                  x
                </IconButton>
              </DialogHeader>
              <Form onSubmit={handleCreate}>
                <Field>
                  <label htmlFor="dialog-tournament-name">Name</label>
                  <input
                    id="dialog-tournament-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Nepal Pro League"
                    autoFocus
                  />
                </Field>
                <Field>
                  <label htmlFor="dialog-tournament-slug">Slug</label>
                  <input
                    id="dialog-tournament-slug"
                    value={slug}
                    onChange={(event) => setSlug(event.target.value)}
                    placeholder={slugify(name) || "nepal-pro-league"}
                  />
                  <Hint>URL slug: {generatedSlug || "-"}</Hint>
                </Field>
                <Field>
                  <label htmlFor="dialog-tournament-domain">Domain</label>
                  <input
                    id="dialog-tournament-domain"
                    value={domain}
                    onChange={(event) => setDomain(event.target.value)}
                    placeholder="optional.example.com"
                  />
                </Field>
                <SwitchLabel>
                  <input
                    type="checkbox"
                    checked={pullTournamentAssets}
                    onChange={(event) => setPullTournamentAssets(event.target.checked)}
                  />
                  <span>
                    <strong>Pull tournament assets</strong>
                    <small>Shared assets become visible in this tournament, but they stay read-only here.</small>
                  </span>
                </SwitchLabel>
                <CardActions>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Creating..." : "Create Tournament"}
                  </Button>
                  <GhostButton type="button" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </GhostButton>
                </CardActions>
              </Form>
            </DialogPanel>
          </DialogBackdrop>
        )}

        {mode === "list" && (
          <Panel>
            <PanelHeader>
              <PanelTitle>Accessible Tournaments</PanelTitle>
              <Count>{tournaments.length}</Count>
            </PanelHeader>

            <TournamentList>
              {tournaments.length === 0 ? (
                <Empty>{isLoading ? "Loading tournaments..." : "No tournaments found."}</Empty>
              ) : (
                tournaments.map((tournament) => (
                  <TournamentCard
                    key={tournament.slug || tournament.id}
                    $active={selectedSlug === tournament.slug}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectTournament(tournament)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleSelectTournament(tournament);
                      }
                    }}
                  >
                    {editingId === tournament.id ? (
                      <EditPanel
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <Field>
                          <label>Name</label>
                          <input
                            value={editDraft.name}
                            onChange={(event) =>
                              setEditDraft((draft) => ({ ...draft, name: event.target.value }))
                            }
                          />
                        </Field>
                        <Field>
                          <label>Slug</label>
                          <input
                            value={editDraft.slug}
                            onChange={(event) =>
                              setEditDraft((draft) => ({ ...draft, slug: event.target.value }))
                            }
                          />
                          <Hint>URL slug: {slugify(editDraft.slug || editDraft.name) || "-"}</Hint>
                        </Field>
                        <Field>
                          <label>Domain</label>
                          <input
                            value={editDraft.domain}
                            onChange={(event) =>
                              setEditDraft((draft) => ({ ...draft, domain: event.target.value }))
                            }
                          />
                        </Field>
                        <SwitchLabel>
                          <input
                            type="checkbox"
                            checked={editDraft.pullTournamentAssets}
                            onChange={(event) =>
                              setEditDraft((draft) => ({
                                ...draft,
                                pullTournamentAssets: event.target.checked,
                              }))
                            }
                          />
                          <span>
                            <strong>Pull tournament assets</strong>
                            <small>Shared rows are visible here but cannot be edited or deleted from this tournament.</small>
                          </span>
                        </SwitchLabel>
                        <CardActions>
                          <SelectButton
                            type="button"
                            onClick={() => handleUpdateTournament(tournament)}
                            disabled={isSaving}
                          >
                            Save
                          </SelectButton>
                          <GhostButton type="button" onClick={cancelEditTournament}>
                            Cancel
                          </GhostButton>
                        </CardActions>
                      </EditPanel>
                    ) : (
                      <>
                        <TournamentName>{tournament.name}</TournamentName>
                        <MetaRow>
                          <MetaLabel>Slug</MetaLabel>
                          <Mono>{tournament.slug}</Mono>
                        </MetaRow>
                        <MetaRow>
                          <MetaLabel>Role</MetaLabel>
                          <Badge>{tournament.role || "owner"}</Badge>
                        </MetaRow>
                        <MetaRow>
                          <MetaLabel>Domain</MetaLabel>
                          <span>{tournament.domain || "-"}</span>
                        </MetaRow>
                        <MetaRow>
                          <MetaLabel>Assets</MetaLabel>
                          <span>{tournament.pullTournamentAssets ? "Pull shared assets" : "Own assets only"}</span>
                        </MetaRow>
                        <CardActions>
                          <SelectButton
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleSelectTournament(tournament);
                            }}
                            disabled={selectedSlug === tournament.slug}
                          >
                            {selectedSlug === tournament.slug ? "Selected" : "Open Tournament"}
                          </SelectButton>
                          <GhostButton
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              startEditTournament(tournament);
                            }}
                          >
                            Edit
                          </GhostButton>
                          {canDeleteTournaments && (
                            <DangerButton
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDeleteTournament(tournament);
                              }}
                              disabled={isSaving}
                            >
                              Delete
                            </DangerButton>
                          )}
                        </CardActions>
                      </>
                    )}
                  </TournamentCard>
                ))
              )}
            </TournamentList>
          </Panel>
        )}

        {mode === "roles" && (
        <UsersPanel>
          <PanelHeader>
            <div>
              <PanelTitle>User Access</PanelTitle>
              <PanelHint>
                {canManageUsers
                  ? "Super/admin users can assign system roles and tournament access."
                  : "Your current account role and tournament access."}
              </PanelHint>
            </div>
            {canManageUsers && (
              <RefreshButton type="button" onClick={loadUsers}>
                Refresh Users
              </RefreshButton>
            )}
          </PanelHeader>

          {visibleUsers.length === 0 ? (
            <Empty>No users loaded. Only admin and super admin accounts can view this list.</Empty>
          ) : (
            <UserList>
              <RoleGridHeader>
                <span>User</span>
                <span>System</span>
                <span>Status</span>
                <span>Tournament Access</span>
                <span>Actions</span>
              </RoleGridHeader>
              {visibleUsers.map((user) => {
                const key = String(user.id || user.email || "");
                const draft = userDrafts[String(user.id || "")] || {
                  role: user.role || "user",
                  isActive: Boolean(user.isActive),
                  tournamentSlug: selectedSlug,
                  tournamentRole: "viewer",
                };

                return (
                  <UserCard key={key}>
                    <UserIdentity>
                      <TournamentName>{user.name || user.email || "User"}</TournamentName>
                      <Muted>{user.email || "-"}</Muted>
                    </UserIdentity>

                    {canManageUsers ? (
                    <UserControls>
                      <Field>
                        <label>System Role</label>
                        <select
                          value={draft.role}
                          onChange={(event) => patchUserDraft(user.id, { role: event.target.value })}
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                          <option value="super_admin">super_admin</option>
                        </select>
                      </Field>

                      <CheckLabel>
                        <input
                          type="checkbox"
                          checked={draft.isActive}
                          onChange={(event) => patchUserDraft(user.id, { isActive: event.target.checked })}
                        />
                        Active
                      </CheckLabel>

                      <SmallButton type="button" onClick={() => handleSaveUser(user)}>
                        Save Role
                      </SmallButton>

                      <Field>
                        <label>Tournament</label>
                        <select
                          value={draft.tournamentSlug}
                          onChange={(event) => patchUserDraft(user.id, { tournamentSlug: event.target.value })}
                        >
                          {tournaments.map((tournament) => (
                            <option key={tournament.slug} value={tournament.slug}>
                              {tournament.name}
                            </option>
                          ))}
                        </select>
                      </Field>

                      <Field>
                        <label>Access</label>
                        <select
                          value={draft.tournamentRole}
                          onChange={(event) => patchUserDraft(user.id, { tournamentRole: event.target.value })}
                        >
                          <option value="viewer">viewer</option>
                          <option value="editor">editor</option>
                          <option value="owner">owner</option>
                        </select>
                      </Field>

                      <SmallButton type="button" onClick={() => handleAssignTournament(user)}>
                        Assign
                      </SmallButton>
                    </UserControls>
                    ) : (
                      <ReadOnlyRoleGrid>
                        <Badge>{user.role || "user"}</Badge>
                        <StatusPill $active={Boolean(user.isActive)}> 
                          {user.isActive ? "Active" : "Inactive"}
                        </StatusPill>
                        <AccessList>
                          {(user.tournaments || []).map((tournament) => (
                            <span key={tournament.slug}>
                              {tournament.name || tournament.slug} ({tournament.role || "viewer"})
                            </span>
                          ))}
                          {!(user.tournaments || []).length && <span>No tournament assigned</span>}
                        </AccessList>
                      </ReadOnlyRoleGrid>
                    )}
                  </UserCard>
                );
              })}
            </UserList>
          )}
        </UsersPanel>
        )}
      </Shell>
    </Page>
  );
};

export default TournamentManagerView;

export const TournamentCreateView = () => <TournamentManagerView mode="create" />;

export const TournamentRolesView = () => <TournamentManagerView mode="roles" />;

const GlobalStyle = createGlobalStyle`
  html, body, #root {
    min-height: 100%;
    margin: 0;
    background: var(--project-background, #070b12);
  }
`;

const Page = styled.main`
  min-height: 100vh;
  padding: 28px 16px;
  box-sizing: border-box;
  background:
    linear-gradient(135deg, rgba(var(--project-primary-rgb, 239, 68, 68), 0.16), transparent 32%),
    linear-gradient(315deg, rgba(var(--project-secondary-rgb, 56, 189, 248), 0.14), transparent 36%),
    var(--project-background, #070b12);
  color: var(--project-text-primary, #f8fafc);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
`;

const Shell = styled.section`
  width: min(1180px, 100%);
  margin: 0 auto;
`;

const Header = styled.header`
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;

  @media (max-width: 720px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const HeaderActions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
`;

const AddButton = styled.button`
  width: 42px;
  height: 42px;
  border: 1px solid var(--project-accent, #bfff00);
  border-radius: 999px;
  background: rgba(var(--project-accent-rgb, 191, 255, 0), 0.12);
  color: var(--project-accent, #bfff00);
  cursor: pointer;
  font-size: 1.45rem;
  font-weight: 900;
  line-height: 1;
`;

const Kicker = styled.div`
  color: var(--project-accent, #bfff00);
  font-size: 0.8rem;
  font-weight: 900;
  text-transform: uppercase;
`;

const Title = styled.h1`
  margin: 6px 0 0;
  font-size: clamp(2.2rem, 5vw, 4.4rem);
  line-height: 1;
`;

const RefreshButton = styled.button`
  min-height: 40px;
  border: 1px solid var(--project-border, #334155);
  border-radius: 7px;
  background: var(--project-surface, #111827);
  color: var(--project-text-primary, #ffffff);
  padding: 0 14px;
  cursor: pointer;
  font-weight: 800;
`;

const Notice = styled.div`
  margin-bottom: 14px;
  padding: 12px 14px;
  border: 1px solid rgba(var(--project-secondary-rgb, 56, 189, 248), 0.34);
  border-radius: 8px;
  background: rgba(var(--project-secondary-rgb, 56, 189, 248), 0.08);
  color: var(--project-text-secondary, #cbd5e1);
`;

const Alert = styled.div<{ $tone: "danger" | "success" }>`
  margin-bottom: 12px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === "danger"
        ? "rgba(var(--project-danger-rgb, 239, 68, 68), 0.42)"
        : "rgba(var(--project-success-rgb, 34, 197, 94), 0.42)"};
  background:
    ${({ $tone }) =>
      $tone === "danger"
        ? "rgba(var(--project-danger-rgb, 239, 68, 68), 0.12)"
        : "rgba(var(--project-success-rgb, 34, 197, 94), 0.12)"};
  color: ${({ $tone }) => ($tone === "danger" ? "var(--project-danger, #ef4444)" : "var(--project-success, #22c55e)")};
  font-weight: 800;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(320px, 0.82fr) minmax(0, 1.18fr);
  gap: 16px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.section`
  min-width: 0;
  padding: 18px;
  border: 1px solid var(--project-border, #334155);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.82);
`;

const SinglePanel = styled(Panel)`
  max-width: 620px;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
`;

const PanelHint = styled.p`
  margin: 4px 0 0;
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.9rem;
`;

const PanelTitle = styled.h2`
  margin: 0 0 12px;
  font-size: 1.1rem;

  ${PanelHeader} & {
    margin-bottom: 0;
  }
`;

const Count = styled.span`
  min-width: 34px;
  min-height: 28px;
  display: inline-grid;
  place-items: center;
  border: 1px solid var(--project-border, #334155);
  border-radius: 999px;
  color: var(--project-accent, #bfff00);
  font-weight: 900;
`;

const Form = styled.form`
  display: grid;
  gap: 14px;
`;

const Field = styled.div`
  display: grid;
  gap: 7px;

  label {
    color: var(--project-text-secondary, #94a3b8);
    font-size: 0.78rem;
    font-weight: 900;
    text-transform: uppercase;
  }

  input {
    height: 42px;
    padding: 0 12px;
    border: 1px solid var(--project-border, #334155);
    border-radius: 7px;
    background: var(--project-background, #0b0f19);
    color: var(--project-text-primary, #ffffff);
    font: inherit;
  }

  select {
    height: 42px;
    padding: 0 12px;
    border: 1px solid var(--project-border, #334155);
    border-radius: 7px;
    background: var(--project-background, #0b0f19);
    color: var(--project-text-primary, #ffffff);
    font: inherit;
  }
`;

const Hint = styled.span`
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.82rem;
`;

const Button = styled.button`
  min-height: 44px;
  border: 0;
  border-radius: 7px;
  background: var(--project-primary, #ef4444);
  color: #ffffff;
  cursor: pointer;
  font-weight: 900;

  &:disabled {
    cursor: wait;
    opacity: 0.7;
  }
`;

const DialogBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 200;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(2, 6, 23, 0.72);
  backdrop-filter: blur(10px);
`;

const DialogPanel = styled.section`
  width: min(520px, 100%);
  padding: 18px;
  border: 1px solid var(--project-border, #334155);
  border-radius: 8px;
  background: var(--project-surface, #111827);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.42);
`;

const DialogHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
`;

const IconButton = styled.button`
  width: 34px;
  height: 34px;
  border: 1px solid var(--project-border, #334155);
  border-radius: 7px;
  background: transparent;
  color: var(--project-text-primary, #ffffff);
  cursor: pointer;
  font-weight: 900;
`;

const TournamentList = styled.div`
  display: grid;
  gap: 10px;
`;

const Empty = styled.div`
  padding: 20px;
  border: 1px dashed var(--project-border, #334155);
  border-radius: 8px;
  color: var(--project-text-secondary, #94a3b8);
`;

const TournamentCard = styled.article<{ $active: boolean }>`
  display: grid;
  gap: 9px;
  padding: 14px;
  border: 1px solid
    ${({ $active }) =>
      $active
        ? "var(--project-accent, #bfff00)"
        : "rgba(148, 163, 184, 0.22)"};
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.38);
  cursor: pointer;
  transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;

  &:hover {
    border-color: var(--project-secondary, #38bdf8);
    background: rgba(2, 6, 23, 0.58);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid var(--project-accent, #bfff00);
    outline-offset: 2px;
  }
`;

const TournamentName = styled.h3`
  margin: 0;
  font-size: 1rem;
`;

const MetaRow = styled.div`
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  color: var(--project-text-secondary, #cbd5e1);
  font-size: 0.9rem;
`;

const MetaLabel = styled.span`
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.74rem;
  font-weight: 900;
  text-transform: uppercase;
`;

const Mono = styled.code`
  overflow-wrap: anywhere;
  color: var(--project-secondary, #38bdf8);
`;

const Badge = styled.span`
  justify-self: start;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(var(--project-accent-rgb, 191, 255, 0), 0.1);
  color: var(--project-accent, #bfff00);
  font-size: 0.78rem;
  font-weight: 900;
`;

const SelectButton = styled.button`
  justify-self: start;
  min-height: 36px;
  border: 1px solid var(--project-border, #334155);
  border-radius: 7px;
  background: var(--project-surface, #111827);
  color: var(--project-text-primary, #ffffff);
  padding: 0 12px;
  cursor: pointer;
  font-weight: 900;

  &:disabled {
    border-color: var(--project-accent, #bfff00);
    color: var(--project-accent, #bfff00);
    cursor: default;
  }
`;

const CardActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

const GhostButton = styled.button`
  min-height: 36px;
  border: 1px solid var(--project-border, #334155);
  border-radius: 7px;
  background: transparent;
  color: var(--project-text-primary, #ffffff);
  padding: 0 12px;
  cursor: pointer;
  font-weight: 900;

  &:hover {
    border-color: var(--project-secondary, #38bdf8);
    color: var(--project-secondary, #38bdf8);
  }
`;

const DangerButton = styled.button`
  min-height: 36px;
  border: 1px solid rgba(var(--project-danger-rgb, 239, 68, 68), 0.55);
  border-radius: 7px;
  background: rgba(var(--project-danger-rgb, 239, 68, 68), 0.12);
  color: var(--project-danger, #ef4444);
  padding: 0 12px;
  cursor: pointer;
  font-weight: 900;

  &:disabled {
    cursor: wait;
    opacity: 0.65;
  }
`;

const EditPanel = styled.div`
  display: grid;
  gap: 12px;
`;

const UsersPanel = styled(Panel)`
  margin-top: 16px;
`;

const UserList = styled.div`
  display: grid;
  gap: 10px;
`;

const RoleGridHeader = styled.div`
  display: grid;
  grid-template-columns: minmax(220px, 1.1fr) minmax(120px, 0.6fr) minmax(100px, 0.5fr) minmax(260px, 1.25fr) minmax(110px, 0.55fr);
  gap: 12px;
  padding: 0 14px 4px;
  color: var(--project-text-secondary, #94a3b8);
  font-size: 0.74rem;
  font-weight: 900;
  text-transform: uppercase;

  @media (max-width: 980px) {
    display: none;
  }
`;

const UserCard = styled.article`
  display: grid;
  grid-template-columns: minmax(220px, 1.1fr) minmax(0, 2.9fr);
  gap: 12px;
  align-items: center;
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 8px;
  background: rgba(2, 6, 23, 0.34);

  @media (max-width: 920px) {
    grid-template-columns: 1fr;
  }
`;

const UserIdentity = styled.div`
  display: grid;
  gap: 5px;
`;

const Muted = styled.span`
  color: var(--project-text-secondary, #94a3b8);
  overflow-wrap: anywhere;
`;

const UserControls = styled.div`
  display: grid;
  grid-template-columns: minmax(120px, 0.8fr) minmax(100px, 0.55fr) minmax(112px, 0.58fr) minmax(150px, 0.85fr) minmax(120px, 0.7fr) minmax(112px, 0.58fr);
  gap: 10px;
  align-items: end;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const ReadOnlyRoleGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(120px, 0.6fr) minmax(100px, 0.5fr) minmax(240px, 1.4fr);
  gap: 10px;
  align-items: center;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const StatusPill = styled.span<{ $active: boolean }>`
  justify-self: start;
  padding: 5px 9px;
  border-radius: 999px;
  background: ${({ $active }) =>
    $active
      ? "rgba(var(--project-success-rgb, 34, 197, 94), 0.14)"
      : "rgba(var(--project-danger-rgb, 239, 68, 68), 0.14)"};
  color: ${({ $active }) =>
    $active ? "var(--project-success, #22c55e)" : "var(--project-danger, #ef4444)"};
  font-size: 0.78rem;
  font-weight: 900;
`;

const AccessList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  color: var(--project-text-secondary, #cbd5e1);

  span {
    padding: 5px 8px;
    border: 1px solid var(--project-border, #334155);
    border-radius: 999px;
    background: rgba(2, 6, 23, 0.32);
    font-size: 0.82rem;
  }
`;

const CheckLabel = styled.label`
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--project-text-secondary, #cbd5e1);
  font-weight: 900;
`;

const SwitchLabel = styled.label`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  padding: 12px;
  border: 1px solid var(--project-border, #334155);
  border-radius: 7px;
  background: rgba(2, 6, 23, 0.26);
  color: var(--project-text-primary, #ffffff);

  input {
    width: 18px;
    height: 18px;
    margin-top: 2px;
  }

  span {
    display: grid;
    gap: 3px;
  }

  strong {
    font-size: 0.9rem;
  }

  small {
    color: var(--project-text-secondary, #94a3b8);
    line-height: 1.45;
  }
`;

const SmallButton = styled.button`
  min-height: 42px;
  border: 1px solid var(--project-primary, #ef4444);
  border-radius: 7px;
  background: var(--project-primary, #ef4444);
  color: #ffffff;
  cursor: pointer;
  font-weight: 900;
`;
