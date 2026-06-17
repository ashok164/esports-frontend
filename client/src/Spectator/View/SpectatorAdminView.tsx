import React from "react";
import styled from "styled-components";
import {
  createSpectatorGroupApi,
  deleteSpectatorGroupApi,
  getSpectatorGroupsApi,
  seedSampleSpectatorApi,
  SpectatorGroup,
  updateSpectatorGroupApi,
} from "../Repository/remote";

const createEmptySpectatorId = () => "";

const createEmptySpectatorIds = () => [createEmptySpectatorId()];

type SpectatorRow = {
  groupId: string;
  spectatorId: string;
  groupIndex: number;
  spectatorIndex: number;
  routePath: string;
};

const flattenSpectatorRows = (groups: SpectatorGroup[]): SpectatorRow[] =>
  groups.flatMap((group, groupIndex) =>
    (group.spectIds || []).map((spectatorId, spectatorIndex) => ({
      groupId: group.groupId,
      spectatorId,
      groupIndex,
      spectatorIndex,
      routePath: `/spectator/${spectatorId}`,
    })),
  );

const SpectatorAdminView: React.FC = () => {
  const [groupId, setGroupId] = React.useState("G1");
  const [spectIds, setSpectIds] = React.useState<string[]>(createEmptySpectatorIds);
  const [groups, setGroups] = React.useState<SpectatorGroup[]>([]);
  const [status, setStatus] = React.useState("Create spectator groups, add as many spectator IDs as needed, and open each camera route from the table.");
  const [editingGroupId, setEditingGroupId] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const loadGroups = React.useCallback(async () => {
    try {
      const response = await getSpectatorGroupsApi();
      setGroups(response.groups || []);
    } catch (error: any) {
      setStatus(error?.message || "Failed to load spectator groups.");
      setGroups([]);
    }
  }, []);

  React.useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const resetForm = () => {
    setGroupId("G1");
    setSpectIds(createEmptySpectatorIds());
    setEditingGroupId(null);
  };

  const updateSpectId = (index: number, value: string) => {
    setSpectIds((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  };

  const addSpectatorField = () => {
    setSpectIds((current) => [...current, createEmptySpectatorId()]);
  };

  const removeSpectatorField = (index: number) => {
    setSpectIds((current) => {
      if (current.length === 1) return current;
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const handleSubmit = async () => {
    const normalizedSpectIds = Array.from(
      new Set(
        spectIds.map((value) => value.trim()).filter(Boolean),
      ),
    );

    if (!groupId.trim() || normalizedSpectIds.length === 0) {
      setStatus("Group ID and at least one spectator ID are required.");
      return;
    }

    try {
      setIsSubmitting(true);

      if (editingGroupId) {
        await updateSpectatorGroupApi(editingGroupId, {
          groupId: groupId.trim(),
          spectIds: normalizedSpectIds,
        });
        setStatus(`Spectator group ${groupId.trim()} updated successfully.`);
      } else {
        await createSpectatorGroupApi({
          groupId: groupId.trim(),
          spectIds: normalizedSpectIds,
        });
        setStatus(`Spectator group ${groupId.trim()} created successfully.`);
      }

      resetForm();
      await loadGroups();
    } catch (error: any) {
      setStatus(error?.response?.data?.message || error?.message || "Failed to save spectator group.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (group: SpectatorGroup) => {
    setEditingGroupId(group.groupId);
    setGroupId(group.groupId);
    setSpectIds(group.spectIds?.length ? group.spectIds : createEmptySpectatorIds());
    setStatus(`Editing spectator group ${group.groupId}.`);
  };

  const handleDelete = async (group: SpectatorGroup) => {
    try {
      setIsSubmitting(true);
      await deleteSpectatorGroupApi(group.groupId);
      if (editingGroupId === group.groupId) {
        resetForm();
      }
      setStatus(`Spectator group ${group.groupId} deleted successfully.`);
      await loadGroups();
    } catch (error: any) {
      setStatus(error?.response?.data?.message || error?.message || "Failed to delete spectator group.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeedSample = async () => {
    try {
      setIsSubmitting(true);
      await seedSampleSpectatorApi();
      setStatus("Sample spectator group seeded successfully.");
      await loadGroups();
    } catch (error: any) {
      setStatus(error?.response?.data?.message || error?.message || "Failed to seed sample spectator data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const spectatorRows = flattenSpectatorRows(groups);

  return (
    <Page>
      <Hero>
        <Eyebrow>Spectator Admin</Eyebrow>
        <Title>Manage spectator IDs with a real CRUD table.</Title>
        <Copy>
          Add as many spectator IDs as you need inside a group, edit them later, and open each dedicated camera route directly from the table.
        </Copy>
      </Hero>

      <FormPanel>
        <PanelHeader>
          <div>
            <PanelTitle>{editingGroupId ? "Edit Spectator Group" : "Create Spectator Group"}</PanelTitle>
            <PanelCopy>Build a group first, then keep adding or removing spectator IDs like a player table.</PanelCopy>
          </div>
          <ActionRow>
            <SecondaryButton type="button" onClick={handleSeedSample} disabled={isSubmitting}>
              Seed Sample
            </SecondaryButton>
            {editingGroupId ? (
              <GhostButton
                type="button"
                onClick={() => {
                  resetForm();
                  setStatus("Edit cancelled.");
                }}
                disabled={isSubmitting}
              >
                Cancel Edit
              </GhostButton>
            ) : null}
          </ActionRow>
        </PanelHeader>

        <Field>
          <Label>Group ID</Label>
          <Input value={groupId} onChange={(event) => setGroupId(event.target.value)} placeholder="G1" />
        </Field>

        <EditorTableWrap>
          <EditorTable>
            <thead>
              <tr>
                <th>#</th>
                <th>Spectator ID</th>
                <th>Camera Route</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {spectIds.map((spectId, index) => {
                const normalized = spectId.trim();
                return (
                  <tr key={`editor-spect-${index}`}>
                    <td>{index + 1}</td>
                    <td>
                      <Input
                        value={spectId}
                        onChange={(event) => updateSpectId(index, event.target.value)}
                        placeholder={`Enter spectator ID ${index + 1}`}
                      />
                    </td>
                    <td>
                      {normalized ? (
                        <RoutePill href={`/spectator/${normalized}`} target="_blank" rel="noreferrer">
                          {`/spectator/${normalized}`}
                        </RoutePill>
                      ) : (
                        <MutedText>Enter a spectator ID to generate the camera route.</MutedText>
                      )}
                    </td>
                    <td>
                      <ActionRow>
                        <SmallButton type="button" onClick={addSpectatorField}>
                          Add Row
                        </SmallButton>
                        <DangerButton
                          type="button"
                          onClick={() => removeSpectatorField(index)}
                          disabled={spectIds.length === 1 || isSubmitting}
                        >
                          Remove
                        </DangerButton>
                      </ActionRow>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </EditorTable>
        </EditorTableWrap>

        <ActionRow>
          <PrimaryButton type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {editingGroupId ? "Update Group" : "Create Group"}
          </PrimaryButton>
        </ActionRow>

        <Status>{status}</Status>
      </FormPanel>

      <TablePanel>
        <PanelTitle>Saved Spectator IDs</PanelTitle>
        <PanelCopy>Each saved spectator ID gets its own camera route, and the spectator broadcast page filters its own websocket row by that spectator ID.</PanelCopy>

        {spectatorRows.length ? (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <th>Group</th>
                  <th>Row</th>
                  <th>Spectator ID</th>
                  <th>Camera Route</th>
                  <th>Group Actions</th>
                </tr>
              </thead>
              <tbody>
                {spectatorRows.map((row) => (
                  <tr key={`${row.groupId}-${row.spectatorId}-${row.spectatorIndex}`}>
                    <td>{row.groupId}</td>
                    <td>{row.spectatorIndex + 1}</td>
                    <td><Mono>{row.spectatorId}</Mono></td>
                    <td>
                      <RoutePill href={row.routePath} target="_blank" rel="noreferrer">
                        {row.routePath}
                      </RoutePill>
                    </td>
                    <td>
                      <ActionRow>
                        <SmallButton
                          type="button"
                          onClick={() => {
                            const group = groups.find((item) => item.groupId === row.groupId);
                            if (group) handleEdit(group);
                          }}
                        >
                          Edit Group
                        </SmallButton>
                        <DangerButton
                          type="button"
                          onClick={() => {
                            const group = groups.find((item) => item.groupId === row.groupId);
                            if (group) handleDelete(group);
                          }}
                          disabled={isSubmitting}
                        >
                          Delete Group
                        </DangerButton>
                      </ActionRow>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        ) : (
          <EmptyState>No spectator IDs added yet.</EmptyState>
        )}
      </TablePanel>
    </Page>
  );
};

export default SpectatorAdminView;

const Page = styled.main`
  min-height: 100vh;
  padding: clamp(24px, 4vw, 40px);
  background:
    radial-gradient(circle at top left, rgba(255, 70, 70, 0.16), transparent 24%),
    radial-gradient(circle at top right, rgba(0, 200, 255, 0.14), transparent 28%),
    linear-gradient(180deg, #07111e 0%, #050913 100%);
  color: #f8fbff;
`;

const Hero = styled.section`
  display: grid;
  gap: 12px;
  margin-bottom: 24px;
`;

const Eyebrow = styled.span`
  color: #9ae6b4;
  font-size: 0.8rem;
  font-weight: 900;
  text-transform: uppercase;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(2rem, 5vw, 4rem);
  line-height: 0.95;
`;

const Copy = styled.p`
  max-width: 760px;
  margin: 0;
  color: #9eb2c9;
  line-height: 1.6;
`;

const FormPanel = styled.section`
  display: grid;
  gap: 18px;
  margin-bottom: 24px;
  padding: 24px;
  border: 1px solid rgba(93, 119, 154, 0.35);
  border-radius: 18px;
  background: rgba(5, 14, 25, 0.88);
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.28);
`;

const TablePanel = styled(FormPanel)``;

const PanelHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

const PanelTitle = styled.h2`
  margin: 0 0 6px;
  font-size: 1.2rem;
`;

const PanelCopy = styled.p`
  margin: 0;
  color: #92a6bd;
  line-height: 1.5;
`;

const Field = styled.div`
  display: grid;
  gap: 8px;
`;

const Label = styled.label`
  color: #d8e2f0;
  font-size: 0.86rem;
  font-weight: 800;
`;

const Input = styled.input`
  width: 100%;
  min-height: 48px;
  padding: 0 14px;
  box-sizing: border-box;
  border: 1px solid rgba(108, 133, 173, 0.35);
  border-radius: 12px;
  background: rgba(10, 18, 32, 0.95);
  color: #ffffff;
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const PrimaryButton = styled.button`
  min-height: 46px;
  padding: 0 18px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #ff5c5c, #ff7a18);
  color: #07111e;
  font-weight: 900;
  cursor: pointer;
`;

const SecondaryButton = styled.button`
  min-height: 46px;
  padding: 0 18px;
  border: 1px solid rgba(110, 227, 255, 0.45);
  border-radius: 999px;
  background: rgba(12, 29, 40, 0.8);
  color: #9cefff;
  font-weight: 900;
  cursor: pointer;
`;

const GhostButton = styled.button`
  min-height: 46px;
  padding: 0 18px;
  border: 1px solid rgba(186, 200, 214, 0.3);
  border-radius: 999px;
  background: transparent;
  color: #dbe7f3;
  font-weight: 800;
  cursor: pointer;
`;

const SmallButton = styled.button`
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid rgba(110, 227, 255, 0.45);
  border-radius: 999px;
  background: rgba(12, 29, 40, 0.8);
  color: #9cefff;
  font-weight: 800;
  cursor: pointer;
`;

const DangerButton = styled.button`
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid rgba(255, 119, 119, 0.4);
  border-radius: 999px;
  background: rgba(67, 17, 17, 0.8);
  color: #ffb4b4;
  font-weight: 800;
  cursor: pointer;
`;

const Status = styled.p`
  margin: 0;
  color: #c9d7e6;
`;

const EditorTableWrap = styled.div`
  overflow-x: auto;
`;

const EditorTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 14px 12px;
    border-bottom: 1px solid rgba(93, 119, 154, 0.22);
    text-align: left;
    vertical-align: top;
  }

  th {
    color: #f8fbff;
    font-size: 0.86rem;
  }

  td {
    color: #c8d5e4;
  }
`;

const TableWrap = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 14px 12px;
    border-bottom: 1px solid rgba(93, 119, 154, 0.22);
    text-align: left;
    vertical-align: top;
  }

  th {
    color: #f8fbff;
    font-size: 0.86rem;
  }

  td {
    color: #c8d5e4;
  }
`;

const RoutePill = styled.a`
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid rgba(154, 230, 180, 0.35);
  border-radius: 999px;
  color: #e7fff1;
  text-decoration: none;
  background: rgba(19, 47, 40, 0.55);
`;

const Mono = styled.code`
  color: #f8fbff;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
`;

const MutedText = styled.span`
  color: #92a6bd;
  font-size: 0.9rem;
`;

const EmptyState = styled.div`
  color: #9eb2c9;
`;
