'use client';
import React, { useState, useMemo, useEffect } from 'react';
import {
    Send, Users, ShoppingCart, Mail, AlertCircle, CheckCircle2,
    Loader2, Eye, MoveUp, MoveDown,
    Type, Image as ImageIcon, MousePointer2, Layout,
    Layers, Sparkles, Package, Search,
    UserCheck, X, LayoutTemplate, Percent, Tag, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/app/components/ui/button';
import { createFetchWithAuth } from '@/app/lib/api';
import { useAuth } from '@/app/context/AuthContext';
import { useAppContext } from '@/app/context/AppContext';

const rid = () => Math.random().toString(36).substr(2, 9);

const SECTION_TYPES = {
    HERO: 'hero',
    TEXT: 'text',
    BUTTON: 'button',
    IMAGE: 'image',
    DIVIDER: 'divider',
    PRODUCT: 'product',
    PROMO_BANNER: 'promo_banner',
};

const TEMPLATES = [
    {
        id: 'new_arrivals',
        name: 'New Arrivals',
        color: '#7c3aed',
        description: 'Announce fresh collection additions',
        icon: Sparkles,
        defaultSections: () => [
            { id: rid(), type: SECTION_TYPES.HERO, data: { image: 'https://nayalc.com/GerLift_3_4x5%20copie.jpg', title: 'Just Arrived', subtitle: 'Discover our latest botanical innovations, crafted for radiant, luminous skin.', ctaText: 'Shop New Arrivals', ctaLink: 'https://nayalc.com/collections/new-arrivals' } },
            { id: rid(), type: SECTION_TYPES.TEXT, data: { content: "We've been busy in the lab. These new additions to the Naya Lumière collection represent years of research and refinement. Each formula has been carefully developed with the finest botanical ingredients sourced from around the world." } },
            { id: rid(), type: SECTION_TYPES.BUTTON, data: { text: 'Explore the Collection', link: 'https://nayalc.com/collections/new-arrivals' } },
        ],
    },
    {
        id: 'exclusive_offer',
        name: 'Exclusive Offer',
        color: '#db2777',
        description: 'Special discount or limited-time promo',
        icon: Tag,
        defaultSections: () => [
            { id: rid(), type: SECTION_TYPES.PROMO_BANNER, data: { headline: 'Exclusive Member Offer', subline: 'A special thank you from Naya Lumière', code: 'LUMIERE20', discount: '20% OFF STOREWIDE', expiry: 'Valid for 48 hours only · Minimum order AED 200' } },
            { id: rid(), type: SECTION_TYPES.TEXT, data: { content: "As a valued member of our community, we're delighted to offer you an exclusive discount. Use the code above at checkout to enjoy 20% off your entire order. This offer is valid for the next 48 hours only." } },
            { id: rid(), type: SECTION_TYPES.BUTTON, data: { text: 'Shop Now & Save', link: 'https://nayalc.com' } },
        ],
    },
    {
        id: 'product_launch',
        name: 'Product Launch',
        color: '#6d28d9',
        description: 'Spotlight a single hero product',
        icon: Package,
        defaultSections: () => [
            { id: rid(), type: SECTION_TYPES.HERO, data: { image: '', title: 'Introducing Something New', subtitle: 'The next evolution in botanical skincare has arrived. Developed in our Geneva laboratories.', ctaText: 'Discover More', ctaLink: 'https://nayalc.com' } },
            { id: rid(), type: SECTION_TYPES.PRODUCT, data: { productId: '', name: 'Select a Product', price: '0.00', image: '', brand: 'Naya Lumière', link: '#' } },
            { id: rid(), type: SECTION_TYPES.TEXT, data: { content: "This revolutionary formula combines the power of science with nature's finest botanicals. Developed in our Geneva laboratories, it delivers visible results from the very first application." } },
            { id: rid(), type: SECTION_TYPES.BUTTON, data: { text: 'Shop Now', link: 'https://nayalc.com' } },
        ],
    },
    {
        id: 'seasonal',
        name: 'Seasonal Ritual',
        color: '#0284c7',
        description: 'Curated seasonal skincare routine',
        icon: Layers,
        defaultSections: () => [
            { id: rid(), type: SECTION_TYPES.HERO, data: { image: '', title: 'Your Seasonal Skincare Ritual', subtitle: 'Transition your routine with our curated botanical selection — designed for every season.', ctaText: 'Build Your Ritual', ctaLink: 'https://nayalc.com' } },
            { id: rid(), type: SECTION_TYPES.TEXT, data: { content: "As the seasons change, so should your skincare. Our experts have curated the perfect routine to help your skin adapt and thrive through every transition. Discover the ingredients your skin needs right now." } },
            { id: rid(), type: SECTION_TYPES.BUTTON, data: { text: 'Shop Seasonal Essentials', link: 'https://nayalc.com' } },
        ],
    },
    {
        id: 'loyalty',
        name: 'Loyalty Reward',
        color: '#b45309',
        description: 'Reward loyal members with bonus points',
        icon: UserCheck,
        defaultSections: () => [
            { id: rid(), type: SECTION_TYPES.PROMO_BANNER, data: { headline: 'Your Loyalty Rewards Are Here', subline: 'Thank you for being a cherished Naya Lumière member', code: '', discount: 'BONUS POINTS ADDED', expiry: 'Points never expire · Redeem anytime' } },
            { id: rid(), type: SECTION_TYPES.TEXT, data: { content: "Your loyalty means the world to us. As a special thank you, we've added bonus loyalty points to your account. Visit your account dashboard to see your current balance and discover the exclusive rewards waiting for you." } },
            { id: rid(), type: SECTION_TYPES.BUTTON, data: { text: 'View My Rewards', link: 'https://nayalc.com/account/loyalty' } },
        ],
    },
];

const TIER_COLORS = { bronze: '#cd7f32', silver: '#94a3b8', gold: '#f59e0b', platinum: '#7c3aed' };

const MarketingPage = () => {
    const { logout } = useAuth();
    const { adminProducts } = useAppContext();
    const fetchWithAuth = createFetchWithAuth(logout);

    const [formData, setFormData] = useState({ audience: 'all', subject: '', testEmail: '' });
    const [sections, setSections] = useState([
        { id: '1', type: SECTION_TYPES.HERO, data: { image: 'https://nayalc.com/GerLift_3_4x5%20copie.jpg', title: 'A New Era of Botanical Radiance', subtitle: 'Discover the science of clinical beauty, perfected in our Geneva labs.', ctaText: 'Shop the Collection', ctaLink: 'https://nayalc.com/collections/new-arrivals' } },
    ]);

    // User selection
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersLoaded, setUsersLoaded] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState(new Set());

    const [loading, setLoading] = useState(false);
    const [testLoading, setTestLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [activePickerId, setActivePickerId] = useState(null);
    const [productSearch, setProductSearch] = useState('');
    const [leftTab, setLeftTab] = useState('blocks');

    // Audience Preview
    const [audienceList, setAudienceList] = useState([]);
    const [showAudienceModal, setShowAudienceModal] = useState(false);
    const [fetchingAudience, setFetchingAudience] = useState(false);

    const audiences = [
        { id: 'all', label: 'All Registered Users', icon: Users, description: 'Send to everyone with an account.' },
        { id: 'selected_users', label: 'Selected Users', icon: UserCheck, description: 'Hand-pick specific recipients.' },
        { id: 'abandoned_cart', label: 'Abandoned Cart', icon: ShoppingCart, description: 'Users with items left in cart.' },
        { id: 'subscribers', label: 'Newsletter Subscribers', icon: Mail, description: 'Users opted into marketing.' },
    ];

    useEffect(() => {
        if (formData.audience === 'selected_users' && !usersLoaded) {
            setUsersLoading(true);
            fetchWithAuth('/api/users')
                .then(res => res.json())
                .then(data => { setUsers(Array.isArray(data) ? data : []); setUsersLoaded(true); })
                .catch(() => setUsers([]))
                .finally(() => setUsersLoading(false));
        }
    }, [formData.audience]);

    const filteredUsers = useMemo(() => {
        const q = userSearch.toLowerCase();
        return users.filter(u =>
            `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q)
        );
    }, [users, userSearch]);

    const toggleUser = (userId) => {
        setSelectedUserIds(prev => {
            const next = new Set(prev);
            next.has(userId) ? next.delete(userId) : next.add(userId);
            return next;
        });
    };

    const fetchAudience = async () => {
        setFetchingAudience(true);
        try {
            const res = await fetchWithAuth(`/api/admin/campaigns/audience?segment=${formData.audience}`);
            const data = await res.json();
            if (res.ok) {
                setAudienceList(data.users);
            }
        } catch (error) {
            console.error('Failed to fetch audience');
        } finally {
            setFetchingAudience(false);
        }
    };

    const toggleAllVisible = () => {
        const ids = filteredUsers.map(u => u.id);
        const allSelected = ids.every(id => selectedUserIds.has(id));
        setSelectedUserIds(prev => {
            const next = new Set(prev);
            ids.forEach(id => allSelected ? next.delete(id) : next.add(id));
            return next;
        });
    };

    const loadTemplate = (template) => {
        if (sections.length > 0 && !window.confirm('This will replace your current content. Continue?')) return;
        setSections(template.defaultSections());
        setLeftTab('blocks');
    };

    const addSection = (type) => {
        const defaults = {
            [SECTION_TYPES.HERO]: { image: '', title: 'Headline Here', subtitle: 'Supporting text here...', ctaText: 'Shop Now', ctaLink: 'https://nayalc.com' },
            [SECTION_TYPES.TEXT]: { content: 'Share your botanical insights here...' },
            [SECTION_TYPES.BUTTON]: { text: 'Shop Now', link: 'https://nayalc.com' },
            [SECTION_TYPES.IMAGE]: { url: '', alt: 'Naya Lumière Image' },
            [SECTION_TYPES.PRODUCT]: { productId: '', name: 'Select a Product', price: '0.00', image: '', brand: '', link: '#' },
            [SECTION_TYPES.PROMO_BANNER]: { headline: 'Exclusive Offer', subline: 'A special message for our valued members', code: 'CODE20', discount: '20% OFF', expiry: 'Limited time only' },
            [SECTION_TYPES.DIVIDER]: {},
        };
        setSections(prev => [...prev, { id: rid(), type, data: defaults[type] || {} }]);
    };

    const updateSection = (id, field, value) =>
        setSections(prev => prev.map(s => s.id === id ? { ...s, data: { ...s.data, [field]: value } } : s));

    const selectProductForSection = (sectionId, product) =>
        setSections(prev => prev.map(s => s.id === sectionId ? {
            ...s,
            data: { productId: product.id, name: product.name, price: product.price, image: product.image, brand: product.brand || 'Naya Lumière', link: `https://nayalc.com/product/${product.id}` }
        } : s));

    const removeSection = (id) => setSections(prev => prev.filter(s => s.id !== id));

    const moveSection = (index, direction) => {
        const next = [...sections];
        const target = index + direction;
        if (target < 0 || target >= next.length) return;
        [next[index], next[target]] = [next[target], next[index]];
        setSections(next);
    };

    const generateHTML = () => {
        let html = '';
        sections.forEach(s => {
            switch (s.type) {
                case SECTION_TYPES.HERO:
                    html += `<div style="margin-bottom:40px;border-radius:20px;overflow:hidden;border:1px solid rgba(216,180,254,0.25);">
    ${s.data.image ? `<img src="${s.data.image}" alt="Hero Banner" style="width:100%;display:block;margin:0;" />` : ''}
    <div style="background:linear-gradient(180deg,#fdf8ff 0%,#f3e8ff 100%);padding:36px 32px;text-align:center;">
        <h2 style="color:#3b0764;font-size:28px;font-weight:900;text-transform:uppercase;letter-spacing:0.04em;margin:0 0 14px;line-height:1.2;">${s.data.title}</h2>
        <p style="color:rgba(59,7,100,0.65);font-size:16px;line-height:1.75;margin:0 auto 28px;max-width:420px;">${s.data.subtitle}</p>
        ${s.data.ctaText ? `<a href="${s.data.ctaLink}" style="display:inline-block;background:linear-gradient(135deg,rgb(196,167,254),rgb(126,105,230));color:#ffffff;padding:15px 38px;text-decoration:none;border-radius:50px;font-size:11px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;box-shadow:0 6px 24px rgba(147,51,234,0.25);">${s.data.ctaText}</a>` : ''}
    </div>
</div>`;
                    break;

                case SECTION_TYPES.PROMO_BANNER:
                    html += `<div style="background:linear-gradient(135deg,#3b0764 0%,#6b21a8 60%,#7e22ce 100%);border-radius:20px;padding:44px 36px;text-align:center;margin-bottom:40px;">
    <p style="color:rgba(216,180,254,0.8);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.25em;margin:0 0 10px;">${s.data.headline}</p>
    <p style="color:rgba(255,255,255,0.92);font-size:19px;font-weight:600;margin:0 0 26px;letter-spacing:-0.01em;">${s.data.subline}</p>
    ${s.data.discount ? `<p style="color:rgba(216,180,254,0.9);font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.2em;margin:0 0 14px;">${s.data.discount}</p>` : ''}
    ${s.data.code ? `<div style="background:rgba(255,255,255,0.12);border:2px dashed rgba(216,180,254,0.5);border-radius:14px;padding:18px 40px;display:inline-block;margin:0 0 20px;"><div style="color:#ffffff;font-size:30px;font-weight:900;letter-spacing:0.14em;font-family:monospace,Courier,sans-serif;">${s.data.code}</div><div style="color:rgba(216,180,254,0.65);font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin-top:6px;">USE AT CHECKOUT</div></div><br>` : ''}
    ${s.data.expiry ? `<p style="color:rgba(216,180,254,0.45);font-size:11px;margin:0;">${s.data.expiry}</p>` : ''}
</div>`;
                    break;

                case SECTION_TYPES.TEXT:
                    html += `<div style="margin-bottom:32px;"><p style="color:rgba(59,7,100,0.7);font-size:15px;line-height:1.85;margin:0;">${s.data.content.replace(/\n/g, '<br />')}</p></div>`;
                    break;

                case SECTION_TYPES.BUTTON:
                    html += `<div style="text-align:center;margin-bottom:36px;"><a href="${s.data.link}" style="display:inline-block;background:linear-gradient(135deg,rgb(196,167,254),rgb(126,105,230));color:#ffffff;padding:16px 42px;text-decoration:none;border-radius:50px;font-size:11px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;box-shadow:0 6px 24px rgba(147,51,234,0.25);">${s.data.text}</a></div>`;
                    break;

                case SECTION_TYPES.IMAGE:
                    html += `<div style="margin-bottom:32px;"><img src="${s.data.url}" alt="${s.data.alt}" style="width:100%;border-radius:16px;display:block;" /></div>`;
                    break;

                case SECTION_TYPES.DIVIDER:
                    html += `<div style="height:1px;background:rgba(216,180,254,0.2);margin:36px 0;"></div>`;
                    break;

                case SECTION_TYPES.PRODUCT:
                    html += `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fdf8ff;border:1px solid rgba(216,180,254,0.3);border-radius:20px;overflow:hidden;margin-bottom:32px;">
    <tr>
        <td width="150" valign="middle" style="padding:24px 0 24px 24px;text-align:center;">
            ${s.data.image ? `<img src="${s.data.image}" alt="${s.data.name}" style="width:120px;height:120px;object-fit:contain;display:block;margin:0 auto;" />` : `<div style="width:120px;height:120px;background:rgba(216,180,254,0.2);border-radius:12px;margin:0 auto;"></div>`}
        </td>
        <td valign="middle" style="padding:28px 28px 28px 16px;">
            <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.15em;color:#9333ea;margin-bottom:7px;">${s.data.brand || 'Naya Lumière'}</div>
            <div style="font-size:19px;font-weight:900;color:#3b0764;margin-bottom:9px;line-height:1.3;">${s.data.name}</div>
            <div style="font-size:17px;font-weight:800;color:#3b0764;margin-bottom:22px;">AED ${parseFloat(s.data.price || 0).toFixed(2)}</div>
            <a href="${s.data.link}" style="display:inline-block;background:linear-gradient(135deg,rgb(196,167,254),rgb(126,105,230));color:#ffffff;padding:11px 26px;text-decoration:none;border-radius:50px;font-size:10px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;">View Product</a>
        </td>
    </tr>
</table>`;
                    break;

                default: break;
            }
        });
        return html;
    };

    const handleSend = async (isTest = false) => {
        if (!formData.subject) { alert('Email subject is required'); return; }
        if (sections.length === 0) { alert('Please add at least one section'); return; }
        if (isTest && !formData.testEmail) { alert('Please provide a test email address'); return; }
        if (formData.audience === 'selected_users' && selectedUserIds.size === 0) { alert('Please select at least one user'); return; }

        const audienceLabel = formData.audience === 'selected_users'
            ? `${selectedUserIds.size} selected user(s)`
            : audiences.find(a => a.id === formData.audience)?.label;

        if (!isTest && !window.confirm(`Launch this campaign to ${audienceLabel}?`)) return;

        const selectedEmails = formData.audience === 'selected_users'
            ? users.filter(u => selectedUserIds.has(u.id)).map(u => u.email)
            : [];

        isTest ? setTestLoading(true) : setLoading(true);
        setStatus(null);

        try {
            const res = await fetchWithAuth('/api/admin/campaigns/send', {
                method: 'POST',
                body: JSON.stringify({ ...formData, content: generateHTML(), isTest, selectedEmails }),
            });
            const data = await res.json();
            if (res.ok) {
                setStatus({ type: 'success', message: data.message });
                if (!isTest) {
                    setSections([]);
                    setFormData(f => ({ ...f, subject: '' }));
                    setSelectedUserIds(new Set());
                }
            } else {
                setStatus({ type: 'error', message: data.message || 'Failed to send campaign' });
            }
        } catch {
            setStatus({ type: 'error', message: 'An unexpected error occurred' });
        } finally {
            isTest ? setTestLoading(false) : setLoading(false);
        }
    };

    const AudienceModal = () => (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
            >
                <div className="p-8 border-b border-purple-50 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div>
                        <h3 className="text-xl font-black text-[#3b0764]">Audience Preview</h3>
                        <p className="text-xs text-gray-400 font-medium">Viewing {audienceList.length} users in segment: <span className="text-purple-600 capitalize">{formData.audience.replace('_', ' ')}</span></p>
                    </div>
                    <button onClick={() => setShowAudienceModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-2">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 pt-0">
                    <div className="divide-y divide-purple-50">
                        {audienceList.map((u) => (
                            <div key={u.id} className="py-4 flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-[#3b0764] font-black text-xs uppercase">
                                        {u.first_name?.[0]}{u.last_name?.[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{u.first_name} {u.last_name}</p>
                                        <p className="text-[11px] text-gray-400 font-medium">{u.email}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-purple-200 uppercase tracking-widest mb-1">Joined</p>
                                    <p className="text-[10px] font-bold text-gray-400">{u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}</p>
                                </div>
                            </div>
                        ))}
                        {audienceList.length === 0 && !fetchingAudience && (
                            <div className="py-20 text-center text-gray-400 font-medium italic">No users found in this segment.</div>
                        )}
                        {fetchingAudience && (
                            <div className="py-20 flex flex-col items-center justify-center gap-4">
                                <Loader2 className="animate-spin text-purple-400" size={32} />
                                <p className="text-xs font-bold text-purple-300 uppercase tracking-widest">Identifying Recipients...</p>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="p-8 bg-purple-50/50 flex justify-end">
                    <Button onClick={() => setShowAudienceModal(false)} className="bg-[#3b0764] hover:bg-[#1e0335] text-white rounded-2xl px-12 py-3 text-xs font-bold transition-all shadow-lg">
                        Close Preview
                    </Button>
                </div>
            </motion.div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            <AnimatePresence>
                {showAudienceModal && <AudienceModal />}
            </AnimatePresence>
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-[#3b0764] flex items-center gap-3">
                    Campaign Studio <Sparkles className="text-[#9333ea]" size={24} />
                </h1>
                <p className="text-sm text-gray-500 mt-1">Design and send professional email campaigns to your customers.</p>
            </div>

            {/* Status */}
            <AnimatePresence>
                {status && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className={`p-4 rounded-2xl flex items-center gap-3 border ${status.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}
                    >
                        {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        <p className="text-sm font-bold flex-1">{status.message}</p>
                        <button onClick={() => setStatus(null)} className="opacity-50 hover:opacity-100"><X size={15} /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* ── LEFT PANEL ── */}
                <div className="lg:col-span-4 space-y-5">

                    {/* Audience */}
                    <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="block text-[10px] font-black text-purple-400 uppercase tracking-widest">Target Audience</label>
                            {formData.audience !== 'selected_users' && (
                                <button 
                                    onClick={() => {
                                        fetchAudience();
                                        setShowAudienceModal(true);
                                    }}
                                    className="text-[9px] font-black text-[#9333ea] bg-purple-50 px-2 py-1 rounded-lg uppercase tracking-widest hover:bg-purple-100 transition-colors flex items-center gap-1.5"
                                >
                                    {fetchingAudience ? <Loader2 size={10} className="animate-spin" /> : <Eye size={10} />}
                                    Preview Recipients
                                </button>
                            )}
                        </div>
                        <div className="space-y-2">
                            {audiences.map(aud => (
                                <button key={aud.id} onClick={() => setFormData(f => ({ ...f, audience: aud.id }))}
                                    className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${formData.audience === aud.id ? 'border-[#9333ea] bg-purple-50 ring-2 ring-purple-100' : 'border-gray-100 hover:border-purple-200 bg-white'}`}
                                >
                                    <aud.icon size={16} className={formData.audience === aud.id ? 'text-[#9333ea]' : 'text-gray-400'} />
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-black truncate ${formData.audience === aud.id ? 'text-[#3b0764]' : 'text-gray-500'}`}>{aud.label}</p>
                                        <p className="text-[9px] text-gray-400 font-medium">{aud.description}</p>
                                    </div>
                                    {aud.id === 'selected_users' && selectedUserIds.size > 0 && (
                                        <span className="text-[9px] font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{selectedUserIds.size}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* User Picker */}
                    <AnimatePresence>
                        {formData.audience === 'selected_users' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-white rounded-3xl border border-purple-100 shadow-sm overflow-hidden">
                                    <div className="p-4 border-b border-purple-50 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Select Recipients</label>
                                            <span className="text-[9px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{selectedUserIds.size} selected</span>
                                        </div>
                                        <div className="relative">
                                            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300" />
                                            <input type="text" placeholder="Search name or email..."
                                                value={userSearch} onChange={e => setUserSearch(e.target.value)}
                                                className="w-full pl-8 pr-4 py-2 bg-purple-50/50 border border-purple-100 rounded-xl text-xs outline-none focus:border-purple-300"
                                            />
                                        </div>
                                        {filteredUsers.length > 0 && (
                                            <button onClick={toggleAllVisible} className="text-[10px] font-bold text-purple-500 hover:text-purple-700 transition-colors">
                                                {filteredUsers.every(u => selectedUserIds.has(u.id)) ? 'Deselect all visible' : 'Select all visible'}
                                            </button>
                                        )}
                                    </div>

                                    <div className="max-h-60 overflow-y-auto divide-y divide-purple-50/60">
                                        {usersLoading ? (
                                            <div className="p-8 flex justify-center"><Loader2 size={20} className="animate-spin text-purple-200" /></div>
                                        ) : filteredUsers.length === 0 ? (
                                            <div className="p-6 text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                                                {userSearch ? 'No users found' : 'No users available'}
                                            </div>
                                        ) : filteredUsers.map(user => (
                                            <button key={user.id} onClick={() => toggleUser(user.id)}
                                                className={`w-full p-3 flex items-center gap-3 hover:bg-purple-50/40 transition-colors text-left ${selectedUserIds.has(user.id) ? 'bg-purple-50/25' : ''}`}
                                            >
                                                <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${selectedUserIds.has(user.id) ? 'bg-[#9333ea] border-[#9333ea]' : 'border-purple-200'}`}>
                                                    {selectedUserIds.has(user.id) && <Check size={9} className="text-white" strokeWidth={3} />}
                                                </div>
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-100 to-violet-200 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-[9px] font-black text-purple-700">{user.first_name?.[0]}{user.last_name?.[0]}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[11px] font-bold text-[#3b0764] truncate">{user.first_name} {user.last_name}</p>
                                                    <p className="text-[9px] text-purple-300 truncate">{user.email}</p>
                                                </div>
                                                {user.loyalty_tier && (
                                                    <span className="text-[8px] font-black uppercase flex-shrink-0" style={{ color: TIER_COLORS[user.loyalty_tier] || '#9333ea' }}>
                                                        {user.loyalty_tier}
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Subject */}
                    <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm">
                        <label className="block text-[10px] font-black text-purple-400 uppercase tracking-widest mb-3">Email Subject</label>
                        <input type="text" value={formData.subject} onChange={e => setFormData(f => ({ ...f, subject: e.target.value }))}
                            placeholder="Enter a captivating subject..."
                            className="w-full px-4 py-3 bg-purple-50/50 border border-purple-100 rounded-xl focus:outline-none focus:border-purple-400 font-bold text-gray-900 text-sm transition-all"
                        />
                    </div>

                    {/* Blocks / Templates tabs */}
                    <div className="bg-[#3b0764] rounded-3xl overflow-hidden shadow-xl">
                        <div className="flex border-b border-white/10">
                            {[{ id: 'blocks', icon: Layers, label: 'Blocks' }, { id: 'templates', icon: LayoutTemplate, label: 'Templates' }].map(tab => (
                                <button key={tab.id} onClick={() => setLeftTab(tab.id)}
                                    className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${leftTab === tab.id ? 'bg-white/10 text-white' : 'text-white/35 hover:text-white/60'}`}
                                >
                                    <tab.icon size={13} /> {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Blocks tab */}
                        {leftTab === 'blocks' && (
                            <div className="p-5 grid grid-cols-2 gap-2.5">
                                {[
                                    { type: SECTION_TYPES.HERO, icon: Layout, label: 'Hero Banner' },
                                    { type: SECTION_TYPES.PRODUCT, icon: Package, label: 'Product Card' },
                                    { type: SECTION_TYPES.PROMO_BANNER, icon: Percent, label: 'Promo Banner' },
                                    { type: SECTION_TYPES.TEXT, icon: Type, label: 'Text Block' },
                                    { type: SECTION_TYPES.BUTTON, icon: MousePointer2, label: 'CTA Button' },
                                    { type: SECTION_TYPES.IMAGE, icon: ImageIcon, label: 'Image' },
                                ].map(({ type, icon: Icon, label }) => (
                                    <button key={type} onClick={() => addSection(type)}
                                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10 group"
                                    >
                                        <Icon size={17} className="group-hover:scale-110 transition-transform" />
                                        <span className="text-[9px] font-bold text-center">{label}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Templates tab */}
                        {leftTab === 'templates' && (
                            <div className="p-5 space-y-2.5">
                                {TEMPLATES.map(tpl => {
                                    const Icon = tpl.icon;
                                    return (
                                        <button key={tpl.id} onClick={() => loadTemplate(tpl)}
                                            className="w-full p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-left border border-white/10 flex items-center gap-4 group transition-all"
                                        >
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                                style={{ background: tpl.color + '28', border: `1px solid ${tpl.color}45` }}>
                                                <Icon size={16} style={{ color: tpl.color }} className="group-hover:scale-110 transition-transform" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-white">{tpl.name}</p>
                                                <p className="text-[9px] text-white/40 mt-0.5">{tpl.description}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── RIGHT: Visual Editor ── */}
                <div className="lg:col-span-8">
                    <div className="bg-gray-50 rounded-[3rem] p-1 border-4 border-white shadow-inner min-h-[600px] flex flex-col">
                        <div className="bg-white rounded-[2.5rem] flex-1 overflow-hidden flex flex-col">
                            {/* Email chrome header */}
                            <div className="p-6 border-b border-gray-50 text-center bg-white">
                                <p className="text-[9px] font-black text-purple-200 uppercase tracking-[0.3em] mb-1">Email Preview</p>
                                <p className="text-xs font-black text-[#3b0764]">NAYA LUMIÈRE COSMETICS</p>
                            </div>

                            {/* Canvas */}
                            <div className="flex-1 p-8 overflow-y-auto max-h-[800px] no-scrollbar space-y-8">
                                {sections.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-4 py-24">
                                        <Layers size={44} strokeWidth={1} />
                                        <p className="text-sm italic">Your canvas is waiting. Pick a template or add a block.</p>
                                    </div>
                                ) : (
                                    <AnimatePresence>
                                        {sections.map((section, idx) => (
                                            <motion.div key={section.id}
                                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                                className="relative group border-2 border-transparent hover:border-purple-200 rounded-3xl p-4 -m-4 transition-all"
                                            >
                                                {/* Section controls */}
                                                <div className="absolute -right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex flex-col gap-1.5 z-20 transition-all">
                                                    <button onClick={() => moveSection(idx, -1)} className="p-1.5 bg-white shadow-lg rounded-full text-gray-400 hover:text-purple-600 border border-gray-100"><MoveUp size={12} /></button>
                                                    <button onClick={() => moveSection(idx, 1)} className="p-1.5 bg-white shadow-lg rounded-full text-gray-400 hover:text-purple-600 border border-gray-100"><MoveDown size={12} /></button>
                                                    <button onClick={() => removeSection(section.id)} className="p-1.5 bg-white shadow-lg rounded-full text-red-400 hover:bg-red-50 border border-red-50"><X size={12} /></button>
                                                </div>

                                                {/* ── HERO ── */}
                                                {section.type === SECTION_TYPES.HERO && (
                                                    <div className="text-center space-y-4">
                                                        <div className="relative group/img overflow-hidden rounded-2xl bg-purple-50 aspect-[16/9]">
                                                            {section.data.image
                                                                ? <img src={section.data.image} alt="Hero" className="w-full h-full object-cover" />
                                                                : <div className="w-full h-full flex flex-col items-center justify-center text-purple-300 gap-2"><ImageIcon size={26} /><span className="text-[9px] font-bold">HOVER TO SET IMAGE URL</span></div>
                                                            }
                                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all">
                                                                <input type="text" placeholder="Paste image URL..." className="w-2/3 px-4 py-2 rounded-lg bg-white text-xs font-medium shadow"
                                                                    value={section.data.image} onChange={e => updateSection(section.id, 'image', e.target.value)} />
                                                            </div>
                                                        </div>
                                                        <input type="text" className="w-full text-2xl font-black text-[#3b0764] text-center bg-transparent border-b border-transparent focus:border-purple-200 outline-none"
                                                            value={section.data.title} onChange={e => updateSection(section.id, 'title', e.target.value)} />
                                                        <textarea className="w-full text-sm text-gray-500 text-center bg-transparent border-b border-transparent focus:border-purple-200 outline-none resize-none"
                                                            rows={2} value={section.data.subtitle} onChange={e => updateSection(section.id, 'subtitle', e.target.value)} />
                                                        <div className="flex justify-center gap-3 flex-wrap">
                                                            <input placeholder="Button label" className="px-4 py-2 bg-[#9333ea] text-white text-[10px] font-black uppercase rounded-full w-36 text-center outline-none"
                                                                value={section.data.ctaText} onChange={e => updateSection(section.id, 'ctaText', e.target.value)} />
                                                            <input placeholder="Link URL" className="px-4 py-2 bg-purple-50 text-purple-400 text-[10px] font-bold rounded-full flex-1 text-center outline-none"
                                                                value={section.data.ctaLink} onChange={e => updateSection(section.id, 'ctaLink', e.target.value)} />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* ── PROMO BANNER ── */}
                                                {section.type === SECTION_TYPES.PROMO_BANNER && (
                                                    <div className="bg-gradient-to-br from-[#3b0764] to-[#6b21a8] rounded-3xl p-8 text-center space-y-3">
                                                        <input className="w-full bg-transparent text-[10px] font-black text-purple-300 uppercase tracking-widest text-center outline-none border-b border-white/10 pb-1 placeholder:text-purple-600"
                                                            placeholder="HEADLINE" value={section.data.headline} onChange={e => updateSection(section.id, 'headline', e.target.value)} />
                                                        <input className="w-full bg-transparent text-base font-semibold text-white/90 text-center outline-none border-b border-white/10 pb-1 placeholder:text-white/30"
                                                            placeholder="Sub-headline..." value={section.data.subline} onChange={e => updateSection(section.id, 'subline', e.target.value)} />
                                                        <input className="w-full bg-transparent text-xs font-black text-purple-300 uppercase tracking-wider text-center outline-none border-b border-white/10 pb-1 placeholder:text-purple-700"
                                                            placeholder="DISCOUNT LABEL e.g. 20% OFF" value={section.data.discount} onChange={e => updateSection(section.id, 'discount', e.target.value)} />
                                                        <div className="bg-white/10 border-2 border-dashed border-white/30 rounded-2xl px-6 py-4">
                                                            <input className="w-full bg-transparent text-2xl font-black text-white tracking-widest text-center outline-none font-mono placeholder:text-white/20"
                                                                placeholder="COUPONCODE" value={section.data.code} onChange={e => updateSection(section.id, 'code', e.target.value)} />
                                                            <p className="text-[9px] text-purple-400 mt-1 uppercase tracking-widest">Coupon code</p>
                                                        </div>
                                                        <input className="w-full bg-transparent text-[10px] text-purple-500 text-center outline-none border-b border-white/10 pb-1 placeholder:text-purple-700"
                                                            placeholder="Expiry / terms — e.g. Valid 48 hours only" value={section.data.expiry} onChange={e => updateSection(section.id, 'expiry', e.target.value)} />
                                                    </div>
                                                )}

                                                {/* ── PRODUCT ── */}
                                                {section.type === SECTION_TYPES.PRODUCT && (
                                                    <div className="bg-[#fdf8ff] border border-purple-100 rounded-3xl p-5">
                                                        <div className="flex gap-4 items-center">
                                                            <div className="w-20 h-20 bg-white rounded-2xl border border-purple-50 flex items-center justify-center p-1.5 flex-shrink-0">
                                                                {section.data.image ? <img src={section.data.image} alt="Product" className="max-h-full max-w-full object-contain" /> : <Package className="text-purple-100" size={24} />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[9px] font-black text-[#9333ea] uppercase tracking-widest mb-0.5">{section.data.brand || 'Naya Lumière'}</p>
                                                                <h3 className="text-base font-black text-[#3b0764] truncate">{section.data.name}</h3>
                                                                <p className="text-sm font-bold text-[#3b0764] mt-0.5">AED {parseFloat(section.data.price || 0).toFixed(2)}</p>
                                                            </div>
                                                            <div className="relative flex-shrink-0">
                                                                <button onClick={() => setActivePickerId(activePickerId === section.id ? null : section.id)}
                                                                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-purple-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-[#3b0764] shadow-sm hover:shadow-md transition-all"
                                                                >
                                                                    <Search size={11} /> {activePickerId === section.id ? 'Close' : 'Change'}
                                                                </button>
                                                                <AnimatePresence>
                                                                    {activePickerId === section.id && (
                                                                        <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                                                            className="absolute right-0 top-full mt-2 w-72 max-h-72 bg-white border border-purple-100 rounded-2xl shadow-[0_20px_50px_rgba(59,7,100,0.15)] z-[9999] overflow-hidden flex flex-col"
                                                                        >
                                                                            <div className="p-3 bg-white border-b border-purple-50">
                                                                                <input autoFocus placeholder="Search products..."
                                                                                    className="w-full px-3 py-2 bg-purple-50/50 rounded-lg text-xs outline-none focus:ring-1 ring-purple-200"
                                                                                    value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                                                                            </div>
                                                                            <div className="flex-1 overflow-y-auto no-scrollbar p-1">
                                                                                {adminProducts?.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                                                                                    <button key={p.id}
                                                                                        onClick={() => { selectProductForSection(section.id, p); setActivePickerId(null); setProductSearch(''); }}
                                                                                        className="w-full p-2 hover:bg-purple-50 rounded-xl flex items-center gap-3 transition-colors text-left"
                                                                                    >
                                                                                        <div className="w-9 h-9 bg-white rounded-lg border border-purple-50 p-1 flex-shrink-0">
                                                                                            <img src={p.image} className="w-full h-full object-contain" alt={p.name} />
                                                                                        </div>
                                                                                        <div className="min-w-0">
                                                                                            <p className="text-[11px] font-bold text-gray-900 truncate">{p.name}</p>
                                                                                            <p className="text-[9px] text-purple-400 font-black">AED {p.price}</p>
                                                                                        </div>
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* ── TEXT ── */}
                                                {section.type === SECTION_TYPES.TEXT && (
                                                    <textarea className="w-full p-4 text-sm text-[#3b0764] leading-relaxed bg-transparent border-b-2 border-dashed border-purple-100 focus:border-purple-400 outline-none min-h-[100px]"
                                                        placeholder="Compose your message..."
                                                        value={section.data.content} onChange={e => updateSection(section.id, 'content', e.target.value)} />
                                                )}

                                                {/* ── BUTTON ── */}
                                                {section.type === SECTION_TYPES.BUTTON && (
                                                    <div className="flex flex-col items-center gap-3 p-6 bg-purple-50/30 rounded-3xl border border-purple-50">
                                                        <input className="px-6 py-2.5 bg-gradient-to-r from-[rgb(196,167,254)] to-[rgb(126,105,230)] text-white text-[10px] font-black uppercase rounded-full text-center outline-none"
                                                            value={section.data.text} onChange={e => updateSection(section.id, 'text', e.target.value)} />
                                                        <input placeholder="Paste link URL..." className="text-[10px] text-purple-400 bg-transparent text-center outline-none font-bold w-full"
                                                            value={section.data.link} onChange={e => updateSection(section.id, 'link', e.target.value)} />
                                                    </div>
                                                )}

                                                {/* ── IMAGE ── */}
                                                {section.type === SECTION_TYPES.IMAGE && (
                                                    <div className="space-y-3">
                                                        <input type="text" placeholder="Paste image URL..."
                                                            className="w-full p-3 bg-purple-50/50 rounded-xl text-xs border border-purple-100 outline-none focus:border-purple-300"
                                                            value={section.data.url} onChange={e => updateSection(section.id, 'url', e.target.value)} />
                                                        {section.data.url && <img src={section.data.url} className="w-full rounded-2xl" alt="Preview" />}
                                                    </div>
                                                )}

                                                {/* ── DIVIDER ── */}
                                                {section.type === SECTION_TYPES.DIVIDER && (
                                                    <div className="py-4 flex items-center gap-3">
                                                        <div className="flex-1 h-px bg-purple-100"></div>
                                                        <div className="w-2 h-2 rounded-full bg-purple-200"></div>
                                                        <div className="flex-1 h-px bg-purple-100"></div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                )}
                            </div>

                            {/* Action Footer */}
                            <div className="p-6 bg-purple-50/40 border-t border-purple-100 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-2 w-full md:w-auto">
                                    <input type="email" value={formData.testEmail} onChange={e => setFormData(f => ({ ...f, testEmail: e.target.value }))}
                                        placeholder="Send test to..."
                                        className="px-4 py-2.5 bg-white border border-purple-100 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-300 w-full md:w-52"
                                    />
                                    <Button onClick={() => handleSend(true)} disabled={testLoading || !formData.testEmail}
                                        variant="outline" className="border-[#9333ea] text-[#9333ea] hover:bg-white rounded-xl whitespace-nowrap px-4 py-2.5"
                                    >
                                        {testLoading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} className="mr-1.5" />}
                                        Test
                                    </Button>
                                </div>
                                <Button onClick={() => handleSend(false)}
                                    disabled={loading || !formData.subject || sections.length === 0 || (formData.audience === 'selected_users' && selectedUserIds.size === 0)}
                                    className="bg-[#3b0764] hover:bg-[#1e0335] text-white rounded-2xl px-10 py-5 text-xs font-black uppercase tracking-widest shadow-xl transition-all w-full md:w-auto group"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : (
                                        <>Launch Campaign <Send size={15} className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketingPage;
