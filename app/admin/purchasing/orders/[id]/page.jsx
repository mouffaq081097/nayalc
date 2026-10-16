'use client';
import { useParams } from 'next/navigation';
import PurchaseOrderView from '../../_components/PurchaseOrderView';

export default function PurchaseOrderPage() {
  const { id } = useParams();
  return <PurchaseOrderView id={id} />;
}
