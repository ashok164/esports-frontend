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

const emptySpectIds = ["", "", "", ""];

const SpectatorAdminView: React.FC = () => {
  const [groupId, setGroupId] = React.useState("G1");
  const [spectIds, setSpectIds] = React.useState<string[]>(emptySpectIds);
  const [groups, setGroups] = React.useState<SpectatorGroup[]>([]);
  const [status, setStatus] = React.useState("Create spectator groups, then manage them from the table below.");
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
    setSpectIds(emptySpectIds);
    setEditingGroupId(null);
  };

  const updateSpectId = (index: number, value: string) => {
    setSpectIds((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };

  const handleSubmit = async () => {
    const normalizedSpectIds = spectIds.map((value) => value.trim()).filter(Boolean).slice(0, 4);

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
    setSpectIds(emptySpectIds.map((_, index) => group.spectIds[index] || ""));
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

  return (
    <Page>
      <Hero>
        <Eyebrow>Spectator Admin</Eyebrow>
        <Title>Manage spectator routes with a proper CRUD table.</Title>
        <Copy>
          Add spectator IDs here, edit them later, and use the live broadcast camera panel from the routes page.
        </Copy>
      </Hero>

      <FormPanel>
        <PanelHeader>
          <div>
            <PanelTitle>{editingGroupId ? "Edit Spectator Group" : "Create Spectator Group"}</PanelTitle>
            <PanelCopy>Enter up to four spectator IDs for one group.</PanelCopy>
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

        <FormGrid>
          <Field>
            <Label>Group ID</Label>
            <Input value={groupId} onChange={(event) => setGroupId(event.target.value)} placeholder="G1" />
          </Field>
          {spectIds.map((spectId, index) => (
            <Field key={`spect-${index}`}>
              <Label>Spectator ID {index + 1}</Label>
              <Input
                value={spectId}
                onChange={(event) => updateSpectId(index, event.target.value)}
                placeholder={`Enter spectator ID ${index + 1}`}
              />
            </Field>
          ))}
        </FormGrid>

        <ActionRow>
          <PrimaryButton type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {editingGroupId ? "Update Group" : "Create Group"}
          </PrimaryButton>
        </ActionRow>

        <Status>{status}</Status>
      </FormPanel>

      <TablePanel>
        <PanelTitle>Added Spectator List</PanelTitle>
        <PanelCopy>Each row is editable and deletable. Broadcast routes are generated from these spectator IDs.</PanelCopy>

        {groups.length ? (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <th>Group</th>
                  <th>Spectator IDs</th>
                  <th>Broadcast Links</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group.groupId}>
                    <td>{group.groupId}</td>
                    <td>{group.spectIds.join(", ")}</td>
                    <td>
                      <LinkList>
                        {group.spectIds.map((spectId) => (
                          <RoutePill
                            key={`${group.groupId}-${spectId}`}
                            href={`/spectator/${spectId}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {`/spectator/${spectId}`}
                          </RoutePill>
                        ))}
                      </LinkList>
                    </td>
                    <td>
                      <ActionRow>
                        <SmallButton type="button" onClick={() => handleEdit(group)}>
                          Edit
                        </SmallButton>
                        <DangerButton type="button" onClick={() => handleDelete(group)} disabled={isSubmitting}>
                          Delete
                        </DangerButton>
                      </ActionRow>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        ) : (
          <EmptyState>No spectator groups added yet.</EmptyState>
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

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
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
  min-height: 48px;
  padding: 0 14px;
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

const LinkList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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

const EmptyState = styled.div`
  color: #9eb2c9;
`;
