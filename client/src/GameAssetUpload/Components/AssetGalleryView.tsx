import styled from "styled-components";
import useGameAssetGalleryController from "../Controller/useGameAssetGalleryController";

type AssetGalleryViewProps = {
  title: string;
  note: string;
  countLabel: string;
  idLabel: string;
  getUrl: string;
};

const AssetGalleryView = ({
  title,
  note,
  countLabel,
  idLabel,
  getUrl,
}: AssetGalleryViewProps) => {
  const { error, isLoading, records } = useGameAssetGalleryController(getUrl);

  return (
    <Page>
      <Header>
        <div>
          <h2>{title}</h2>
          <p>{note}</p>
        </div>
        <Counter>
          {records.length} {countLabel}
        </Counter>
      </Header>

      {error && <Status>{error}</Status>}
      {isLoading && <Status>Loading assets...</Status>}

      {!isLoading && records.length === 0 ? (
        <EmptyState>No asset records found.</EmptyState>
      ) : (
        <Grid>
          {records.map((record, index) => (
            <Card key={record.id || record._id || `${record.assetId}-${index}`}>
              <ImageStage>
                {record.imageUrl ? (
                  <AssetImage
                    src={record.imageUrl}
                    alt={record.name || `${title} ${index + 1}`}
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <ImageFallback>{record.name?.slice(0, 2) || "NA"}</ImageFallback>
                )}
                <IdBadge>
                  {idLabel} {record.assetId || "-"}
                </IdBadge>
              </ImageStage>

              <InfoPanel>
                <NameText title={record.name}>{record.name || "Unnamed"}</NameText>
                {record.description ? (
                  <Description title={record.description}>{record.description}</Description>
                ) : (
                  <Description>No description</Description>
                )}
                {record.imageUrl ? (
                  <AssetLink href={record.imageUrl} target="_blank" rel="noopener noreferrer">
                    Open image
                  </AssetLink>
                ) : (
                  <Muted>No image</Muted>
                )}
              </InfoPanel>
            </Card>
          ))}
        </Grid>
      )}
    </Page>
  );
};

export default AssetGalleryView;

const Page = styled.div`
  min-height: 100vh;
  padding: 2rem 1.25rem;
  box-sizing: border-box;
  background:
    linear-gradient(180deg, var(--project-background, rgba(8, 13, 21, 0.96)), var(--project-surface, rgba(15, 23, 42, 0.98))),
    linear-gradient(90deg, rgba(var(--project-primary-rgb, 239, 68, 68), 0.08), rgba(var(--project-secondary-rgb, 20, 184, 166), 0.05));
  color: var(--project-text-primary, #f8fafc);
  font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`;

const Header = styled.div`
  width: min(100%, 1180px);
  margin: 0 auto 1.25rem;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;

  h2 {
    margin: 0;
    font-size: clamp(1.55rem, 3vw, 2.45rem);
    letter-spacing: 0;
    line-height: 1.05;
  }

  p {
    margin: 0.55rem 0 0;
    color: var(--project-text-secondary, #94a3b8);
    font-size: 0.92rem;
  }

  @media (max-width: 680px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const Counter = styled.div`
  border: 1px solid var(--project-border, #334155);
  border-radius: 0.45rem;
  padding: 0.55rem 0.8rem;
  background: var(--project-surface, rgba(15, 23, 42, 0.82));
  color: var(--project-text-secondary, #cbd5e1);
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
`;

const Grid = styled.div`
  width: min(100%, 1180px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
`;

const Card = styled.article`
  overflow: hidden;
  border-radius: 0.5rem;
  border: 1px solid var(--project-border, #243244);
  background: var(--project-surface, rgba(15, 23, 42, 0.9));
  box-shadow: 0 16px 35px rgba(0, 0, 0, 0.24);
`;

const ImageStage = styled.div`
  position: relative;
  aspect-ratio: 1 / 1;
  display: grid;
  place-items: center;
  background:
    linear-gradient(145deg, rgba(30, 41, 59, 0.62), rgba(2, 6, 23, 0.95)),
    radial-gradient(circle at 50% 38%, rgba(var(--project-primary-rgb, 239, 68, 68), 0.14), transparent 42%);
`;

const AssetImage = styled.img`
  width: 78%;
  height: 78%;
  object-fit: contain;
  filter: drop-shadow(0 18px 25px rgba(0, 0, 0, 0.36));
`;

const ImageFallback = styled.div`
  width: 72%;
  height: 72%;
  border: 1px solid #334155;
  border-radius: 0.5rem;
  display: grid;
  place-items: center;
  color: #cbd5e1;
  font-size: 1.8rem;
  font-weight: 900;
  background: rgba(15, 23, 42, 0.78);
  text-transform: uppercase;
`;

const IdBadge = styled.div`
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  border-radius: 0.35rem;
  padding: 0.28rem 0.5rem;
  background: rgba(2, 6, 23, 0.78);
  color: #cbd5e1;
  font-size: 0.72rem;
  font-weight: 800;
`;

const InfoPanel = styled.div`
  min-height: 118px;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.55rem;
`;

const NameText = styled.h3`
  margin: 0;
  font-size: 1rem;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Description = styled.div`
  color: #94a3b8;
  font-size: 0.8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const AssetLink = styled.a`
  color: #93c5fd;
  text-decoration: none;
  font-size: 0.78rem;
  font-weight: 800;

  &:hover {
    text-decoration: underline;
  }
`;

const Muted = styled.span`
  color: #64748b;
  font-size: 0.78rem;
`;

const Status = styled.div`
  width: min(100%, 1180px);
  margin: 0 auto 1rem;
  border: 1px solid var(--project-border, #334155);
  border-radius: 0.45rem;
  background: rgba(15, 23, 42, 0.82);
  color: var(--project-text-secondary, #cbd5e1);
  padding: 0.75rem 0.85rem;
  font-size: 0.86rem;
`;

const EmptyState = styled.div`
  width: min(100%, 1180px);
  margin: 0 auto;
  min-height: 280px;
  display: grid;
  place-items: center;
  border: 1px solid #243244;
  border-radius: 0.5rem;
  background: rgba(15, 23, 42, 0.82);
  color: #94a3b8;
  font-weight: 800;
`;
