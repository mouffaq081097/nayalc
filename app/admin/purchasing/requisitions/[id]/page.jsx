'use client';
import { useParams } from 'next/navigation';
import RequisitionView from '../../_components/RequisitionView';

export default function RequisitionPage() {
  const { id } = useParams();
  return <RequisitionView id={id} />;
}
