'use client';
import { useParams } from 'next/navigation';
import ReceiptView from '../../_components/ReceiptView';

export default function ReceiptPage() {
  const { id } = useParams();
  return <ReceiptView id={id} />;
}
