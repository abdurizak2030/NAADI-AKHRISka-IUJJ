'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL, mediaUrl } from '../lib/api';
import {
  User,
  MessageSquare,
  Trophy,
  PlusCircle,
  Send,
  Camera,
  Layers,
  Star,
  Check,
  Paperclip,
  FileText,
  ImagePlus,
  Loader2,
  XCircle,
  Mic,
  Square
} from 'lucide-react';
import { User as UserType, Article, ChatMessage, RoadmapNode } from '../types';
import ImageCropModal from './ImageCropModal';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';

interface DashboardProps {
  user: UserType | null;
  token: string | null;
  articles: Article[];
  roadmap: RoadmapNode[];
  onRefreshUser: () => void;
  onRefreshArticles: () => void;
}

export default function Dashboard({
  user,
  token,
  articles,
  roadmap,
  onRefreshUser,
  onRefreshArticles
}: DashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'articles' | 'roadmap' | 'chat'>('profile');
  const { t } = useLanguage();

  // --- Profile Edit State ---
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editDept, setEditDept] = useState(user?.department || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(user?.avatarUrl || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');

  // --- Write Article State ---
  const [artTitle, setArtTitle] = useState('');
  const [artSummary, setArtSummary] = useState('');
  const [artContent, setArtContent] = useState('');
  const [artCategory, setArtCategory] = useState('Analytical Reading');
  const [artLang, setArtLang] = useState<'Somali' | 'Arabic' | 'English'>('English');
  const [artStatus, setArtStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [artImageUrl, setArtImageUrl] = useState('');
  const [uploadingArtImage, setUploadingArtImage] = useState(false);
  const [writingArticle, setWritingArticle] = useState(false);
  const [artSuccess, setArtSuccess] = useState('');
  const [artError, setArtError] = useState('');

  // --- Chat State ---
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatText, setNewChatText] = useState('');
  const [chatAttachment, setChatAttachment] = useState<{ url: string; name: string; type: string } | null>(null);
  const [uploadingChatAttachment, setUploadingChatAttachment] = useState(false);
  const [chatAttachError, setChatAttachError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<BlobPart[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const myArticles = articles.filter(a => a.authorId === user?.id);

  // Load chat messages on tab switch
  useEffect(() => {
    if (activeSubTab === 'chat') {
      fetch(`${API_BASE_URL}/api/chat`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setChatMessages(data);
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 150);
          }
        })
        .catch(err => console.error('Chat load error:', err));
    }
  }, [activeSubTab]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setUpdatingProfile(true);
    setProfileSuccess('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: editName, bio: editBio, department: editDept, avatarUrl: editAvatarUrl })
      });
      if (res.ok) {
        setProfileSuccess('Your scholarly profile details have been successfully synchronized.');
        onRefreshUser();
        setTimeout(() => setProfileSuccess(''), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarError('');
    setCropFile(file);
  };

  const uploadCroppedAvatar = async (blob: Blob) => {
    setCropFile(null);
    if (!token) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', blob, 'avatar.jpg');
      const res = await fetch(`${API_BASE_URL}/api/uploads/avatar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setEditAvatarUrl(data.url);
      } else {
        setAvatarError(data.error || 'Could not upload the photo. Please try again.');
      }
    } catch {
      setAvatarError('Unable to upload the photo. Please check your internet connectivity.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleArticleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !token) return;
    setUploadingArtImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE_URL}/api/uploads/image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setArtImageUrl(data.url);
      } else {
        setArtError(data.error || 'Could not upload the cover image.');
      }
    } catch {
      setArtError('Unable to upload the cover image. Please check your internet connectivity.');
    } finally {
      setUploadingArtImage(false);
    }
  };

  const handleWriteArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!artTitle || !artContent || !artSummary) {
      setArtError('Please populate all required fields.');
      return;
    }

    setWritingArticle(true);
    setArtSuccess('');
    setArtError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: artTitle,
          summary: artSummary,
          content: artContent,
          category: artCategory,
          language: artLang,
          status: artStatus === 'PUBLISHED' ? 'PENDING' : artStatus,
          imageUrl: artImageUrl || undefined
        })
      });
      if (res.ok) {
        setArtSuccess(artStatus === 'PUBLISHED' ? 'Your academic essay has been submitted for admin review and will be published once approved.' : 'Your essay has been saved securely to your drafts.');
        setArtTitle('');
        setArtSummary('');
        setArtContent('');
        setArtImageUrl('');
        onRefreshArticles();
        setTimeout(() => setArtSuccess(''), 4000);
      } else {
        const data = await res.json();
        setArtError(data.error || 'A technical validation error occurred.');
      }
    } catch {
      setArtError('Unable to transmit data. Please check your internet connectivity.');
    } finally {
      setWritingArticle(false);
    }
  };

  const handleChatAttachmentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !token) return;
    setChatAttachError('');
    setUploadingChatAttachment(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE_URL}/api/uploads/attachment`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setChatAttachment({ url: data.url, name: data.name, type: data.mimeType });
      } else {
        setChatAttachError(data.error || 'Could not attach the file.');
      }
    } catch {
      setChatAttachError('Unable to attach the file. Please check your internet connectivity.');
    } finally {
      setUploadingChatAttachment(false);
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setChatAttachError('Voice recording is not supported in this browser.');
      return;
    }
    setChatAttachError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      const recorder = new MediaRecorder(stream, { mimeType });
      recordChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (recordTimerRef.current) clearInterval(recordTimerRef.current);
        setRecordSeconds(0);
        const blob = new Blob(recordChunksRef.current, { type: mimeType });
        if (blob.size === 0) return;
        setUploadingChatAttachment(true);
        try {
          const formData = new FormData();
          const ext = mimeType === 'audio/webm' ? 'webm' : 'ogg';
          formData.append('file', blob, `voice-message.${ext}`);
          const res = await fetch(`${API_BASE_URL}/api/uploads/attachment`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
          });
          const data = await res.json();
          if (res.ok) {
            setChatAttachment({ url: data.url, name: 'Voice message', type: data.mimeType });
          } else {
            setChatAttachError(data.error || 'Could not upload the voice message.');
          }
        } catch {
          setChatAttachError('Unable to upload the voice message.');
        } finally {
          setUploadingChatAttachment(false);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch {
      setChatAttachError('Microphone access was denied.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newChatText.trim() && !chatAttachment) || !token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newChatText,
          attachmentUrl: chatAttachment?.url,
          attachmentName: chatAttachment?.name,
          attachmentType: chatAttachment?.type
        })
      });
      const data = await res.json();
      if (res.ok) {
        setChatMessages(prev => [...prev, data]);
        setNewChatText('');
        setChatAttachment(null);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-16" id="dashboard-container">
      
      {/* 1. Dashboard Sub-navigation Sidepanel */}
      <div className="lg:col-span-3 bg-white rounded-3xl p-5 border border-gray-150/70 shadow-md h-fit space-y-2" id="dashboard-sidepanel">
        
        {/* Profile brief summary */}
        <div className="p-4 border-b border-gray-100 text-center space-y-3 mb-4">
          <img loading="lazy"             src={mediaUrl(user?.avatarUrl) || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQBlnBaNdt9jJ4GBDAvze8FWARe-A6bXrNEtv8ZCnyn-w&s=10'}
            alt={user?.name}
            className="w-16 h-16 rounded-full mx-auto border-2 border-amber-400 object-cover shadow-sm shrink-0"
          />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-emerald-950 truncate font-sans">{user?.name}</h4>
            <span className="inline-block text-[9px] bg-emerald-50 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-100/50 font-mono uppercase tracking-wide">
              {user?.role}
            </span>
          </div>
        </div>

        {/* Action tabs list */}
        {[
          { id: 'profile', label: t('dashboard.tabProfile'), icon: User },
          { id: 'articles', label: t('dashboard.tabArticles'), icon: PlusCircle },
          { id: 'roadmap', label: t('dashboard.tabRoadmap'), icon: Layers },
          { id: 'chat', label: t('dashboard.tabChat'), icon: MessageSquare },
        ].map((subtab) => {
          const Icon = subtab.icon;
          return (
            <button
              key={subtab.id}
              id={`db-tab-${subtab.id}`}
              onClick={() => setActiveSubTab(subtab.id as 'profile' | 'articles' | 'roadmap' | 'chat')}
              className={`w-full flex items-center space-x-2.5 px-4 py-3 rounded-xl text-xs font-bold text-left transition-all cursor-pointer ${
                activeSubTab === subtab.id
                  ? 'bg-emerald-900 text-amber-300 shadow-sm border-r-2 border-amber-400'
                  : 'text-gray-750 hover:bg-emerald-50/65 hover:text-emerald-950'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{subtab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Primary Workspace Content Panel */}
      <div className="lg:col-span-9 bg-white rounded-3xl p-6 sm:p-8 border border-gray-150/70 shadow-xl min-h-[500px]" id="dashboard-workspace">
        
        <AnimatePresence mode="wait">
          {/* ========================================== */}
          {/* A. PROFILE TAB VIEW */}
          {/* ========================================== */}
          {activeSubTab === 'profile' && user && (
            <motion.div 
              key="profile-pane"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-8" 
              id="db-view-profile"
            >
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-emerald-950 font-sans tracking-tight">{t('dashboard.profileHeading')}</h3>
                <p className="text-gray-500 text-xs sm:text-sm">{t('dashboard.profileSubheading')}</p>
              </div>

              {/* Profile Update Form */}
              <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-2xl" id="form-profile-edit">
                {profileSuccess && (
                  <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs sm:text-sm flex items-center gap-2 border border-emerald-200">
                    <Check className="w-4.5 h-4.5 text-emerald-600" />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                {/* Profile Picture Upload */}
                <div className="flex items-center gap-4" id="form-profile-picture">
                  <div className="relative shrink-0">
                    <img loading="lazy"                       src={mediaUrl(editAvatarUrl) || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQBlnBaNdt9jJ4GBDAvze8FWARe-A6bXrNEtv8ZCnyn-w&s=10'}
                      alt={user?.name}
                      className="w-20 h-20 rounded-full object-cover border-2 border-amber-400 shadow-sm"
                    />
                    <label
                      htmlFor="profile-avatar-input"
                      className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-900 border-2 border-white text-amber-300 flex items-center justify-center cursor-pointer hover:bg-emerald-800 transition-colors shadow-md"
                      title={t('common.changePhoto')}
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Camera className="w-3.5 h-3.5" />
                      )}
                    </label>
                    <input
                      type="file"
                      id="profile-avatar-input"
                      accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                      className="hidden"
                      onChange={handleAvatarFileChange}
                      disabled={uploadingAvatar}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-emerald-955">{t('dashboard.profilePicture')}</p>
                    <p className="text-[11px] text-gray-500 leading-normal">{t('dashboard.profilePictureHint')}</p>
                    {avatarError && <p className="text-[11px] text-red-600">{avatarError}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-emerald-955">Official Full Name *</label>
                    <input
                      type="text"
                      id="profile-name"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-800 focus:outline-none focus:border-emerald-800 transition-all shadow-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-emerald-955">{t('dashboard.department')}</label>
                    <input
                      type="text"
                      id="profile-dept"
                      value={editDept}
                      onChange={(e) => setEditDept(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-800 focus:outline-none focus:border-emerald-800 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-emerald-955">{t('dashboard.bio')}</label>
                  <textarea
                    id="profile-bio"
                    rows={3}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder={t('dashboard.bioPlaceholder')}
                    className="w-full p-3.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-800 focus:outline-none focus:border-emerald-800 transition-all shadow-inner"
                  />
                </div>

                <button
                  type="submit"
                  id="btn-profile-update-submit"
                  disabled={updatingProfile}
                  className="px-6 py-3 rounded-xl text-xs font-bold bg-emerald-900 text-white hover:bg-emerald-850 transition-all cursor-pointer shadow-md"
                >
                  {updatingProfile ? t('dashboard.synchronizing') : t('dashboard.synchronize')}
                </button>
              </form>

              {/* Achievements Blocks */}
              <div className="border-t border-gray-100 pt-8 space-y-4">
                <h4 className="text-sm sm:text-base font-bold text-emerald-955 flex items-center space-x-2 font-sans tracking-tight">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>{t('dashboard.credentials')}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="achievements-list">
                  {user.achievements.map((ach) => (
                    <div key={ach.id} className="p-4 bg-amber-50/40 rounded-2xl border border-amber-200/40 flex items-start space-x-3.5 shadow-sm" id={`ach-card-${ach.id}`}>
                      <div className="p-2.5 bg-amber-500 rounded-xl text-emerald-950 shrink-0">
                        <Star className="w-5 h-5 fill-emerald-950" />
                      </div>
                      <div>
                        <h5 className="text-xs sm:text-sm font-bold text-emerald-950">{ach.title}</h5>
                        <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 leading-normal">{ach.description}</p>
                        <span className="text-[9px] text-gray-400 font-mono mt-1 block">Accredited on: {new Date(ach.unlockedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================== */}
          {/* B. WRITE ARTICLES VIEW */}
          {/* ========================================== */}
          {activeSubTab === 'articles' && (
            <motion.div 
              key="write-pane"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-8" 
              id="db-view-write-article"
            >
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-emerald-950 font-sans tracking-tight">{t('dashboard.composeHeading')}</h3>
                <p className="text-gray-500 text-xs sm:text-sm">{t('dashboard.composeSubheading')}</p>
              </div>

              {/* Form writing */}
              <form onSubmit={handleWriteArticle} className="space-y-4 max-w-3xl border-b border-gray-100 pb-8" id="form-article-write">
                {artSuccess && (
                  <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs sm:text-sm flex items-center gap-2 border border-emerald-200">
                    <Check className="w-4.5 h-4.5 text-emerald-600" />
                    <span>{artSuccess}</span>
                  </div>
                )}
                {artError && (
                  <div className="p-4 bg-red-50 text-red-800 rounded-xl text-xs sm:text-sm border border-red-100">
                    {artError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-emerald-955">{t('dashboard.articleTitle')} *</label>
                    <input
                      type="text"
                      id="art-title"
                      required
                      value={artTitle}
                      onChange={(e) => setArtTitle(e.target.value)}
                      placeholder="cinwaanka mawduuca "
                      className="w-full p-3 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-800 focus:outline-none focus:border-emerald-800 transition-all shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
  <label className="text-xs font-bold text-emerald-950">
    {t('dashboard.category')}
  </label>

  <input
    id="art-cat"
    type="text"
    value={artCategory}
    onChange={(e) => setArtCategory(e.target.value)}
    placeholder="dooro mawduuca aad ka hadlayso"
    className="w-full p-3 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-800 focus:outline-none bg-white font-medium text-emerald-950"
  />
</div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-emerald-955">{t('dashboard.language')}</label>
                      <select
                        id="art-lang"
                        value={artLang}
                        onChange={(e) => setArtLang(e.target.value as 'Somali' | 'Arabic' | 'English')}
                        className="w-full p-3 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-800 focus:outline-none bg-white font-medium text-emerald-950"
                      >
                        <option value="English">English</option>
                        <option value="Somali">Somali</option>
                        <option value="Arabic">Arabic</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-emerald-955">{t('dashboard.abstract')} *</label>
                  <input
                    type="text"
                    id="art-sum"
                    required
                    value={artSummary}
                    onChange={(e) => setArtSummary(e.target.value)}
                    placeholder={t('dashboard.abstractPlaceholder')}
                    className="w-full p-3 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-800 focus:outline-none focus:border-emerald-800 transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-emerald-955">Manuscript Content *</label>
                  <textarea
                    id="art-content"
                    required
                    rows={8}
                    value={artContent}
                    onChange={(e) => setArtContent(e.target.value)}
                    placeholder="qor nuxurka artical ka ..."
                    className="w-full p-3.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-800 focus:border-emerald-800 focus:outline-none transition-all shadow-inner font-sans"
                  />
                </div>

                {/* Cover Image Upload */}
                <div className="space-y-1.5" id="form-article-cover-image">
                  <label className="text-xs font-bold text-emerald-955">
                    {t('dashboard.coverImage')} <span className="font-normal text-gray-400">({t('common.optional')})</span>
                  </label>
                  <p className="text-[11px] text-gray-500">{t('dashboard.coverImageHint')}</p>
                  <div className="flex items-center gap-3">
                    {artImageUrl ? (
                      <div className="relative">
                        <img loading="lazy" src={mediaUrl(artImageUrl)} alt="Cover preview" className="w-24 h-16 object-cover rounded-lg border border-gray-200 shadow-sm" />
                        <button
                          type="button"
                          onClick={() => setArtImageUrl('')}
                          className="absolute -top-2 -right-2 bg-white rounded-full text-red-500 shadow cursor-pointer"
                          title={t('common.remove')}
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="art-image-input"
                        className="w-24 h-16 rounded-lg border-2 border-dashed border-gray-250 flex items-center justify-center cursor-pointer text-gray-400 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                      >
                        {uploadingArtImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
                      </label>
                    )}
                    <input
                      type="file"
                      id="art-image-input"
                      accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                      className="hidden"
                      onChange={handleArticleImageChange}
                      disabled={uploadingArtImage}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-5 pt-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="status"
                      id="status-draft"
                      checked={artStatus === 'DRAFT'}
                      onChange={() => setArtStatus('DRAFT')}
                      className="text-emerald-900 focus:ring-emerald-800 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="status-draft" className="text-xs sm:text-sm text-gray-700 cursor-pointer font-medium">{t('dashboard.keepDraft')}</label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="status"
                      id="status-pub"
                      checked={artStatus === 'PUBLISHED'}
                      onChange={() => setArtStatus('PUBLISHED')}
                      className="text-emerald-900 focus:ring-emerald-800 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="status-pub" className="text-xs sm:text-sm text-gray-700 cursor-pointer font-medium">Submit for Approval</label>
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-article-save-submit"
                  disabled={writingArticle}
                  className="px-6 py-3.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-emerald-950 transition-all shadow-sm cursor-pointer"
                >
                  {writingArticle ? t('dashboard.savingManuscript') : t('dashboard.saveManuscript')}
                </button>
              </form>

              {/* List of my articles drafts/published */}
              <div className="space-y-4">
                <h4 className="text-sm sm:text-base font-bold text-emerald-950 font-sans tracking-tight">{t('dashboard.submissionsDirectory')}</h4>
                <div className="space-y-2.5" id="my-articles-list">
                  {myArticles.length === 0 ? (
                    <p className="text-xs sm:text-sm text-gray-400 italic">{t('dashboard.noSubmissions')}</p>
                  ) : (
                    myArticles.map((myArt) => (
                      <div key={myArt.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-150/70 flex items-center justify-between gap-4" id={`my-art-card-${myArt.id}`}>
                        <div className="flex items-center gap-3 truncate">
                          {myArt.imageUrl && (
                            <img loading="lazy" src={mediaUrl(myArt.imageUrl)} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0" />
                          )}
                          <div className="truncate space-y-1">
                            <h5 className="text-xs sm:text-sm font-bold text-emerald-950 truncate">{myArt.title}</h5>
                            <p className="text-[10px] sm:text-xs text-gray-500 truncate leading-normal">{myArt.summary}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full ${
                            myArt.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : myArt.status === 'PENDING' ? 'bg-amber-100 text-amber-850' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {myArt.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================== */}
          {/* C. ACADEMIC ROADMAP VIEW */}
          {/* ========================================== */}
          {activeSubTab === 'roadmap' && (
            <motion.div 
              key="roadmap-pane"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-8" 
              id="db-view-roadmap"
            >
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-emerald-955 font-sans tracking-tight">Your Academic Progress Timeline</h3>
                <p className="text-gray-500 text-xs sm:text-sm">Track your milestones and progression as a scholar throughout your journey with the club.</p>
              </div>

              <div className="border-t border-gray-100 pt-6 space-y-4">
                {/* Visual Roadmap milestones */}
                <div className="relative border-l-2 border-emerald-900/10 ml-4 pl-6 space-y-8" id="db-roadmap-tracker">
                  {roadmap.map((node) => {
                    const isCompleted = node.status === 'COMPLETED';
                    const isInProgress = node.status === 'IN_PROGRESS';

                    return (
                      <div key={node.id} className="relative" id={`roadmap-node-${node.id}`}>
                        {/* Circle marker */}
                        <div className={`absolute -left-[35px] top-1.5 w-6.5 h-6.5 rounded-full border-2 bg-white flex items-center justify-center ${
                          isCompleted ? 'border-emerald-800 bg-emerald-50' : isInProgress ? 'border-amber-500 animate-pulse bg-amber-50' : 'border-gray-200'
                        }`}>
                          {isCompleted ? (
                            <Check className="w-3.5 h-3.5 text-emerald-800 stroke-[3]" />
                          ) : (
                            <span className="text-[10px] font-mono font-bold text-amber-700">{node.step}</span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm sm:text-base font-bold text-emerald-955 font-sans">{node.title}</h4>
                            <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wide ${
                              isCompleted ? 'bg-emerald-100 text-emerald-800' : isInProgress ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-400'
                            }`}>
                              {node.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-2xl">{node.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================== */}
          {/* D. COMMUNITY CHAT VIEW */}
          {/* ========================================== */}
          {activeSubTab === 'chat' && (
            <motion.div 
              key="chat-pane"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4 flex flex-col h-[520px]" 
              id="db-view-chat"
            >
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-emerald-950 font-sans tracking-tight">{t('dashboard.forumHeading')}</h3>
                <p className="text-gray-500 text-xs sm:text-sm">{t('dashboard.forumSubheading')}</p>
              </div>

              {/* Chat list */}
              <div className="flex-grow overflow-y-auto border border-gray-150 rounded-2xl bg-gray-50/50 p-4 space-y-4 shadow-inner" id="db-chat-messages-container">
                {chatMessages.length === 0 ? (
                  <p className="text-xs sm:text-sm text-gray-400 italic text-center py-10">{t('dashboard.forumEmpty')}</p>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className="flex items-start gap-3 max-w-[85%]" id={`chat-msg-${msg.id}`}>
                      <img loading="lazy"                         src={mediaUrl(msg.avatarUrl) || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQBlnBaNdt9jJ4GBDAvze8FWARe-A6bXrNEtv8ZCnyn-w&s=10'}
                        alt={msg.userName}
                        className="w-8 h-8 rounded-full border border-amber-400 object-cover shrink-0 mt-0.5"
                      />
                      <div className="bg-white rounded-r-2xl rounded-bl-2xl p-3.5 shadow-sm border border-gray-150/50 space-y-1">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span className="text-xs font-bold text-emerald-950">{msg.userName}</span>
                          {msg.userRole === 'ADMIN' && (
                            <span className="text-[8px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider font-mono">
                              {msg.userTitle || 'Admin'}
                            </span>
                          )}
                          <span className="text-[9px] text-gray-400 font-mono font-semibold">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {msg.content && (
                          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-sans">{msg.content}</p>
                        )}
                        {msg.attachmentUrl && (
                          msg.attachmentType?.startsWith('image/') ? (
                            <a href={mediaUrl(msg.attachmentUrl)} target="_blank" rel="noopener noreferrer">
                              <img loading="lazy"                                 src={mediaUrl(msg.attachmentUrl)}
                                alt={msg.attachmentName || 'attachment'}
                                className="max-w-[200px] max-h-[160px] rounded-lg border border-gray-150 object-cover mt-1"
                              />
                            </a>
                          ) : msg.attachmentType?.startsWith('audio/') ? (
                            <div className="flex items-center gap-2 mt-1">
                              <Mic className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <audio controls src={mediaUrl(msg.attachmentUrl)} className="h-8 max-w-[220px]" />
                            </div>
                          ) : (
                            <a
                              href={mediaUrl(msg.attachmentUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-150 rounded-lg text-xs text-emerald-900 font-semibold hover:bg-gray-100 transition-colors mt-1"
                            >
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate max-w-[160px]">{msg.attachmentName || 'Attachment'}</span>
                            </a>
                          )
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Send chat */}
              <div className="space-y-2">
                <p className="text-[11px] text-gray-400 flex items-center gap-1">
                  <ImagePlus className="w-3 h-3" />
                  <span>{t('dashboard.chatAttachHint')}</span>
                </p>
                {chatAttachError && <p className="text-[11px] text-red-600">{chatAttachError}</p>}
                {chatAttachment && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-150 rounded-xl text-xs text-emerald-900 w-fit">
                    {chatAttachment.type.startsWith('image/') ? (
                      <img loading="lazy" src={mediaUrl(chatAttachment.url)} alt="" className="w-8 h-8 rounded object-cover" />
                    ) : chatAttachment.type.startsWith('audio/') ? (
                      <Mic className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    <span className="truncate max-w-[160px] font-semibold">{chatAttachment.name}</span>
                    <button type="button" onClick={() => setChatAttachment(null)} className="text-red-500 cursor-pointer">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <form onSubmit={handleSendChat} className="flex gap-2" id="form-chat-send">
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={uploadingChatAttachment}
                    title={isRecording ? 'Stop recording' : 'Record a voice message'}
                    className={`px-3.5 py-3.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0 ${
                      isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    {isRecording && <span className="text-[10px] font-mono font-bold">{recordSeconds}s</span>}
                  </button>
                  <label
                    htmlFor="chat-attachment-input"
                    title={t('common.attachFile')}
                    className="px-3.5 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl flex items-center justify-center cursor-pointer transition-colors shrink-0"
                  >
                    {uploadingChatAttachment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                  </label>
                  <input
                    type="file"
                    id="chat-attachment-input"
                    accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,application/pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleChatAttachmentChange}
                    disabled={uploadingChatAttachment}
                  />
                  <input
                    type="text"
                    id="chat-send-input"
                    placeholder={t('dashboard.forumPlaceholder')}
                    value={newChatText}
                    onChange={(e) => setNewChatText(e.target.value)}
                    className="flex-grow p-3 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-800 focus:outline-none focus:border-emerald-800 shadow-inner"
                  />
                  <button
                    type="submit"
                    id="btn-chat-send"
                    className="px-5.5 py-3.5 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl flex items-center justify-center cursor-pointer transition-colors shadow"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </div>

      {cropFile && (
        <ImageCropModal
          file={cropFile}
          circular
          aspect={1}
          onCancel={() => setCropFile(null)}
          onCropped={uploadCroppedAvatar}
        />
      )}

    </div>
  );
}
