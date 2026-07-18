'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { API_BASE_URL } from '../lib/api';
import { Mail, MapPin, Phone, Send, CheckCircle2, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';

export default function Contact() {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }
      setSent(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch {
      setError('Unable to send your message. Please check your internet connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="space-y-8 pb-16"
      id="contact-section"
    >
      {/* Header section */}
      <div className="space-y-2 border-b border-gray-150 pb-6" id="contact-header">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-150 uppercase tracking-wider">
          <MessageCircle className="w-3.5 h-3.5 text-amber-500" />
          <span>{t('contact.badge')}</span>
        </div>
        <h2 className="text-2xl sm:text-3.5xl font-extrabold text-emerald-950 font-display tracking-tight">
          {t('contact.title')}
        </h2>
        <p className="text-gray-500 text-xs sm:text-sm max-w-xl">
          {t('contact.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Contact info card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-2 bg-emerald-950 rounded-3xl p-7 sm:p-8 text-white shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative space-y-7">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/15 flex items-center justify-center shrink-0">
                <MapPin className="w-4.5 h-4.5 text-amber-400" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">{t('contact.addressLabel')}</p>
                <p className="text-sm text-emerald-100 mt-1 leading-relaxed">{t('contact.addressValue')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/15 flex items-center justify-center shrink-0">
                <Mail className="w-4.5 h-4.5 text-amber-400" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">{t('contact.emailLabel')}</p>
                <p className="text-sm text-emerald-100 mt-1">readingclub@iuj.edu.et</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/15 flex items-center justify-center shrink-0">
                <Phone className="w-4.5 h-4.5 text-amber-400" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">{t('contact.phoneLabel')}</p>
                <p className="text-sm text-emerald-100 mt-1">+251 915 744 321</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contact form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="lg:col-span-3 premium-card rounded-3xl p-7 sm:p-8"
        >
          {sent ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-700" />
              <p className="text-sm font-semibold text-emerald-950">{t('contact.formSuccess')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs font-semibold">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-emerald-900">{t('contact.formName')}</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-gray-200 hover:border-emerald-300 focus:border-amber-500 rounded-xl p-3 text-sm text-emerald-950 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-emerald-900">{t('contact.formEmail')}</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-gray-200 hover:border-emerald-300 focus:border-amber-500 rounded-xl p-3 text-sm text-emerald-950 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-emerald-900">{t('contact.formMessage')}</label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-white border border-gray-200 hover:border-emerald-300 focus:border-amber-500 rounded-xl p-3 text-sm text-emerald-950 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto flex items-center justify-center gap-2 gold-gradient-bg text-emerald-950 font-bold px-6 py-3 rounded-xl text-sm shadow-md hover:shadow-lg hover:shadow-amber-500/25 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-emerald-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{t('contact.formSubmit')}</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
