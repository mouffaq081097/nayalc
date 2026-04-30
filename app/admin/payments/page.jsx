'use client';
import React, { useState, useEffect } from 'react';
import { 
    Wallet, ArrowUpRight, ArrowDownLeft, Clock, 
    RefreshCcw, DollarSign, Loader2, AlertCircle, 
    ChevronRight, CheckCircle2, History, Banknote,
    Mail, X
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { createFetchWithAuth } from '@/app/lib/api';
import { useAuth } from '@/app/context/AuthContext';

const PaymentsPage = () => {
    const { logout } = useAuth();
    const fetchWithAuth = createFetchWithAuth(logout);
    const [provider, setProvider] = useState('stripe'); // 'stripe' or 'tabby'
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isRequestingPayout, setIsRequestingPayout] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState({});
    const [isSendingTxEmail, setIsSendingTxEmail] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    const fetchData = async (targetProvider = provider) => {
        setLoading(true);
        setError(null);
        try {
            const endpoint = targetProvider === 'stripe' ? '/api/admin/stripe/balance' : '/api/admin/tabby/balance';
            const res = await fetchWithAuth(endpoint);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            } else {
                const err = await res.json();
                setError(err.message || `Failed to fetch ${targetProvider} financial data`);
            }
        } catch (err) {
            setError(`An error occurred while connecting to ${targetProvider}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [provider]);

    const handlePayout = async () => {
        if (provider === 'tabby') {
            alert('Tabby payouts are handled automatically by Tabby.');
            return;
        }
        
        if (!data || !data.balance.available[0]) return;
        
        const available = data.balance.available[0];
        if (available.amount <= 0) {
            alert('No available balance to payout.');
            return;
        }

        if (!window.confirm(`Request a payout of ${(available.amount / 100).toFixed(2)} ${available.currency.toUpperCase()}?`)) {
            return;
        }

        setIsRequestingPayout(true);
        try {
            const res = await fetchWithAuth('/api/admin/stripe/balance', {
                method: 'POST',
                body: JSON.stringify({
                    amount: available.amount / 100,
                    currency: available.currency
                })
            });

            if (res.ok) {
                setSuccessMessage('Payout requested successfully!');
                setTimeout(() => setSuccessMessage(null), 5000);
                fetchData(); // Refresh data
            } else {
                const err = await res.json();
                alert(err.message || 'Payout request failed');
            }
        } catch (err) {
            alert('Error requesting payout');
        } finally {
            setIsRequestingPayout(false);
        }
    };

    const handleResendEmail = async (payout) => {
        setIsSendingEmail(prev => ({ ...prev, [payout.id]: true }));
        try {
            const res = await fetchWithAuth('/api/admin/stripe/payout-email', {
                method: 'POST',
                body: JSON.stringify({
                    payoutId: payout.id,
                    amount: payout.amount / 100,
                    currency: payout.currency
                })
            });

            if (res.ok) {
                setSuccessMessage(`Email for payout ${payout.id} resent!`);
                setTimeout(() => setSuccessMessage(null), 5000);
            } else {
                const err = await res.json();
                alert(err.message || 'Failed to resend email');
            }
        } catch (err) {
            alert('Error resending email');
        } finally {
            setIsSendingEmail(prev => ({ ...prev, [payout.id]: false }));
        }
    };

    const handleSendTransactionEmail = async (tx) => {
        setIsSendingTxEmail(true);
        try {
            const res = await fetchWithAuth('/api/admin/stripe/transaction-email', {
                method: 'POST',
                body: JSON.stringify({
                    txDetails: tx
                })
            });

            if (res.ok) {
                setSuccessMessage(`Email for transaction ${tx.id} sent!`);
                setTimeout(() => setSuccessMessage(null), 5000);
            } else {
                const err = await res.json();
                alert(err.message || 'Failed to send transaction email');
            }
        } catch (err) {
            alert('Error sending transaction email');
        } finally {
            setIsSendingTxEmail(false);
        }
    };

    if (loading && !data) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-cl-purple animate-spin" />
                <p className="text-sm font-medium text-gray-400 font-bold uppercase tracking-widest">Accessing Ledger...</p>
            </div>
        );
    }

    const available = data?.balance?.available?.[0] || { amount: 0, currency: 'aed' };
    const pending = data?.balance?.pending?.[0] || { amount: 0, currency: 'aed' };

    const formatAmount = (amount, currency) => {
        if (provider === 'stripe') {
            return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
        }
        // Tabby is already in major units (as string or number)
        return `${parseFloat(amount).toFixed(2)} ${currency.toUpperCase()}`;
    };

    const TransactionDetailsModal = ({ tx, onClose }) => {
        if (!tx) return null;
        
        const isTabby = provider === 'tabby';
        
        if (isTabby) {
            return (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[2.5rem] w-full max-w-2xl my-8 overflow-hidden shadow-2xl"
                    >
                        <div className="p-8 border-b border-purple-50 flex justify-between items-center sticky top-0 bg-white z-10">
                            <div>
                                <h3 className="text-xl font-black text-[#3b0764]">Tabby Payment Details</h3>
                                <p className="text-xs text-gray-400 font-medium">{tx.id}</p>
                            </div>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                            <section>
                                <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] mb-4">General Information</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Status</p>
                                        <span className="text-xs font-black uppercase px-2 py-1 bg-green-50 text-green-600 rounded-lg">{tx.status}</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Created</p>
                                        <p className="text-sm font-bold text-gray-900">{new Date(tx.created_at).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Gross Amount</p>
                                        <p className="text-lg font-black text-[#3b0764]">{parseFloat(tx.amount).toFixed(2)} {tx.currency.toUpperCase()}</p>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] mb-4">Customer Details</h4>
                                <div className="bg-purple-50/30 rounded-3xl p-6 border border-purple-50">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase">Name</p>
                                            <p className="text-sm font-black text-[#3b0764]">{tx.buyer?.name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase">Email</p>
                                            <p className="text-sm font-bold text-gray-700">{tx.buyer?.email || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase">Phone</p>
                                            <p className="text-sm font-bold text-gray-700">{tx.buyer?.phone || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                        <div className="p-8 bg-purple-50/50 flex justify-end">
                            <Button onClick={onClose} className="bg-[#3b0764] hover:bg-[#1e0335] text-white rounded-2xl px-8 py-2 text-xs font-bold transition-all shadow-lg">
                                Dismiss
                            </Button>
                        </div>
                    </motion.div>
                </div>
            );
        }

        const source = tx.source;
        const isCharge = tx.type === 'charge' || tx.type === 'payment';
        
        // Fallback logic for Payment Method
        const pm = source?.payment_method;
        const pmDetails = source?.payment_method_details;
        
        // Card details fallback (Check PaymentMethod object first, then Charge details)
        const card = pm?.card || pmDetails?.card;
        
        // Billing details fallback
        const billing = pm?.billing_details || source?.billing_details;
        
        // Owner Email fallback (Check Billing, then Customer object)
        const ownerEmail = billing?.email || source?.customer?.email || source?.receipt_email;
        const ownerName = billing?.name || source?.customer?.name || 'N/A';

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[2.5rem] w-full max-w-2xl my-8 overflow-hidden shadow-2xl"
                >
                    <div className="p-8 border-b border-purple-50 flex justify-between items-center sticky top-0 bg-white z-10">
                        <div>
                            <h3 className="text-xl font-black text-[#3b0764]">Transaction Details</h3>
                            <p className="text-xs text-gray-400 font-medium">{tx.id}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2">
                            <X size={24} />
                        </button>
                    </div>
                    
                    <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                        {/* Basic Info */}
                        <section>
                            <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] mb-4">General Information</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Status</p>
                                    <span className="text-xs font-black uppercase px-2 py-1 bg-green-50 text-green-600 rounded-lg">{tx.status}</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Type</p>
                                    <p className="text-sm font-bold text-gray-900 capitalize">{tx.type.replace(/_/g, ' ')}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Created</p>
                                    <p className="text-sm font-bold text-gray-900">{new Date(tx.created * 1000).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Gross Amount</p>
                                    <p className="text-lg font-black text-[#3b0764]">{(tx.amount / 100).toFixed(2)} {tx.currency.toUpperCase()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Fee</p>
                                    <p className="text-sm font-bold text-red-500">{(tx.fee / 100).toFixed(2)} {tx.currency.toUpperCase()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Net Amount</p>
                                    <p className="text-sm font-bold text-green-600">{(tx.net / 100).toFixed(2)} {tx.currency.toUpperCase()}</p>
                                </div>
                            </div>
                            <div className="mt-4">
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Description</p>
                                <p className="text-sm font-medium text-gray-600 italic">{tx.description || 'No description provided'}</p>
                            </div>
                        </section>

                        {/* Payment Method Details (if applicable) */}
                        {isCharge && (card || billing) && (
                            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] mb-4">Payment Method</h4>
                                <div className="bg-purple-50/30 rounded-3xl p-6 border border-purple-50">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Card Info */}
                                        <div className="space-y-4">
                                            {card ? (
                                                <>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-8 bg-white border border-gray-200 rounded-md flex items-center justify-center font-bold text-[10px] text-gray-400 uppercase shadow-sm">
                                                            {card.brand || 'Card'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-gray-900">•••• •••• •••• {card.last4}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Expires {card.exp_month}/{card.exp_year}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-[9px] font-bold text-gray-400 uppercase">Issuer/Brand</p>
                                                            <p className="text-xs font-bold text-gray-700 capitalize">{card.brand}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-bold text-gray-400 uppercase">Card Type</p>
                                                            <p className="text-xs font-bold text-gray-700 capitalize">{card.funding || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-bold text-gray-400 uppercase">Origin</p>
                                                            <p className="text-xs font-bold text-gray-700">{card.country || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-bold text-gray-400 uppercase">Fingerprint</p>
                                                            <p className="text-[10px] font-mono text-gray-500 truncate" title={card.fingerprint}>{card.fingerprint || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <p className="text-xs text-gray-400 italic">No card details available</p>
                                            )}
                                        </div>

                                        {/* Owner Info */}
                                        <div className="space-y-4 border-t md:border-t-0 md:border-l border-purple-100 pt-4 md:pt-0 md:pl-8">
                                            <div>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Cardholder</p>
                                                <p className="text-sm font-black text-[#3b0764]">{ownerName}</p>
                                                <p className="text-xs font-medium text-purple-600">{ownerEmail || 'No email provided'}</p>
                                            </div>
                                            
                                            <div>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Billing Address</p>
                                                {billing?.address ? (
                                                    <div className="text-[11px] text-gray-600 leading-relaxed">
                                                        {billing.address.line1 && <p>{billing.address.line1}</p>}
                                                        {billing.address.line2 && <p>{billing.address.line2}</p>}
                                                        <p>
                                                            {billing.address.city && `${billing.address.city}, `}
                                                            {billing.address.state && `${billing.address.state} `}
                                                            {billing.address.postal_code}
                                                        </p>
                                                        <p className="font-bold text-gray-400 mt-1 uppercase tracking-tighter">{billing.address.country}</p>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-gray-400 italic">No address provided</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.section>
                        )}
                    </div>
                    
                    <div className="p-8 bg-purple-50/50 flex justify-between items-center">
                        <p className="text-[10px] text-gray-400 font-medium">Internal Reference: {source?.id || tx.id}</p>
                        <div className="flex gap-3">
                            <Button 
                                onClick={() => handleSendTransactionEmail(tx)} 
                                disabled={isSendingTxEmail}
                                variant="outline"
                                className="border-[#3b0764] text-[#3b0764] hover:bg-purple-100 rounded-2xl px-6 py-2 text-xs font-bold transition-all shadow-sm"
                            >
                                {isSendingTxEmail ? <Loader2 size={16} className="animate-spin mr-2" /> : <Mail size={16} className="mr-2" />}
                                Email Details
                            </Button>
                            <Button onClick={onClose} className="bg-[#3b0764] hover:bg-[#1e0335] text-white rounded-2xl px-8 py-2 text-xs font-bold transition-all shadow-lg">
                                Dismiss
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    };

    return (
        <div className="space-y-8 pb-20">
            <AnimatePresence>
                {selectedTransaction && (
                    <TransactionDetailsModal 
                        tx={selectedTransaction} 
                        onClose={() => setSelectedTransaction(null)} 
                    />
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#3b0764]">Payment Management</h1>
                    <p className="text-sm text-gray-500">Monitor your {provider === 'stripe' ? 'Stripe' : 'Tabby'} balance and manage payouts.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-purple-50 p-1 rounded-2xl border border-purple-100 flex">
                        <button 
                            onClick={() => setProvider('stripe')}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${provider === 'stripe' ? 'bg-white text-[#3b0764] shadow-sm' : 'text-gray-400 hover:text-purple-600'}`}
                        >
                            Stripe
                        </button>
                        <button 
                            onClick={() => setProvider('tabby')}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${provider === 'tabby' ? 'bg-white text-[#3b0764] shadow-sm' : 'text-gray-400 hover:text-purple-600'}`}
                        >
                            Tabby
                        </button>
                    </div>
                    <Button 
                        onClick={() => fetchData()} 
                        variant="outline"
                        className="border-purple-100 text-purple-600 hover:bg-purple-50 rounded-xl"
                    >
                        <RefreshCcw size={15} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3">
                    <AlertCircle size={20} />
                    <p className="text-sm font-bold">{error}</p>
                </div>
            )}

            {successMessage && (
                <div className="bg-green-50 border border-green-100 text-green-600 p-4 rounded-2xl flex items-center gap-3">
                    <CheckCircle2 size={20} />
                    <p className="text-sm font-bold">{successMessage}</p>
                </div>
            )}

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-8 rounded-[2.5rem] border border-purple-100 shadow-sm relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-8 text-purple-50 group-hover:text-purple-100 transition-colors">
                        <Wallet size={80} strokeWidth={1} />
                    </div>
                    
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] mb-2">Available for Payout</p>
                        <h2 className="text-4xl font-black text-[#3b0764]">
                            {formatAmount(available.amount, available.currency)}
                        </h2>
                        
                        <Button 
                            onClick={handlePayout}
                            disabled={isRequestingPayout || (provider === 'stripe' && available.amount <= 0)}
                            className="mt-8 bg-[#9333ea] hover:bg-[#3b0764] text-white rounded-2xl px-8 py-6 text-[11px] font-black uppercase tracking-widest shadow-xl transition-all"
                        >
                            {isRequestingPayout ? <Loader2 className="animate-spin" /> : <><Banknote className="mr-2" size={18} /> {provider === 'stripe' ? 'Request Payout Now' : 'Automatic Payouts'}</>}
                        </Button>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-[#fdf8ff] p-8 rounded-[2.5rem] border border-purple-100/50 shadow-sm relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-8 text-purple-100/50">
                        <Clock size={80} strokeWidth={1} />
                    </div>
                    
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] mb-2">Pending Balance</p>
                        <h2 className="text-4xl font-black text-[#3b0764]">
                            {formatAmount(pending.amount, pending.currency)}
                        </h2>
                        <p className="mt-4 text-xs text-gray-400 font-medium max-w-[200px]">
                            {provider === 'stripe' 
                                ? 'These funds are being processed and will be available soon.'
                                : 'Upcoming settlements from recent Tabby transactions.'}
                        </p>
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Transactions */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <History size={18} className="text-purple-400" />
                        <h3 className="text-sm font-black text-[#3b0764] uppercase tracking-widest">Balance History</h3>
                    </div>
                    
                    <div className="bg-white rounded-[2rem] border border-purple-50 overflow-hidden shadow-sm">
                        <div className="divide-y divide-purple-50">
                            {data?.transactions?.length > 0 ? data.transactions.map((tx) => (
                                <div 
                                    key={tx.id} 
                                    onClick={() => setSelectedTransaction(tx)}
                                    className="p-5 flex items-center justify-between hover:bg-purple-50/30 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${provider === 'stripe' ? (tx.amount > 0 ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600') : 'bg-green-50 text-green-600'}`}>
                                            {provider === 'stripe' 
                                                ? (tx.amount > 0 ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />)
                                                : <ArrowDownLeft size={18} />
                                            }
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-bold text-gray-900 capitalize">{provider === 'stripe' ? tx.type.replace(/_/g, ' ') : `Order ${tx.order?.reference_id || 'Tabby'}`}</p>
                                            <p className="text-[10px] text-gray-400 font-medium">
                                                {new Date(provider === 'stripe' ? tx.created * 1000 : tx.created_at).toLocaleDateString()} • {provider === 'stripe' ? (tx.description || 'Stripe Transaction') : (tx.buyer?.email || 'Tabby Transaction')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className={`text-[13px] font-black ${provider === 'stripe' ? (tx.amount > 0 ? 'text-green-600' : 'text-gray-900') : 'text-green-600'}`}>
                                                {provider === 'stripe' ? (tx.amount > 0 ? '+' : '') : ''}
                                                {formatAmount(tx.amount, tx.currency)}
                                            </p>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">{tx.status}</p>
                                        </div>
                                        <ChevronRight size={16} className="text-gray-300" />
                                    </div>
                                </div>
                            )) : (
                                <div className="p-10 text-center text-gray-400 text-sm font-medium italic">No recent transactions</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Payout History */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <Banknote size={18} className="text-purple-400" />
                        <h3 className="text-sm font-black text-[#3b0764] uppercase tracking-widest">Recent Payouts</h3>
                    </div>
                    
                    <div className="bg-white rounded-[2rem] border border-purple-50 overflow-hidden shadow-sm">
                        <div className="divide-y divide-purple-50">
                            {data?.payouts?.length > 0 ? data.payouts.map((p) => (
                                <div key={p.id} className="p-5 flex items-center justify-between hover:bg-purple-50/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                            <Banknote size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-bold text-gray-900">{provider === 'stripe' ? 'Manual Payout' : 'Tabby Settlement'}</p>
                                            <p className="text-[10px] text-gray-400 font-medium">
                                                {new Date(provider === 'stripe' ? p.created * 1000 : p.created_at).toLocaleDateString()} • {provider === 'stripe' ? (p.arrival_date ? `Arrival: ${new Date(p.arrival_date * 1000).toLocaleDateString()}` : 'Processing') : `Payout Date: ${p.payout_date || 'N/A'}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-[13px] font-black text-gray-900">
                                                {formatAmount(p.amount, p.currency)}
                                            </p>
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                                p.status === 'paid' || p.status === 'PAID' ? 'bg-green-50 text-green-600 border-green-100' : 
                                                p.status === 'failed' || p.status === 'FAILED' ? 'bg-red-50 text-red-600 border-red-100' : 
                                                'bg-orange-50 text-orange-600 border-orange-100'
                                            }`}>
                                                {p.status}
                                            </span>
                                        </div>
                                        {provider === 'stripe' && (
                                            <Button
                                                onClick={() => handleResendEmail(p)}
                                                disabled={isSendingEmail[p.id]}
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 rounded-lg hover:bg-purple-100 text-purple-600"
                                                title="Resend Payout Email"
                                            >
                                                {isSendingEmail[p.id] ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <div className="p-10 text-center text-gray-400 text-sm font-medium italic">No recent payouts</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentsPage;
