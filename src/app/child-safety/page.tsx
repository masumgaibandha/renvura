import type { Metadata } from 'next';
import { PendingRoute, createPendingMetadata } from '@/components/ui/PolicyRoute';

export const metadata: Metadata = createPendingMetadata('child-safety');

export default function Page() {
  return <PendingRoute routeKey="child-safety" />;
}
