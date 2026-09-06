'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Search, Edit, Trash2, PlusCircle, Loader2, MoreHorizontal, BookOpen, Eye, EyeOff, UploadCloud, Clock } from 'lucide-react';
import Modal from '@/app/components/Modal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Label } from '@/app/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { compressImageFile } from '@/lib/compressImage';

const EMPTY_ARTICLE = {
  id: null,
  slug: '',
  title: '',
  tag: '',
  readTime: '',
  excerpt: '',
  body: '',
  coverImageUrl: '',
  ctaLabel: '',
  ctaHref: '',
  isActive: true,
  sortOrder: 0,
};

export default function JournalAdminPage() {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [current, setCurrent] = useState(EMPTY_ARTICLE);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef(null);

  const fetchArticles = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/journal');
      if (!res.ok) throw new Error('Failed to fetch journal articles');
      setArticles(await res.json());
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrent((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImagePick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    // Cloudinary's account plan hard-caps uploads at 10MB regardless of our
    // own server limits — phone photos routinely exceed that, so shrink
    // large ones automatically instead of just rejecting them.
    setIsCompressing(true);
    try {
      const processed = await compressImageFile(file);
      if (processed.size > 9.5 * 1024 * 1024) {
        toast.error('That image is too large even after compression. Please choose a smaller file.');
        return;
      }
      setImageFile(processed);
      setImagePreview(URL.createObjectURL(processed));
    } finally {
      setIsCompressing(false);
    }
  };

  const resetForm = () => {
    setEditMode(false);
    setCurrent(EMPTY_ARTICLE);
    setImageFile(null);
    setImagePreview(null);
    setIsModalOpen(false);
  };

  const openCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEdit = (article) => {
    setEditMode(true);
    setCurrent({
      id: article.id,
      slug: article.slug,
      title: article.title,
      tag: article.tag || '',
      readTime: article.readTime || '',
      excerpt: article.excerpt || '',
      body: Array.isArray(article.body) ? article.body.join('\n\n') : article.body || '',
      coverImageUrl: article.coverImageUrl || '',
      ctaLabel: article.ctaLabel || '',
      ctaHref: article.ctaHref || '',
      isActive: article.isActive,
      sortOrder: article.sortOrder || 0,
    });
    setImageFile(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('slug', current.slug);
      formData.append('title', current.title);
      formData.append('tag', current.tag);
      formData.append('readTime', current.readTime);
      formData.append('excerpt', current.excerpt);
      formData.append('body', current.body);
      formData.append('coverImageUrl', current.coverImageUrl);
      formData.append('ctaLabel', current.ctaLabel);
      formData.append('ctaHref', current.ctaHref);
      formData.append('sortOrder', String(current.sortOrder));
      formData.append('isActive', String(current.isActive));
      if (imageFile) formData.append('image', imageFile);

      const url = editMode ? `/api/admin/journal/${current.id}` : '/api/admin/journal';
      const method = editMode ? 'PUT' : 'POST';
      const res = await fetch(url, { method, body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Failed to ${editMode ? 'update' : 'create'} article`);
      }

      toast.success(editMode ? 'Article updated' : 'Article published');
      await fetchArticles();
      resetForm();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (article) => {
    if (!window.confirm(`Delete "${article.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/journal/${article.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete article');
      toast.success('Article deleted');
      await fetchArticles();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleToggleActive = async (article) => {
    try {
      const formData = new FormData();
      formData.append('slug', article.slug);
      formData.append('title', article.title);
      formData.append('tag', article.tag || '');
      formData.append('readTime', article.readTime || '');
      formData.append('excerpt', article.excerpt || '');
      formData.append('body', Array.isArray(article.body) ? article.body.join('\n\n') : article.body || '');
      formData.append('coverImageUrl', article.coverImageUrl || '');
      formData.append('ctaLabel', article.ctaLabel || '');
      formData.append('ctaHref', article.ctaHref || '');
      formData.append('sortOrder', String(article.sortOrder || 0));
      formData.append('isActive', String(!article.isActive));

      const res = await fetch(`/api/admin/journal/${article.id}`, { method: 'PUT', body: formData });
      if (!res.ok) throw new Error('Failed to update status');
      await fetchArticles();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filtered = articles.filter(
    (a) => a.title.toLowerCase().includes(searchTerm.toLowerCase()) || (a.tag || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-gray-400">Loading journal articles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#1a1a1a' }}>Journal</h2>
          <p className="text-sm text-gray-400 mt-0.5">{articles.length} article{articles.length !== 1 ? 's' : ''} total</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-grow sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={15} />
            <input
              type="text"
              placeholder="Search by title or tag..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-purple-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={openCreate} className="cl-gradient-btn gap-2 px-5 py-2.5 text-[11px] active:scale-[0.98] whitespace-nowrap">
            <PlusCircle size={15} /> Add article
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence>
          {filtered.map((article) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`group relative bg-white rounded-2xl border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col ${!article.isActive ? 'opacity-60 grayscale-[0.4]' : ''}`}
              style={{ borderColor: '#e3e3e3' }}
            >
              <div className="relative aspect-[16/9] bg-purple-50/40">
                {article.coverImageUrl ? (
                  <Image src={article.coverImageUrl} alt={article.title} fill sizes="360px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen size={28} className="text-purple-200" />
                  </div>
                )}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${article.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-[10px] font-semibold text-white bg-black/40 rounded-full px-2 py-0.5">
                    {article.isActive ? 'Published' : 'Hidden'}
                  </span>
                </div>
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-9 h-9 rounded-xl bg-white/90 hover:bg-white flex items-center justify-center transition-all">
                        <MoreHorizontal className="h-5 w-5 text-gray-500" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl shadow-2xl border-gray-100 p-2">
                      <DropdownMenuItem onClick={() => openEdit(article)} className="rounded-lg px-4 py-3 text-sm font-medium gap-3">
                        <Edit size={16} className="text-purple-600" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(article)} className="rounded-lg px-4 py-3 text-sm font-medium gap-3">
                        {article.isActive ? (
                          <><EyeOff size={16} className="text-orange-500" /> Hide</>
                        ) : (
                          <><Eye size={16} className="text-green-500" /> Publish</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(article)} className="rounded-lg px-4 py-3 text-sm font-medium gap-3 text-red-600">
                        <Trash2 size={16} /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="p-5 space-y-2 flex-grow">
                {article.tag && (
                  <span className="inline-block text-[10px] font-semibold uppercase tracking-[0.1em] px-2 py-1 rounded-full bg-purple-50 text-purple-600">
                    {article.tag}
                  </span>
                )}
                <h3 className="text-[15px] font-bold text-gray-900 leading-snug line-clamp-2">{article.title}</h3>
                <p className="text-[12.5px] text-gray-400 line-clamp-2">{article.excerpt}</p>
                {article.readTime && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                    <Clock size={11} /> {article.readTime}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="min-h-[280px] bg-white rounded-2xl border border-dashed border-purple-100 flex flex-col items-center justify-center gap-3">
          <BookOpen size={36} className="text-purple-200" />
          <p className="text-sm font-medium text-gray-400">{searchTerm ? 'No articles match your search.' : 'No journal articles yet.'}</p>
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal isOpen={isModalOpen} onClose={resetForm} title={editMode ? 'Edit article' : 'Add article'} size="max-w-4xl" noBodyPadding>
        <form onSubmit={handleSubmit} className="p-6 lg:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: content */}
            <section className="space-y-5">
              <h3 className="text-xs font-semibold text-purple-600 flex items-center gap-3">
                <span className="w-8 h-px bg-purple-200"></span>
                Content
              </h3>

              <div>
                <label htmlFor="title" className="block text-xs font-medium text-purple-400 mb-2">Title</label>
                <input
                  id="title" name="title" value={current.title} onChange={handleChange}
                  placeholder="e.g., The Science of Cellular Renewal"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-semibold text-gray-900 focus:bg-white focus:border-purple-300 focus:outline-none transition-all"
                  required disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-xs font-medium text-purple-400 mb-2">URL slug</label>
                <input
                  id="slug" name="slug" value={current.slug} onChange={handleChange}
                  placeholder="Auto-generated from title if left blank"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:border-purple-300 focus:outline-none transition-all"
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tag" className="block text-xs font-medium text-purple-400 mb-2">Tag</label>
                  <input
                    id="tag" name="tag" value={current.tag} onChange={handleChange}
                    placeholder="e.g., Anti-Aging"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:border-purple-300 focus:outline-none transition-all"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="readTime" className="block text-xs font-medium text-purple-400 mb-2">Read time</label>
                  <input
                    id="readTime" name="readTime" value={current.readTime} onChange={handleChange}
                    placeholder="e.g., 4 min read"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:border-purple-300 focus:outline-none transition-all"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="excerpt" className="block text-xs font-medium text-purple-400 mb-2">Excerpt</label>
                <textarea
                  id="excerpt" name="excerpt" value={current.excerpt} onChange={handleChange} rows={2}
                  placeholder="One or two sentences shown on the article card"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:border-purple-300 focus:outline-none transition-all resize-none"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="body" className="block text-xs font-medium text-purple-400 mb-2">
                  Body <span className="font-normal text-gray-400">(separate paragraphs with a blank line)</span>
                </label>
                <textarea
                  id="body" name="body" value={current.body} onChange={handleChange} rows={8}
                  placeholder={'First paragraph...\n\nSecond paragraph...'}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:border-purple-300 focus:outline-none transition-all resize-none"
                  required disabled={isSubmitting}
                />
              </div>
            </section>

            {/* Right: cover image + CTA + publish */}
            <section className="space-y-5">
              <h3 className="text-xs font-semibold text-purple-600 flex items-center gap-3">
                <span className="w-8 h-px bg-purple-200"></span>
                Cover image
              </h3>

              <div
                className="relative aspect-[16/9] rounded-xl overflow-hidden border border-dashed border-purple-200 bg-purple-50/30 flex items-center justify-center cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                {isCompressing ? (
                  <div className="flex flex-col items-center gap-2 text-purple-400">
                    <Loader2 size={26} className="animate-spin" />
                    <span className="text-xs font-medium">Optimizing image...</span>
                  </div>
                ) : (imagePreview || current.coverImageUrl) ? (
                  <Image src={imagePreview || current.coverImageUrl} alt="Cover preview" fill className="object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-purple-300">
                    <UploadCloud size={28} />
                    <span className="text-xs font-medium">Click to upload</span>
                  </div>
                )}
                {!isCompressing && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-white text-xs font-semibold flex items-center gap-1.5">
                      <UploadCloud size={14} /> Replace image
                    </span>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} disabled={isSubmitting || isCompressing} />
              </div>

              <h3 className="text-xs font-semibold text-purple-600 flex items-center gap-3 pt-2">
                <span className="w-8 h-px bg-purple-200"></span>
                Shop CTA
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ctaLabel" className="block text-xs font-medium text-purple-400 mb-2">Button label</label>
                  <input
                    id="ctaLabel" name="ctaLabel" value={current.ctaLabel} onChange={handleChange}
                    placeholder="e.g., Shop Anti-Aging"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:border-purple-300 focus:outline-none transition-all"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="ctaHref" className="block text-xs font-medium text-purple-400 mb-2">Link</label>
                  <input
                    id="ctaHref" name="ctaHref" value={current.ctaHref} onChange={handleChange}
                    placeholder="/collections/anti-aging-serums"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:border-purple-300 focus:outline-none transition-all"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="bg-purple-50/50 rounded-2xl p-5 border border-purple-100/40 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 font-medium">Publish this article</p>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="isActive" checked={current.isActive}
                      onCheckedChange={(checked) => setCurrent((prev) => ({ ...prev, isActive: checked }))}
                      className="w-6 h-6 rounded-lg border-2 border-indigo-200 data-[state=checked]:bg-cl-purple data-[state=checked]:border-cl-purple"
                    />
                    <Label htmlFor="isActive" className="text-[11px] font-black text-gray-900 cursor-pointer">Published</Label>
                  </div>
                </div>
                <div>
                  <label htmlFor="sortOrder" className="block text-xs font-medium text-purple-400 mb-2">Display order (lower shows first)</label>
                  <input
                    id="sortOrder" name="sortOrder" type="number" value={current.sortOrder} onChange={handleChange}
                    className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-gray-900 focus:border-purple-300 focus:outline-none transition-all"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
            <button type="button" onClick={resetForm} className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting || isCompressing} className="cl-gradient-btn gap-2 px-6 py-2.5 text-[11px] active:scale-[0.98] disabled:opacity-60">
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Saving...
                </>
              ) : editMode ? 'Update article' : 'Publish article'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
