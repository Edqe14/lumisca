import { Layout } from '@/components/layout';
import { AppDashboardContent } from './content';
import { withAuthenticated } from '@/components/authenticated';

function AppDashboard() {
  return (
    <Layout>
      <AppDashboardContent />
    </Layout>
  );
}

export default withAuthenticated(AppDashboard);
