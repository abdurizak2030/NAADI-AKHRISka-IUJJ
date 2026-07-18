'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * A real <audio>-backed player for the "Audio Podcasts" (talks) section:
 * play/pause, draggable seek bar, playback speed, and volume — all wired
 * to an actual HTMLAudioElement instead of a simulated timer.
 */

import React, { useEffect, useRef, useState } from 'react';
import { mediaUrl } from '../lib/api';
import { Play, Pause, Volume2, VolumeX, Gauge, Disc } from 'lucide-react';
import { TalkItem } from '../types';

interface AudioPlayerProps {
  talk: TalkItem;
}

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2];

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AudioPlayer({ talk }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    audio.load();
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
  }, [talk.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onTimeUpdate = () => {
      if (!isScrubbing) setCurrentTime(audio.currentTime);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, [isScrubbing]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play();
    else audio.pause();
  };

  const seekTo = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(Math.max(time, 0), duration || 0);
    setCurrentTime(audio.currentTime);
  };

  const changeVolume = (v: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = v;
    audio.muted = v === 0;
    setVolume(v);
    setMuted(v === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
  };

  const changeSpeed = (rate: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = rate;
    setSpeed(rate);
    setShowSpeedMenu(false);
  };

  if (!talk.audioUrl) {
    return (
      <div className="bg-emerald-950 text-white p-6 rounded-3xl border border-amber-500/20 shadow-xl text-center text-sm text-emerald-200">
        No audio file is attached to this talk yet.
      </div>
    );
  }

  return (
    <div
      className="bg-emerald-950 text-white p-6 rounded-3xl border border-amber-500/20 shadow-xl space-y-4 relative overflow-hidden"
      id="audio-player-bar"
    >
      <audio ref={audioRef} src={mediaUrl(talk.audioUrl)} preload="metadata" crossOrigin="anonymous" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-5 relative z-10">
        <div className="flex items-center space-x-4 text-center sm:text-left">
          <div
            className={`w-12 h-12 rounded-full bg-amber-500 text-emerald-950 flex items-center justify-center font-bold shrink-0 ${
              isPlaying ? 'animate-spin [animation-duration:6s]' : ''
            }`}
          >
            <Disc className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-amber-300 font-sans tracking-tight">{talk.title}</h4>
            <p className="text-xs text-emerald-200 mt-0.5">
              Academic Host: <span className="font-semibold text-white">{talk.speaker}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="w-11 h-11 rounded-full bg-amber-500 text-emerald-950 hover:bg-amber-400 flex items-center justify-center transition-transform active:scale-90 shadow-md"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-emerald-950" /> : <Play className="w-5 h-5 fill-emerald-950 ml-0.5" />}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu((v) => !v)}
              className="flex items-center gap-1 text-emerald-300 hover:text-amber-300 transition-colors text-xs font-bold font-mono"
            >
              <Gauge className="w-4 h-4" />
              {speed}x
            </button>
            {showSpeedMenu && (
              <div className="absolute bottom-8 right-0 bg-emerald-900 border border-emerald-700 rounded-xl overflow-hidden shadow-xl z-20 min-w-[70px]">
                {SPEED_OPTIONS.map((rate) => (
                  <button
                    key={rate}
                    onClick={() => changeSpeed(rate)}
                    className={`block w-full text-left px-3 py-1.5 text-xs font-mono hover:bg-emerald-800 transition-colors ${
                      rate === speed ? 'text-amber-400 font-bold' : 'text-white'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center space-x-2 text-xs text-emerald-300 shrink-0">
            <button onClick={toggleMute} aria-label="Toggle mute">
              {muted || volume === 0 ? <VolumeX className="w-4 h-4 text-amber-500" /> : <Volume2 className="w-4 h-4 text-amber-500" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => changeVolume(Number(e.target.value))}
              className="w-20 h-1 accent-amber-500 cursor-pointer"
              aria-label="Volume"
            />
          </div>
        </div>
      </div>

      {/* Draggable seek bar */}
      <div className="space-y-1 relative z-10 pt-1">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onPointerDown={() => setIsScrubbing(true)}
          onChange={(e) => setCurrentTime(Number(e.target.value))}
          onPointerUp={(e) => {
            setIsScrubbing(false);
            seekTo(Number((e.target as HTMLInputElement).value));
          }}
          className="w-full h-1.5 accent-amber-500 cursor-pointer"
          aria-label="Seek"
        />
        <div className="flex justify-between text-[10px] text-emerald-300 font-mono font-bold uppercase">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration) !== '0:00' ? formatTime(duration) : talk.duration}</span>
        </div>
      </div>
    </div>
  );
}
