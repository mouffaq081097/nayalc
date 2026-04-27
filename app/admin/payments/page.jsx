'use client';
import React, { useState, useEffect } from 'react';
import { 
    Wallet, ArrowUpRight, ArrowDownLeft, Clock, 
    RefreshCcw, DollarSign, Loader2, AlertCircle, 
    ChevronRight, CheckCircle2, History, Banknote
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { createFetchWithAuth } from '@/app/lib/api';
import { useAuth } from '@/app/context/AuthContext';

const PaymentsPage = () => {
    const { logout } = useAuth();
    const fetchWithAuth = createFetchWithAuth(logout);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isRequestingPayout, setIsRequestingPayout] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchWithAuth('/api/admin/stripe/balance');
            if (res.ok) {
                const json = await res.json();
                setData(json);
            } else {
                const err = await res.json();
                setError(err.message || 'Failed to fetch financial data');
            }
        } catch (err) {
            setError('An error occurred while connecting to Stripe');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handlePayout = async () => {
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

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-[#3b0764]">Payment Management</h1>
                    <p className="text-sm text-gray-500">Monitor your Stripe balance and manage payouts.</p>
                </div>
                <Button 
                    onClick={fetchData} 
                    variant="outline"
                    className="border-purple-100 text-purple-600 hover:bg-purple-50 rounded-xl"
                >
                    <RefreshCcw size={15} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
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
                            {(available.amount / 100).toFixed(2)} <span className="text-xl font-bold opacity-50">{available.currency.toUpperCase()}</span>
                        </h2>
                        
                        <Button 
                            onClick={handlePayout}
                            disabled={isRequestingPayout || available.amount <= 0}
                            className="mt-8 bg-[#9333ea] hover:bg-[#3b0764] text-white rounded-2xl px-8 py-6 text-[11px] font-black uppercase tracking-widest shadow-xl transition-all"
                        >
                            {isRequestingPayout ? <Loader2 className="animate-spin" /> : <><Banknote className="mr-2" size={18} /> Request Payout Now</>}
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
                            {(pending.amount / 100).toFixed(2)} <span className="text-xl font-bold opacity-50">{pending.currency.toUpperCase()}</span>
                        </h2>
                        <p className="mt-4 text-xs text-gray-400 font-medium max-w-[200px]">
                            These funds are being processed and will be available soon.
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
                                <div key={tx.id} className="p-5 flex items-center justify-between hover:bg-purple-50/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.amount > 0 ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'}`}>
                                            {tx.amount > 0 ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-bold text-gray-900 capitalize">{tx.type.replace(/_/g, ' ')}</p>
                                            <p className="text-[10px] text-gray-400 font-medium">
                                                {new Date(tx.created * 1000).toLocaleDateString()} • {tx.description || 'Stripe Transaction'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-[13px] font-black ${tx.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                            {tx.amount > 0 ? '+' : ''}{(tx.amount / 100).toFixed(2)} {tx.currency.toUpperCase()}
                                        </p>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">{tx.status}</p>
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
                                            <p className="text-[13px] font-bold text-gray-900">Manual Payout</p>
                                            <p className="text-[10px] text-gray-400 font-medium">
                                                {new Date(p.created * 1000).toLocaleDateString()} • {p.arrival_date ? `Arrival: ${new Date(p.arrival_date * 1000).toLocaleDateString()}` : 'Processing'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[13px] font-black text-gray-900">
                                            {(p.amount / 100).toFixed(2)} {p.currency.toUpperCase()}
                                        </p>
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                            p.status === 'paid' ? 'bg-green-50 text-green-600 border-green-100' : 
                                            p.status === 'failed' ? 'bg-red-50 text-red-600 border-red-100' : 
                                            'bg-orange-50 text-orange-600 border-orange-100'
                                        }`}>
                                            {p.status}
                                        </span>
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
