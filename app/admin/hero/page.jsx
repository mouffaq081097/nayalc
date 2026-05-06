'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Loader2, MoreHorizontal, Image as ImageIcon, Edit, Eye, EyeOff, Film, ArrowUp, ArrowDown, Save, X } from 'lucide-react';
import PageLoader from '@/app/components/PageLoader';
import Modal from '../../components/Modal';
import { Button } from '@/app/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const ManageHeroSlides = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    eyebrow: '',
    headline: '',
    body: '',
    cta_text: '',
    cta_href: '',
    image_position: 'object-center',
    text_position: 'left',
    cta_style: 'lavender-cloud',
    scrim_direction: 'none',
    text_theme: 'light',
    sort_order: 0,
    is_active: true
  });

  const [mobileMedia, setMobileMedia] = useState(null);
  const [desktopMedia, setDesktopMedia] = useState(null);
  const [mobilePreview, setMobilePreview] = useState(null);
  const [desktopPreview, setDesktopPreview] = useState(null);

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const res = await fetch('/api/hero-slides');
      const data = await res.json();
      setSlides(data);
    } catch (err) {
      console.error('Failed to fetch slides', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingSlide(null);
    setFormData({
      eyebrow: '',
      headline: '',
      body: '',
      cta_text: '',
      cta_href: '',
      image_position: 'object-center',
      text_position: 'left',
      cta_style: 'lavender-cloud',
      scrim_direction: 'none',
      text_theme: 'light',
      sort_order: slides.length,
      is_active: true
    });
    setMobileMedia(null);
    setDesktopMedia(null);
    setMobilePreview(null);
    setDesktopPreview(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (slide) => {
    setEditingSlide(slide);
    setFormData({
      eyebrow: slide.eyebrow || '',
      headline: slide.headline || '',
      body: slide.body || '',
      cta_text: slide.cta_text || '',
      cta_href: slide.cta_href || '',
      image_position: slide.image_position || 'object-center',
      text_position: slide.text_position || 'left',
      cta_style: slide.cta_style || 'lavender-cloud',
      scrim_direction: slide.scrim_direction || 'none',
      text_theme: slide.text_theme || 'light',
      sort_order: slide.sort_order || 0,
      is_active: slide.is_active
    });
    setMobileMedia(null);
    setDesktopMedia(null);
    setMobilePreview(slide.image_src_mobile);
    setDesktopPreview(slide.image_src_desktop);
    setIsModalOpen(true);
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === 'mobile') {
      setMobileMedia(file);
      setMobilePreview(URL.createObjectURL(file));
    } else {
      setDesktopMedia(file);
      setDesktopPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const form = new FormData();
      Object.keys(formData).forEach(key => {
        form.append(key, formData[key]);
      });

      if (mobileMedia) form.append('mobileMedia', mobileMedia);
      if (desktopMedia) form.append('desktopMedia', desktopMedia);

      const url = editingSlide ? `/api/hero-slides/${editingSlide.id}` : '/api/hero-slides';
      const method = editingSlide ? 'PUT' : 'POST';

      const res = await fetch(url, { method, body: form });
      if (res.ok) {
        fetchSlides();
        setIsModalOpen(false);
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to save slide');
      }
    } catch (err) {
      console.error('Error saving slide', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this slide?')) return;
    try {
      await fetch(`/api/hero-slides/${id}`, { method: 'DELETE' });
      fetchSlides();
    } catch (err) {
      console.error('Failed to delete slide', err);
    }
  };

  const toggleStatus = async (slide) => {
    try {
      const form = new FormData();
      form.append('is_active', !slide.is_active);
      // Keep other essential fields for update
      form.append('headline', slide.headline);
      
      await fetch(`/api/hero-slides/${slide.id}`, { method: 'PUT', body: form });
      fetchSlides();
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hero Banner Management</h1>
          <p className="text-sm text-gray-500">Curate the first impression of your sanctuary.</p>
        </div>
        <Button onClick={handleOpenAddModal} className="bg-gray-900 hover:bg-cl-purple text-white rounded-xl px-6 py-6 text-[11px] font-black shadow-lg">
          <Plus className="mr-2 h-4 w-4" /> Add New Sequence
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {slides.map((slide, index) => (
          <div key={slide.id} className={`group relative bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col ${!slide.is_active ? 'opacity-60' : ''}`}>
            <div className="relative aspect-video w-full overflow-hidden bg-gray-900">
              {slide.is_video_desktop ? (
                <video src={slide.image_src_desktop} className="w-full h-full object-cover" muted loop autoPlay playsInline />
              ) : (
                <Image src={slide.image_src_desktop} alt={slide.headline} fill className="object-cover" />
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <div className="flex gap-2">
                    <button onClick={() => handleOpenEditModal(slide)} className="p-3 bg-white rounded-full text-gray-900 hover:bg-cl-purple hover:text-white transition-all">
                        <Edit size={20} />
                    </button>
                    <button onClick={() => handleDelete(slide.id)} className="p-3 bg-white rounded-full text-red-600 hover:bg-red-600 hover:text-white transition-all">
                        <Trash2 size={20} />
                    </button>
                 </div>
              </div>
              <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest">
                Slide #{index + 1}
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 truncate">{slide.headline}</h3>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">{slide.eyebrow || 'No Eyebrow'}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2">
                    {slide.is_video_desktop || slide.is_video_mobile ? <Film size={14} className="text-cl-purple" /> : <ImageIcon size={14} className="text-cl-purple" />}
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {slide.is_video_desktop ? 'Video Sequence' : 'Still Portrait'}
                    </span>
                </div>
                <button 
                    onClick={() => toggleStatus(slide)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all ${slide.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                >
                    {slide.is_active ? <><Eye size={12} /> Active</> : <><EyeOff size={12} /> Hidden</>}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSlide ? 'Edit Cinematic Sequence' : 'Create New Sequence'} size="max-w-5xl">
        <form onSubmit={handleSubmit} className="p-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Left: Text Content */}
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-cl-purple uppercase tracking-widest flex items-center gap-2">
                <span className="w-8 h-px bg-cl-purple/20"></span> Content Architecture
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Eyebrow (Overline)</label>
                  <input 
                    type="text" value={formData.eyebrow} onChange={e => setFormData({...formData, eyebrow: e.target.value})}
                    placeholder="e.g., GERNÉTIC INTERNATIONAL"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Headline (Main Title)</label>
                  <textarea 
                    value={formData.headline} onChange={e => setFormData({...formData, headline: e.target.value})}
                    placeholder="The Art of Skin Science"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white transition-all min-h-[80px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Body (Description)</label>
                  <textarea 
                    value={formData.body} onChange={e => setFormData({...formData, body: e.target.value})}
                    placeholder="Biological cellular treatments crafted in France..."
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white transition-all min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">CTA Text</label>
                        <input 
                            type="text" value={formData.cta_text} onChange={e => setFormData({...formData, cta_text: e.target.value})}
                            placeholder="Shop Collection"
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">CTA Link</label>
                        <input 
                            type="text" value={formData.cta_href} onChange={e => setFormData({...formData, cta_href: e.target.value})}
                            placeholder="/all-products"
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold"
                        />
                    </div>
                </div>
              </div>
            </div>

            {/* Right: Media & Design */}
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-cl-purple uppercase tracking-widest flex items-center gap-2">
                <span className="w-8 h-px bg-cl-purple/20"></span> Visual Composition
              </h3>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Desktop Media (Video/Image)</label>
                  <div className="relative group aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden transition-all hover:bg-gray-100">
                    {desktopPreview ? (
                      desktopPreview.includes('video') || desktopPreview.endsWith('.mp4') || desktopPreview.endsWith('.mov') || (desktopMedia && desktopMedia.type.includes('video')) ? (
                        <video src={desktopPreview} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                      ) : (
                        <Image src={desktopPreview} alt="Desktop Preview" fill className="object-cover" />
                      )
                    ) : (
                      <div className="text-gray-300 flex flex-col items-center gap-2">
                        <Film size={32} />
                        <span className="text-[10px] font-black">Drop Desktop Media</span>
                      </div>
                    )}
                    <input type="file" onChange={e => handleFileChange(e, 'desktop')} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,video/*" />
                    {desktopPreview && (
                        <button type="button" onClick={() => { setDesktopMedia(null); setDesktopPreview(null); }} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black transition-colors">
                            <X size={14} />
                        </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Mobile Media (Video/Image)</label>
                  <div className="relative group aspect-[9/16] max-h-[200px] w-auto mx-auto bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden transition-all hover:bg-gray-100">
                    {mobilePreview ? (
                      mobilePreview.includes('video') || mobilePreview.endsWith('.mp4') || mobilePreview.endsWith('.mov') || (mobileMedia && mobileMedia.type.includes('video')) ? (
                        <video src={mobilePreview} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                      ) : (
                        <Image src={mobilePreview} alt="Mobile Preview" fill className="object-cover" />
                      )
                    ) : (
                      <div className="text-gray-300 flex flex-col items-center gap-2">
                        <Film size={32} />
                        <span className="text-[10px] font-black">Drop Mobile Media</span>
                      </div>
                    )}
                    <input type="file" onChange={e => handleFileChange(e, 'mobile')} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,video/*" />
                    {mobilePreview && (
                        <button type="button" onClick={() => { setMobileMedia(null); setMobilePreview(null); }} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black transition-colors">
                            <X size={14} />
                        </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Text Theme</label>
                  <select 
                    value={formData.text_theme} onChange={e => setFormData({...formData, text_theme: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold"
                  >
                    <option value="light">Light (White)</option>
                    <option value="dark">Dark (Charcoal)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase mb-2">Text Position</label>
                  <select 
                    value={formData.text_position} onChange={e => setFormData({...formData, text_position: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold"
                  >
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                    <option value="center">Center</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-8 border-t border-gray-50">
             <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 text-[10px] font-black text-gray-400 hover:text-gray-900 transition-colors">
                Cancel
             </button>
             <Button type="submit" disabled={isSubmitting} className="px-10 py-6 bg-cl-purple hover:bg-gray-900 text-white rounded-xl text-[11px] font-black shadow-xl">
                {isSubmitting ? <Loader2 className="animate-spin" /> : editingSlide ? 'Update Sequence' : 'Create Sequence'}
             </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageHeroSlides;
