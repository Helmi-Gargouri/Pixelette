import PageBreadcrumb from '@/components/PageBreadcrumb';
import GalerieListTable from './components/GalerieListTable';
import PageMeta from '@/components/PageMeta';

const Index = () => {
  return <>
      <PageMeta title="Galeries - Liste" />
      <main>
        <PageBreadcrumb subtitle="Galeries" title="Liste des Galeries" />
        <GalerieListTable />
      </main>
    </>;
};

export default Index;

