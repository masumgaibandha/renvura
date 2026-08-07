import type { Metadata } from 'next';
import { PendingRoute, createPendingMetadata } from '@/components/ui/PolicyRoute';

export const metadata: Metadata = createPendingMetadata('shipping');

export default function Page() {
  return <PendingRoute routeKey="shipping" />;
}
