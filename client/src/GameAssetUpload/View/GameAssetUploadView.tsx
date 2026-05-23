import styled from "styled-components";
import CharacterUploadSection from "./CharacterUploadSection";
import EquipmentUploadSection from "./EquipmentUploadSection";
import RoleUploadSection from "./RoleUploadSection";
import SkillUploadSection from "./SkillUploadSection";
import WeaponUploadSection from "./WeaponUploadSection";

const GameAssetUploadView = () => {
  return (
    <PageWrapper>
      <Container>
        <Header>
          <TitleBlock>
            <h1>Game Asset Upload</h1>
            <p>Manage weapon, character, skill, role, and equipment image uploads from one admin page.</p>
          </TitleBlock>
        </Header>

        <Sections>
          <WeaponUploadSection />
          <CharacterUploadSection />
          <SkillUploadSection />
          <RoleUploadSection />
          <EquipmentUploadSection />
        </Sections>
      </Container>
    </PageWrapper>
  );
};

export default GameAssetUploadView;

const PageWrapper = styled.main`
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
  padding: 2rem 1.25rem;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.5), rgba(8, 13, 21, 0.98)),
    var(--project-background, #090d14);
  color: var(--project-text-primary, #f8fafc);
  font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`;

const Container = styled.div`
  width: min(100%, 1180px);
  margin: 0 auto;
`;

const Header = styled.header`
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--project-border, #263244);
`;

const TitleBlock = styled.div`
  h1 {
    margin: 0;
    color: var(--project-text-primary, #ffffff);
    font-size: clamp(1.7rem, 3vw, 2.6rem);
    line-height: 1.05;
    letter-spacing: 0;
  }

  p {
    max-width: 760px;
    margin: 0.55rem 0 0;
    color: var(--project-text-secondary, #94a3b8);
    font-size: 0.92rem;
  }
`;

const Sections = styled.div`
  display: grid;
  gap: 1.25rem;
`;
