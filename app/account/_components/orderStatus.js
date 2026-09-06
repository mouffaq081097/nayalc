import { Package, Clock, Truck, CheckCircle, XCircle } from 'lucide-react';

export const STATUS_META = {
  pending:    { label: 'Pending',    badge: 'bg-amber-50 text-amber-600', Icon: Clock },
  processing: { label: 'Processing', badge: 'bg-amber-50 text-amber-600', Icon: Clock },
  shipped:    { label: 'Shipped',    badge: 'bg-blue-50 text-blue-600',   Icon: Truck },
  delivered:  { label: 'Delivered',  badge: 'bg-green-50 text-green-700', Icon: CheckCircle },
  cancelled:  { label: 'Cancelled',  badge: 'bg-red-50 text-red-500',     Icon: XCircle },
};

export function statusMeta(status) {
  return STATUS_META[(status || '').toLowerCase()] || { label: status || 'Unknown', badge: 'bg-gray-100 text-gray-500', Icon: Package };
}
