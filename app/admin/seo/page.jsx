'use client';

import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Search, ShieldCheck, Zap, BarChart3, Globe, Sparkles, AlertTriangle, CheckCircle2, ArrowRight, Loader2, Target, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/app/components/ui/button';

const SeoAnalyticsPage = () => {
    const { fetchWithAuth } = useAppContext();
    const [auditData, setAuditData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const runAudit = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchWithAuth('/api/admin/ai/seo-audit');
            const data = await response.json();
            if (!response.ok) throw new Error(data.details || data.error || 'SEO Audit Protocol Failed');
            setAuditData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        runAudit();
    }, []);

    if (loading) {
        return (
            <div className="min-h-[600px] flex flex-col items-center justify-center gap-6">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                    <Globe className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 animate-pulse" size={32} />
                </div>
                <div className="text-center space-y-2">
                    <p className="text-sm font-black uppercase tracking-[0.4em] text-gray-900">Scanning Global Index</p>
                    <p className="text-xs text-gray-400 italic">AI Strategist is calculating neural rankings...</p>
                </div>
            </div>
        );
    }

    if (error || !auditData) {
        return (
            <div className="min-h-[600px] flex flex-col items-center justify-center gap-6 text-center">
                <div className="w-20 h-20 rounded-[2rem] bg-red-50 flex items-center justify-center text-red-500 border border-red-100">
                    <AlertTriangle size={32} />
                </div>
                <div className="space-y-2">
                    <p className="text-sm font-black uppercase tracking-[0.4em] text-gray-900">Audit Protocol Terminated</p>
                    <p className="text-xs text-red-400 font-medium italic">Reason: {error || 'Neural connection timed out.'}</p>
                </div>
                <Button onClick={runAudit} className="mt-4 bg-gray-900 text-white rounded-xl px-8 py-4 text-[10px] font-black uppercase tracking-widest">
                    Retry Neutral Scan
                </Button>
            </div>
        );
    }

    const { audit, analysis } = auditData;

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">AI SEO Command Center</h2>
                    <p className="text-sm text-gray-400 mt-1">Real-time neural analysis of your visibility in global search engines</p>
                </div>
                <Button onClick={runAudit} className="bg-gray-900 hover:bg-indigo-600 text-white rounded-xl px-8 py-6 text-[11px] font-black uppercase tracking-widest shadow-xl transition-all">
                    <Zap size={14} className="mr-2" /> Run Fresh Audit
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Score Card */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-4 bg-white rounded-[3rem] border border-gray-100 p-10 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-transparent pointer-events-none"></div>
                    <div className="relative z-10 space-y-6">
                        <div className="relative w-40 h-40 mx-auto">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-50" />
                                <motion.circle 
                                    cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                    strokeDasharray={440}
                                    initial={{ strokeDashoffset: 440 }}
                                    animate={{ strokeDashoffset: 440 - (440 * (analysis?.score || 0)) / 100 }}
                                    transition={{ duration: 2, ease: "easeOut" }}
                                    className="text-indigo-600"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-5xl font-black text-gray-900 tracking-tighter">{analysis?.score || 0}</span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Health</span>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Neural Visibility Score</h3>
                            <p className="text-sm text-gray-400 mt-2 max-w-[200px] mx-auto">Your overall optimization rank across the boutique ecosystem.</p>
                        </div>
                    </div>
                </motion.div>

                {/* Technical Audit Grid */}
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                        { title: "Catalog Optimization", val: audit.missingSlugs === 0 ? "Optimal" : `${audit.missingSlugs} Pending`, icon: Target, color: "text-indigo-600", bg: "bg-indigo-50", desc: "Product path structures and slug health" },
                        { title: "Meta Descriptions", val: audit.shortDescriptions === 0 ? "Excellent" : `${audit.shortDescriptions} Short`, icon: BarChart3, color: "text-amber-600", bg: "bg-amber-50", desc: "Short-form catalog descriptions" },
                        { title: "Dossier Depth", val: audit.missingLongDescriptions === 0 ? "Complete" : `${audit.missingLongDescriptions} Sparse`, icon: ShieldCheck, color: "text-blue-600", bg: "bg-blue-50", desc: "Luxury product storytelling health" },
                        { title: "Visual Accessibility", val: audit.missingAltTexts === 0 ? "Perfect" : `${audit.missingAltTexts} Missing`, icon: Globe, color: audit.missingAltTexts > 0 ? "text-red-600" : "text-green-600", bg: audit.missingAltTexts > 0 ? "bg-red-50" : "bg-green-50", desc: "Image alt-text and SEO crawlability" }
                    ].map((item, i) => (
                        <motion.div 
                            key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                            className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm flex items-start gap-6 hover:shadow-lg transition-all duration-500"
                        >
                            <div className={`w-14 h-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center flex-shrink-0`}>
                                <item.icon size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.title}</p>
                                <h4 className="text-lg font-bold text-gray-900 leading-none mb-2">{item.val}</h4>
                                <p className="text-xs text-gray-400 font-medium italic leading-relaxed">{item.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* AI Strategic Roadmap */}
            <section className="space-y-8">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 tracking-tight">AI Strategic Roadmap</h3>
                        <p className="text-xs text-gray-400 mt-0.5">High-impact actions generated by the Naya Lumière Neural Network</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {analysis?.recommendations?.map((rec, i) => (
                        <motion.div 
                            key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}
                            className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-sm relative overflow-hidden flex flex-col group hover:border-indigo-200 transition-all duration-500"
                        >
                            <div className="absolute top-0 right-0 p-6">
                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                    rec.impact === 'High' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                }`}>
                                    {rec.impact} Impact
                                </span>
                            </div>
                            
                            <div className="flex-grow space-y-4">
                                <h4 className="text-lg font-bold text-gray-900 pr-12 group-hover:text-indigo-600 transition-colors">{rec.title}</h4>
                                <p className="text-sm text-gray-500 leading-relaxed font-medium italic opacity-80">"{rec.action}"</p>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Execute Protocol</span>
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                    <ArrowRight size={14} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Market Intelligence */}
            <motion.section 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                className="bg-gray-900 rounded-[3rem] p-12 text-white relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <TrendingUp size={200} />
                </div>
                <div className="relative z-10 grid lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-4 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg"><Globe size={16} /></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Market Intelligence</span>
                        </div>
                        <h2 className="text-3xl font-serif italic tracking-tight">Competitive Landscape <br/> Analysis</h2>
                    </div>
                    <div className="lg:col-span-8 bg-white/5 backdrop-blur-xl rounded-[2rem] p-10 border border-white/10">
                        <p className="text-lg font-medium leading-[1.8] text-gray-300 italic">
                            "{analysis?.marketInsights || 'The network is still aggregating regional search data. Maintain focus on premium keyword density.'}"
                        </p>
                    </div>
                </div>
            </motion.section>
        </div>
    );
};

export default SeoAnalyticsPage;