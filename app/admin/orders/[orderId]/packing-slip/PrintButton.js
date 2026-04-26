// app/admin/orders/[orderId]/packing-slip/PrintButton.js
'use client';

export default function PrintButton() {
 return (
 <button
 type="button"
 onClick={() => window.print()}
 style={{
 padding: '10px 28px',
 borderRadius: '999px',
 border: 'none',
 background: 'linear-gradient(135deg, #a78bfa, #7e69e6)',
 color: 'white',
 fontFamily: "'Montserrat', sans-serif",
 fontWeight: 900,
 fontSize: '13px',
 letterSpacing: '0.08em',
 textTransform: '',
 cursor: 'pointer',
 boxShadow: '0 4px 14px rgba(147,51,234,0.3)',
 }}
 >
 Print / Save as PDF
 </button>
 );
}
