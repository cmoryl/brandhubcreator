import { IconStudio } from '@/components/brand/iconography';
import { useOrganization } from '@/contexts/OrganizationContext';
import { PageSkeleton } from '@/components/PageSkeleton';

const IconStudioPage = () => {
  const { organization, isLoading } = useOrganization();

  if (isLoading) return <PageSkeleton />;

  if (!organization) {
    return (
      <div className="container mx-auto py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">Icon Studio</h1>
        <p className="text-muted-foreground">
          You need an active organization to use Icon Studio.
        </p>
      </div>
    );
  }

  return (
    <IconStudio
      asPage
      organizationId={organization.id}
      organizationName={organization.name}
    />
  );
};

export default IconStudioPage;
