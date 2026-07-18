'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { mediaUrl } from '../lib/api';
import { Play, Video, Disc, Clock, User, Calendar, Radio, X, Images, ZoomIn } from 'lucide-react';
import { VideoItem, TalkItem, GalleryItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import VideoPlayer from './VideoPlayer';
import AudioPlayer from './AudioPlayer';
import { useLanguage } from '../i18n/LanguageContext';

interface MediaProps {
  videos: VideoItem[];
  talks: TalkItem[];
  gallery: GalleryItem[];
  token: string | null;
  onLoginPrompt: () => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

export default function Media({ videos, talks, gallery, token, onLoginPrompt }: MediaProps) {
  const [activeMediaTab, setActiveMediaTab] = useState<'videos' | 'talks' | 'gallery'>('videos');
  const [activeTalk, setActiveTalk] = useState<TalkItem | null>(null);
  const [openVideo, setOpenVideo] = useState<VideoItem | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryItem | null>(null);
  const { t } = useLanguage();

  const handleOpenVideo = (video: VideoItem) => {
    if (!token) {
      onLoginPrompt();
      return;
    }
    setOpenVideo(video);
  };

  const handlePlayTalk = (talk: TalkItem) => {
    if (!token) {
      onLoginPrompt();
      return;
    }
    setActiveTalk(talk);
  };

  return (
    <div className="space-y-8 pb-16" id="media-section">
      {/* Tab Selectors */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeUp}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-150 pb-6 gap-6"
        id="media-header"
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-150 uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('media.badge')}</span>
          </div>
          <h2 className="text-2xl sm:text-3.5xl font-extrabold text-emerald-950 font-display tracking-tight">
            {t('media.title')}
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm max-w-xl">
            {t('media.subtitle')}
          </p>
        </div>

        <div className="flex bg-emerald-50/70 rounded-2xl p-1 border border-emerald-100/50 self-start sm:self-auto flex-wrap" id="media-subtabs">
          <button
            id="tab-videos"
            onClick={() => setActiveMediaTab('videos')}
            className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeMediaTab === 'videos'
                ? 'bg-emerald-900 text-amber-300 shadow-sm'
                : 'text-emerald-950 hover:bg-emerald-100/50'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>{t('media.tabVideos')}</span>
          </button>
          <button
            id="tab-talks"
            onClick={() => setActiveMediaTab('talks')}
            className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeMediaTab === 'talks'
                ? 'bg-emerald-900 text-amber-300 shadow-sm'
                : 'text-emerald-950 hover:bg-emerald-100/50'
            }`}
          >
            <Disc className="w-4 h-4" />
            <span>{t('media.tabTalks')}</span>
          </button>
          <button
            id="tab-gallery"
            onClick={() => setActiveMediaTab('gallery')}
            className={`flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeMediaTab === 'gallery'
                ? 'bg-emerald-900 text-amber-300 shadow-sm'
                : 'text-emerald-950 hover:bg-emerald-100/50'
            }`}
          >
            <Images className="w-4 h-4" />
            <span>{t('media.tabGallery')}</span>
          </button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeMediaTab === 'videos' && (
          /* VIDEOS SECTION */
          <motion.div
            key="videos"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
            id="videos-grid"
          >
            {videos.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-gray-550 font-sans text-sm">
                {t('media.noVideos')}
              </div>
            ) : (
              videos.map((vid, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  whileHover={{ y: -5 }}
                  key={vid.id}
                  className="bg-white rounded-3xl overflow-hidden border border-gray-150/70 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                  id={`video-card-${vid.id}`}
                >
                  <button
                    onClick={() => handleOpenVideo(vid)}
                    className="relative aspect-video bg-emerald-950 flex items-center justify-center group overflow-hidden w-full"
                    aria-label={`Play ${vid.title}`}
                  >
                    {(vid.thumbnailUrl || vid.youtubeId) ? (
                      <img
                        src={mediaUrl(vid.thumbnailUrl) || `https://img.youtube.com/vi/${vid.youtubeId}/hqdefault.jpg`}
                        alt={vid.title}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-80 transition-opacity duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-cover bg-center opacity-40 filter blur-[2px] bg-[url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQBlnBaNdt9jJ4GBDAvze8FWARe-A6bXrNEtv8ZCnyn-w&s=10')]" />
                    )}

                    <div className="relative z-10 w-16 h-16 rounded-full bg-amber-500 group-hover:bg-amber-400 text-emerald-950 flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform border border-amber-300/40">
                      <Play className="w-8 h-8 fill-emerald-950 ml-1.5" />
                    </div>

                    <div className="absolute bottom-3 right-3 bg-emerald-950/90 border border-amber-400/25 px-2.5 py-1 rounded-lg text-[10px] text-amber-300 font-mono font-semibold tracking-wider">
                      {vid.duration}
                    </div>
                  </button>

                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-gray-400 font-bold uppercase tracking-wider font-mono">
                      <span className="flex items-center gap-1.5 text-emerald-900">
                        <User className="w-3.5 h-3.5 text-amber-500" />
                        <span>{vid.speaker}</span>
                      </span>
                      <span>{t('media.scholarlyHost')}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-emerald-950 font-sans line-clamp-2 leading-snug tracking-tight">
                      {vid.title}
                    </h3>
                    <p className="text-gray-500 text-xs sm:text-sm line-clamp-2 leading-relaxed">{vid.description}</p>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {activeMediaTab === 'talks' && (
          /* TALKS PODCAST SECTION */
          <motion.div
            key="talks"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
            id="talks-section"
          >
            {/* Real audio player */}
            <AnimatePresence>
              {activeTalk && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <AudioPlayer talk={activeTalk} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* List of Podcasts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" id="talks-list">
              {talks.length === 0 ? (
                <div className="col-span-full text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-gray-550 font-sans text-sm">
                  {t('media.noTalks')}
                </div>
              ) : (
                talks.map((talk, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: idx * 0.05 }}
                    key={talk.id}
                    id={`talk-card-${talk.id}`}
                    className={`bg-white rounded-2xl p-5 border flex items-center justify-between gap-4 transition-all duration-300 ${
                      activeTalk?.id === talk.id
                        ? 'border-emerald-800 ring-2 ring-emerald-800/10 bg-emerald-50/10 shadow-sm'
                        : 'border-gray-150/70 hover:border-emerald-800/20 hover:bg-emerald-50/5 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start space-x-4 flex-grow truncate">
                      <button
                        id={`btn-play-talk-${talk.id}`}
                        onClick={() => handlePlayTalk(talk)}
                        className="w-12 h-12 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-900 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer shadow-inner hover:scale-105 active:scale-95"
                      >
                        <Play className="w-5 h-5 fill-emerald-900 ml-0.5" />
                      </button>
                      <div className="truncate space-y-1">
                        <h4 className="text-sm sm:text-base font-bold text-emerald-950 font-sans truncate tracking-tight">{talk.title}</h4>
                        <p className="text-gray-500 text-xs sm:text-sm truncate leading-relaxed">{talk.description}</p>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] sm:text-xs text-gray-400 font-semibold pt-1 font-sans">
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-emerald-900 font-bold">{talk.speaker}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span>{talk.duration}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 text-[10px] text-gray-400 font-mono hidden sm:block font-semibold">
                      <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg border">
                        <Calendar className="w-3.5 h-3.5 text-emerald-850" />
                        <span>{talk.date}</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {activeMediaTab === 'gallery' && (
          /* PHOTO GALLERY SECTION */
          <motion.div
            key="gallery"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            id="gallery-grid"
          >
            {gallery.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-gray-550 font-sans text-sm">
                {t('media.noPhotos')}
              </div>
            ) : (
              gallery.map((photo, idx) => (
                <motion.button
                  key={photo.id}
                  onClick={() => setLightboxPhoto(photo)}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: idx * 0.04 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative aspect-square rounded-2xl overflow-hidden border border-gray-150/70 shadow-sm group cursor-pointer"
                  id={`gallery-photo-${photo.id}`}
                >
                  <img
                    src={mediaUrl(photo.imageUrl)}
                    alt={photo.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-emerald-950/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                    <span className="text-white text-xs font-bold truncate">{photo.title}</span>
                  </div>
                  <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="w-3.5 h-3.5" />
                  </div>
                </motion.button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video lightbox */}
      <AnimatePresence>
        {openVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setOpenVideo(null)}
            id="video-lightbox"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold font-sans text-sm sm:text-base line-clamp-1 pr-4">{openVideo.title}</h3>
                <button
                  onClick={() => setOpenVideo(null)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white shrink-0"
                  aria-label="Close video"
                >
                  <X size={18} />
                </button>
              </div>
              <VideoPlayer
                videoUrl={openVideo.videoUrl}
                youtubeId={openVideo.youtubeId}
                posterUrl={openVideo.thumbnailUrl}
                title={openVideo.title}
                autoPlay
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo lightbox */}
      <AnimatePresence>
        {lightboxPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setLightboxPhoto(null)}
            id="photo-lightbox"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold font-sans text-sm sm:text-base line-clamp-1 pr-4">{lightboxPhoto.title}</h3>
                <button
                  onClick={() => setLightboxPhoto(null)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white shrink-0"
                  aria-label="Close photo"
                >
                  <X size={18} />
                </button>
              </div>
              <img loading="lazy" src={mediaUrl(lightboxPhoto.imageUrl)} alt={lightboxPhoto.title} className="w-full max-h-[75vh] object-contain rounded-2xl" />
              {lightboxPhoto.description && (
                <p className="text-gray-300 text-xs sm:text-sm mt-3 text-center">{lightboxPhoto.description}</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
