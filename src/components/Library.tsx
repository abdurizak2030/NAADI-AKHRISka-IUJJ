'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Library, Search, Download, BookOpen, FileText, Globe, Check, Eye, X } from 'lucide-react';
import { PdfBook } from '../types';
import { mediaUrl } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';

interface LibraryProps {
  pdfs: PdfBook[];
  token: string | null;
  onLoginPrompt: () => void;
}

export default function LibraryView({ pdfs, token, onLoginPrompt }: LibraryProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [openBook, setOpenBook] = useState<PdfBook | null>(null);

  // Filter books
  const filteredPdfs = pdfs.filter(p => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const categories = ['All', ...new Set(pdfs.map(p => p.category))];

  const handleDownload = (p: PdfBook, e: React.MouseEvent) => {
    e.preventDefault();
    if (!token) {
      onLoginPrompt();
      return;
    }
    
    if (!p.downloadUrl || p.downloadUrl === '#') {
      setToastMessage('This book is not available for download yet.');
      window.setTimeout(() => setToastMessage(null), 3500);
      return;
    }
    const link = document.createElement('a');
    link.href = mediaUrl(p.downloadUrl);
    link.download = `${p.title}.pdf`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  return (
    <div className="space-y-8 pb-16 relative" id="library-section">
      
      {/* Toast Notification Container */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-emerald-950 text-white border border-amber-400/40 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 w-[90%] max-w-md"
          >
            <div className="w-8 h-8 rounded-full bg-amber-400/10 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xs sm:text-sm font-medium">
              {toastMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Header and Search */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-gray-150 pb-6"
        id="library-header"
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-150 uppercase tracking-wider">
            <Library className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('library.badge')}</span>
          </div>
          <h2 className="text-2xl sm:text-3.5xl font-extrabold text-emerald-950 font-display tracking-tight">
            {t('library.title')}
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm max-w-xl">
            {t('library.subtitle')}
          </p>
        </div>
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            id="input-library-search"
            placeholder={t('library.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-800 focus:border-emerald-800 focus:outline-none transition-all shadow-sm"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
        </div>
      </motion.div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none" id="library-categories">
        {categories.map((cat) => (
          <button
            key={cat}
            id={`filter-cat-${cat.replace(/\s+/g, '-').toLowerCase()}`}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4.5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === cat
                ? 'bg-emerald-900 text-amber-300 shadow-sm'
                : 'bg-emerald-50 text-emerald-950 hover:bg-emerald-100/70 border border-emerald-100/50'
            }`}
          >
            {cat === 'All' ? 'All Categories' : cat}
          </button>
        ))}
      </div>

      {/* Grid of Books */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" id="library-books-grid">
        {filteredPdfs.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">{t('library.noResults')}</p>
          </div>
        ) : (
          filteredPdfs.map((pdf) => (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              whileHover={{ y: -6 }}
              key={pdf.id}
              id={`book-card-${pdf.id}`}
              className="bg-white rounded-2xl overflow-hidden border border-gray-150/70 hover:border-emerald-800/20 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <div className="p-5.5 flex gap-4.5">
                {/* Simulated Book Cover */}
                <div className="w-24 h-32 bg-gradient-to-br from-emerald-900 to-emerald-950 rounded-xl shadow-md border-r-4 border-amber-400 flex flex-col justify-between p-3 flex-shrink-0 relative overflow-hidden text-white">
                  {pdf.coverUrl && pdf.coverUrl !== '/logoIUJJ.jpg' && <img src={mediaUrl(pdf.coverUrl)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-55" />}
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:10px_10px]" />
                  <div className="relative text-[8px] font-bold text-amber-400 border-b border-amber-400/20 pb-1 uppercase tracking-widest truncate">
                    {pdf.category.split(' ')[0]}
                  </div>
                  <div className="relative text-[10px] font-bold leading-tight line-clamp-3 font-sans my-1 text-emerald-50">
                    {pdf.title}
                  </div>
                  <div className="relative text-[8px] text-emerald-200 italic truncate border-t border-emerald-800/80 pt-1 font-mono">
                    {pdf.author}
                  </div>
                </div>

                {/* Book Meta Details */}
                <div className="space-y-2.5 flex-grow">
                  <span className="text-[9px] font-bold text-amber-750 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20 uppercase font-mono tracking-wider">
                    {pdf.category}
                  </span>
                  
                  <h3 className="text-sm sm:text-base font-bold text-emerald-950 font-sans line-clamp-2 leading-snug">
                    {pdf.title}
                  </h3>
                  
                  <p className="text-[10px] sm:text-xs font-semibold text-gray-400">
                    Author: <span className="text-emerald-900">{pdf.author}</span>
                  </p>
                  
                  <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">
                    {pdf.description}
                  </p>
                </div>
              </div>

              {/* Action Buttons footer */}
              <div className="px-5.5 py-4 bg-emerald-50/15 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center space-x-3.5 text-[10px] text-gray-500 font-mono font-bold">
                  <div className="flex items-center space-x-1">
                    <FileText className="w-3.5 h-3.5 text-amber-500" />
                    <span>{pdf.pagesCount} Pages</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Globe className="w-3.5 h-3.5 text-amber-500" />
                    <span>{pdf.language.split(' ')[0]}</span>
                  </div>
                </div>

                <button
                  id={`btn-read-${pdf.id}`}
                  onClick={() => setOpenBook(pdf)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-800/20 text-emerald-900 hover:bg-emerald-50 transition-all text-xs font-bold cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Read</span>
                </button>
                <button
                  id={`btn-download-${pdf.id}`}
                  onClick={(e) => handleDownload(pdf, e)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white transition-all text-xs font-bold shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t('library.downloadPdf')}</span>
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {openBook && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-emerald-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
            onClick={() => setOpenBook(null)}
            role="dialog" aria-modal="true" aria-label={`Read ${openBook.title}`}
          >
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-5xl h-[92vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col">
              <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-gray-200">
                <div className="min-w-0"><h3 className="font-bold text-emerald-950 truncate">{openBook.title}</h3><p className="text-xs text-gray-500 truncate">{openBook.author}</p></div>
                <div className="flex items-center gap-2 shrink-0">
                  {openBook.downloadUrl && openBook.downloadUrl !== '#' && <a href={mediaUrl(openBook.downloadUrl)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-900 text-white text-xs font-bold"><Download className="w-3.5 h-3.5" /> Download</a>}
                  <button onClick={() => setOpenBook(null)} aria-label="Close reader" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"><X className="w-5 h-5" /></button>
                </div>
              </div>
              {openBook.downloadUrl && openBook.downloadUrl !== '#' ? <iframe src={mediaUrl(openBook.downloadUrl)} title={`Reading ${openBook.title}`} className="flex-1 w-full" /> : <div className="flex-1 grid place-items-center text-sm text-gray-500">The PDF file is not available yet.</div>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
