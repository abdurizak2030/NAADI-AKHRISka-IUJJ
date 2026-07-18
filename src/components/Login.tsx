'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { API_BASE_URL } from '../lib/api';
import { Mail, Lock, Sparkles, AlertCircle, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';
import { User } from '../types';

interface LoginProps {
  onLoginSuccess: (user: User, token: string) => void;
  onBackToHome?: () => void;
}

export default function Login({ onLoginSuccess, onBackToHome }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        onLoginSuccess(data.user, data.token);
      } else {
        setError(data.error || 'The email address or security password entered is incorrect.');
      }
    } catch {
      setError('Unable to establish connection with the secure authentication server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center p-4 relative overflow-hidden" id="login-container">
      {/* Dynamic Background Gradients and Ornaments */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-800/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Background Islamic Star Geometric SVG */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full max-w-[800px] text-amber-400 rotate-12">
          <polygon points="50,0 60,35 95,25 70,55 90,90 50,75 10,90 30,55 5,25 40,35" fill="currentColor" />
        </svg>
      </div>

      <div className="w-full max-w-md z-10" id="login-card-wrapper">
        {/* Logo Container */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-6"
        >
          <div className="w-16 h-16 rounded-full border-2 border-amber-400 bg-emerald-950 mx-auto flex items-center justify-center shadow-lg mb-3 overflow-hidden">
            <img src="/logo.png" alt="IUJ Reading Club Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl font-bold text-amber-400 tracking-widest font-sans uppercase">
            {t('nav.brandName')}
          </h1>
          <p className="text-xs text-emerald-300 font-serif mt-1 italic">
            &quot;نَادِي القِرَاءَةِ لِلْجَامِعَةِ الإِسْلَامِيَّةِ فِي جِكْجِكَا&quot;
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          className="bg-neutral-900 border border-emerald-800/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative"
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-600 via-amber-400 to-emerald-600 rounded-t-3xl" />

          <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2 tracking-tight">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{t('login.title')}</span>
          </h2>
          <p className="text-xs text-gray-400 mb-6">
            {t('login.subtitle')}
          </p>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 bg-red-950/40 border border-red-500/30 text-red-300 rounded-xl text-xs flex items-center gap-2"
              id="login-error-msg"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-4" id="form-login-view">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400/80" />
                <span>{t('login.email')}</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="abdirizak.dev@gmail.com"
                className="w-full bg-neutral-950 border border-emerald-800/40 hover:border-emerald-500/50 focus:border-amber-400 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all duration-200 shadow-inner"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400/80" />
                <span>{t('login.password')}</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-neutral-950 border border-emerald-800/40 hover:border-emerald-500/50 focus:border-amber-400 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all duration-200 shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 cursor-pointer hover:shadow-amber-500/20 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t('login.submit')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Account access note — no self-registration */}
          <div className="mt-6 pt-5 border-t border-emerald-900/40">
            <div className="flex items-start gap-2 text-[11px] text-gray-400 leading-relaxed">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>
                {t('login.noAccount')}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Footer info under login */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center text-[10px] text-gray-500 mt-6 font-mono"
        >
          &copy; {new Date().getFullYear()} Islamic University of Jigjiga Reading Club.
        </motion.p>

        {onBackToHome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center mt-4"
          >
            <button
              onClick={onBackToHome}
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors font-semibold flex items-center gap-1.5 mx-auto cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Academic Gateway</span>
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
