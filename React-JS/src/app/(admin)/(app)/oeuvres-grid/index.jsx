import PageBreadcrumb from '@/components/PageBreadcrumb';
import OeuvreGrid from './components/OeuvreGrid';
import PageMeta from '@/components/PageMeta';

const Index = () => {
  return <>
      <PageMeta title="Œuvres - Vue Grille" />
      <main>
        <PageBreadcrumb title="Œuvres" subtitle="Gestion des Œuvres" />
        <OeuvreGrid />
      </main>
    </>;
};

export default Index;

