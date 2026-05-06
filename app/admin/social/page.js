'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Loader2, MoreHorizontal, Instagram, Eye, EyeOff, ExternalLink, GripVertical, Image as ImageIcon, Link as LinkIcon, Heart } from 'lucide-react';
import Modal from '../../components/Modal';
import { Button } from '@/app/components/ui/button';
import PageLoader from '@/app/components/PageLoader';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const ManageSocial = () => {
 const [posts, setPosts] = useState([]);
 const [loading, setLoading] = useState(true);
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [editingPost, setEditingPost] = useState(null);

 // Form state
 const [imageFile, setImageFile] = useState(null);
 const [instagramUrl, setInstagramUrl] = useState('');
 const [caption, setCaption] = useState('');
 const [likes, setLikes] = useState('');
 const [sortOrder, setSortOrder] = useState(0);

 const fetchPosts = async () => {
 try {
 const res = await fetch('/api/social-posts?admin=true');
 if (res.ok) {
 const data = await res.json();
 setPosts(data);
 }
 } catch (error) {
 console.error('Failed to fetch social posts:', error);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchPosts();
 }, []);

 useEffect(() => {
 if (isModalOpen) {
 if (editingPost) {
 setInstagramUrl(editingPost.instagram_url || '');
 setCaption(editingPost.caption || '');
 setLikes(editingPost.likes || '');
 setSortOrder(editingPost.sort_order || 0);
 } else {
 setInstagramUrl('');
 setCaption('');
 setLikes('');
 setSortOrder(posts.length);
 }
 setImageFile(null);
 }
 }, [isModalOpen, editingPost]);

 const handleOpenAddModal = () => {
 setEditingPost(null);
 setIsModalOpen(true);
 };

 const handleOpenEditModal = (post) => {
 setEditingPost(post);
 setIsModalOpen(true);
 };

 const handleCloseModal = () => {
 setIsModalOpen(false);
 setEditingPost(null);
 setImageFile(null);
 };

 const handleDelete = async (postId) => {
 if (!window.confirm('Are you sure you want to delete this post?')) return;
 try {
 const res = await fetch(`/api/social-posts/${postId}`, { method: 'DELETE' });
 if (res.ok) {
 setPosts(prev => prev.filter(p => p.id !== postId));
 }
 } catch (error) {
 console.error('Failed to delete post:', error);
 }
 };

 const handleToggleStatus = async (postId, newStatus) => {
 try {
 const res = await fetch(`/api/social-posts/${postId}`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ is_active: newStatus }),
 });
 if (res.ok) {
 setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_active: newStatus } : p));
 }
 } catch (error) {
 console.error('Failed to toggle post status:', error);
 }
 };

 const handleSubmit = async (e) => {
 e.preventDefault();
 if (!editingPost && (!imageFile || imageFile.size === 0)) {
 alert('Please select an image.');
 return;
 }

 setIsSubmitting(true);

 const formData = new FormData();
 if (imageFile) formData.append('image', imageFile);
 formData.append('instagram_url', instagramUrl);
 formData.append('caption', caption);
 formData.append('likes', likes);
 formData.append('sort_order', sortOrder);

 try {
 const url = editingPost ? `/api/social-posts/${editingPost.id}` : '/api/social-posts';
 const method = editingPost ? 'PUT' : 'POST';

 const res = await fetch(url, { method, body: formData });
 if (res.ok) {
 await fetchPosts();
 handleCloseModal();
 }
 } catch (error) {
 console.error('Failed to save post:', error);
 } finally {
 setIsSubmitting(false);
 }
 };

 if (loading) return <PageLoader />;

 return (
 <div className="space-y-10 pb-20">
 {/* Header */}
 <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
 <div>
 <h2 className="text-2xl font-bold text-gray-900">Social Feed</h2>
 <p className="text-sm text-gray-400 mt-1">{posts.length} post{posts.length !== 1 ? 's' : ''} in your Instagram showcase</p>
 </div>

 <Button
 onClick={handleOpenAddModal}
 className="bg-gray-900 hover:bg-cl-purple text-white rounded-xl px-6 py-6 text-[11px] font-black shadow-lg active:scale-95 transition-all"
 >
 <Plus className="mr-2 h-4 w-4" /> Add Post
 </Button>
 </div>

 {/* Posts Grid */}
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
 <AnimatePresence>
 {posts.map(post => (
 <motion.div
 key={post.id}
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 className={`group relative bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden ${post.is_active === false ? 'opacity-50' : ''}`}
 >
 {/* Image */}
 <div className="aspect-square relative overflow-hidden rounded-t-[2rem]">
 <img
 src={post.image_url}
 alt={post.caption || 'Social post'}
 className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
 />

 {/* Hover overlay */}
 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
 <div className="flex items-center gap-2 text-white">
 <Heart size={16} className="fill-white" />
 <span className="text-sm font-bold">{post.likes || '0'}</span>
 </div>
 </div>

 {/* Status badge */}
 {post.is_active === false && (
 <div className="absolute top-3 left-3 px-2 py-1 bg-red-500/90 backdrop-blur-sm text-white text-[8px] font-black rounded-full">
 Hidden
 </div>
 )}

 {/* Sort order badge */}
 <div className="absolute top-3 right-3 w-6 h-6 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-[9px] font-black text-gray-600">
 {post.sort_order}
 </div>
 </div>

 {/* Card footer */}
 <div className="p-3 space-y-2">
 {post.caption && (
 <p className="text-[10px] text-gray-500 font-medium truncate">{post.caption}</p>
 )}

 <div className="flex items-center justify-between">
 {post.instagram_url ? (
 <a
 href={post.instagram_url}
 target="_blank"
 rel="noopener noreferrer"
 className="text-[9px] font-black text-[#9333ea] flex items-center gap-1 hover:underline"
 >
 <Instagram size={10} /> View Post
 </a>
 ) : (
 <span className="text-[9px] font-medium text-gray-300">No link</span>
 )}

 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button className="w-7 h-7 rounded-lg hover:bg-gray-50 flex items-center justify-center transition-all">
 <MoreHorizontal className="h-4 w-4 text-gray-300" />
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="rounded-xl shadow-2xl border-gray-100 p-2">
 <DropdownMenuItem onClick={() => handleOpenEditModal(post)} className="rounded-lg px-4 py-3 text-sm font-medium gap-3">
 <Edit size={16} className="text-cl-purple" /> Edit
 </DropdownMenuItem>
 <DropdownMenuItem
 onClick={() => handleToggleStatus(post.id, !post.is_active)}
 className="rounded-lg px-4 py-3 text-sm font-medium gap-3"
 >
 {post.is_active === false ? (
 <><Eye size={16} className="text-green-500" /> Show</>
 ) : (
 <><EyeOff size={16} className="text-orange-500" /> Hide</>
 )}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => handleDelete(post.id)} className="rounded-lg px-4 py-3 text-sm font-medium gap-3 text-red-600">
 <Trash2 size={16} /> Delete
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 </div>
 </motion.div>
 ))}
 </AnimatePresence>
 </div>

 {/* Empty state */}
 {posts.length === 0 && (
 <div className="min-h-[300px] bg-white rounded-[2.5rem] border border-dashed border-gray-200 flex flex-col items-center justify-center gap-4">
 <Instagram size={40} className="text-gray-200" />
 <p className="text-lg font-medium text-gray-400 italic">No social posts yet. Add your first one!</p>
 <Button
 onClick={handleOpenAddModal}
 className="bg-cl-purple hover:bg-gray-900 text-white rounded-xl px-6 py-4 text-[11px] font-black shadow-lg"
 >
 <Plus className="mr-2 h-4 w-4" /> Add First Post
 </Button>
 </div>
 )}

 {/* Modal */}
 <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingPost ? 'Edit Social Post' : 'Add Social Post'} size="max-w-2xl">
 <form onSubmit={handleSubmit} className="p-8 lg:p-12 space-y-10">
 <div className="space-y-8">
 <h3 className="text-[10px] font-black text-cl-purple mb-2 flex items-center gap-3">
 <span className="w-10 h-px bg-cl-purple/20"></span>
 Post Details
 </h3>

 {/* Image Upload */}
 <div className="group">
 <label className="block text-[11px] font-black text-gray-400 mb-3">Post Image *</label>
 <div className="relative group/img aspect-square max-w-[300px] mx-auto bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center overflow-hidden transition-all hover:bg-gray-100/50 relative">
 {imageFile ? (
 <Image src={URL.createObjectURL(imageFile)} alt="Preview" fill className="object-cover" />
 ) : editingPost?.image_url ? (
 <Image src={editingPost.image_url} alt="Current" fill className="object-cover" />
 ) : (
 <div className="text-gray-200 flex flex-col items-center gap-2">
 <ImageIcon size={32} />
 <span className="text-[9px] font-black">Select Image</span>
 </div>
 )}
 <input
 type="file"
 accept="image/*"
 onChange={(e) => setImageFile(e.target.files[0])}
 className="absolute inset-0 opacity-0 cursor-pointer"
 disabled={isSubmitting}
 />
 </div>
 </div>

 {/* Instagram URL */}
 <div className="group">
 <label htmlFor="instagram_url" className="block text-[11px] font-black text-gray-400 mb-3 transition-colors group-focus-within:text-cl-purple">
 Instagram Post URL
 </label>
 <div className="relative">
 <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
 <input
 type="url"
 id="instagram_url"
 value={instagramUrl}
 onChange={(e) => setInstagramUrl(e.target.value)}
 placeholder="https://www.instagram.com/p/..."
 className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-6 py-4 font-medium text-gray-900 focus:bg-white transition-all text-sm shadow-inner"
 disabled={isSubmitting}
 />
 </div>
 </div>

 {/* Caption */}
 <div className="group">
 <label htmlFor="caption" className="block text-[11px] font-black text-gray-400 mb-3 transition-colors group-focus-within:text-cl-purple">
 Caption
 </label>
 <textarea
 id="caption"
 value={caption}
 onChange={(e) => setCaption(e.target.value)}
 placeholder="Describe this post..."
 rows={3}
 className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-medium text-gray-900 focus:bg-white transition-all text-sm shadow-inner resize-none"
 disabled={isSubmitting}
 />
 </div>

 {/* Likes & Sort Order */}
 <div className="grid grid-cols-2 gap-6">
 <div className="group">
 <label htmlFor="likes" className="block text-[11px] font-black text-gray-400 mb-3 transition-colors group-focus-within:text-cl-purple">
 Likes Count
 </label>
 <input
 type="text"
 id="likes"
 value={likes}
 onChange={(e) => setLikes(e.target.value)}
 placeholder="e.g. 1.2k"
 className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-medium text-gray-900 focus:bg-white transition-all text-sm shadow-inner"
 disabled={isSubmitting}
 />
 </div>

 <div className="group">
 <label htmlFor="sort_order" className="block text-[11px] font-black text-gray-400 mb-3 transition-colors group-focus-within:text-cl-purple">
 Sort Order
 </label>
 <input
 type="number"
 id="sort_order"
 value={sortOrder}
 onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
 placeholder="0"
 className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-medium text-gray-900 focus:bg-white transition-all text-sm shadow-inner"
 disabled={isSubmitting}
 />
 </div>
 </div>
 </div>

 {/* Actions */}
 <div className="pt-8 border-t border-gray-50 flex justify-end gap-6">
 <button
 type="button"
 onClick={handleCloseModal}
 className="px-8 py-4 text-[10px] font-black text-gray-400 hover:text-gray-900 transition-colors"
 disabled={isSubmitting}
 >
 Cancel
 </button>
 <Button
 type="submit"
 disabled={isSubmitting}
 className="px-10 py-6 bg-cl-purple hover:bg-gray-900 text-white rounded-xl text-[11px] font-black shadow-xl active:scale-95 transition-all"
 >
 {isSubmitting ? (
 <>
 <Loader2 className="mr-3 h-5 w-5 animate-spin" />
 <span>Uploading...</span>
 </>
 ) : editingPost ? 'Update Post' : 'Add Post'}
 </Button>
 </div>
 </form>
 </Modal>
 </div>
 );
};

export default ManageSocial;
