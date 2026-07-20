'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * A real, fully-functional video player. Supports two sources:
 *   - `videoUrl`  -> a native <video> element with a complete custom
 *                    control bar (play/pause, draggable seek bar, playback
 *                    speed, volume, fullscreen, picture-in-picture).
 *   - `youtubeId` -> a YouTube iframe embed. YouTube's own player already
 *                    provides play/pause, seek/drag, speed (gear menu),
 *                    fullscreen and volume; the `allow` attribute below
 *                    additionally enables the browser's native
 *                    picture-in-picture mini-player for the embed.
 *
 * Fully responsive: scales to its container at any viewport width and
 * keeps a 16:9 aspect ratio.
 */

import React, { useEffect, useRef, useState } from 'react';
import { mediaUrl } from '../lib/api';
import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  PictureInPicture2,
  Gauge,
} from 'lucide-react';

interface VideoPlayerProps {
  videoUrl?: string;
  youtubeId?: string;
  title: string;
  posterUrl?: string;
  autoPlay?: boolean;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VideoPlayer({ videoUrl, youtubeId, title, posterUrl, autoPlay }: VideoPlayerProps) {
  // ------------------------------------------------------------------
  // All hooks must run unconditionally on every render (Rules of Hooks),
  // even though they're only actually used by the self-hosted <video>
  // path below — the YouTube path returns early further down.
  // ------------------------------------------------------------------
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => setDuration(video.duration || 0);
    const onTimeUpdate = () => {
      if (!isScrubbing) setCurrentTime(video.currentTime);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    const onEnterPiP = () => setIsPiP(true);
    const onLeavePiP = () => setIsPiP(false);

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    video.addEventListener('enterpictureinpicture', onEnterPiP);
    video.addEventListener('leavepictureinpicture', onLeavePiP);

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('enterpictureinpicture', onEnterPiP);
      video.removeEventListener('leavepictureinpicture', onLeavePiP);
    };
  }, [isScrubbing]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    if (autoPlay && videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch((err) => {
        console.warn('Video autoplay failed:', err);
      });
    }
  }, [autoPlay]);

  // ------------------------------------------------------------------
  // YouTube embed path — native player already covers every requirement.
  // ------------------------------------------------------------------
  if (!videoUrl && youtubeId) {
    return (
      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden" id="youtube-player-wrapper">
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=${autoPlay ? 1 : 0}&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Self-hosted <video> path — full custom control bar.
  // ------------------------------------------------------------------
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  };

  const seekTo = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(Math.max(time, 0), duration || 0);
    setCurrentTime(video.currentTime);
  };

  const handleSeekBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(Number(e.target.value));
  };

  const commitSeek = (e: React.ChangeEvent<HTMLInputElement> | React.PointerEvent<HTMLInputElement>) => {
    setIsScrubbing(false);
    const value = Number((e.target as HTMLInputElement).value);
    seekTo(value);
  };

  const changeVolume = (v: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = v;
    video.muted = v === 0;
    setVolume(v);
    setMuted(v === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  const changeSpeed = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setSpeed(rate);
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await container.requestFullscreen();
    }
  };

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('Picture-in-picture is not available for this video:', err);
    }
  };

  const scheduleHideControls = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (isPlaying) setControlsVisible(false);
    }, 2600);
  };

  const showControls = () => {
    setControlsVisible(true);
    scheduleHideControls();
  };

  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden group select-none"
      id="custom-video-player"
      onMouseMove={showControls}
      onMouseLeave={() => isPlaying && setControlsVisible(false)}
    >
      <video
        ref={videoRef}
        src={mediaUrl(videoUrl)}
        poster={posterUrl}
        autoPlay={autoPlay}
        playsInline
        className="w-full h-full object-contain bg-black cursor-pointer"
        onClick={togglePlay}
      />

      {/* Big center play button when paused */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          aria-label="Play video"
          className="absolute inset-0 flex items-center justify-center bg-black/20"
        >
          <span className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-500 hover:bg-amber-400 text-emerald-950 flex items-center justify-center shadow-lg transition-transform hover:scale-105">
            <Play className="w-8 h-8 sm:w-9 sm:h-9 fill-emerald-950 ml-1.5" />
          </span>
        </button>
      )}

      {/* Control bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 px-3 sm:px-4 pb-3 pt-8 bg-gradient-to-t from-black/85 via-black/40 to-transparent transition-opacity duration-300 ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        id="video-control-bar"
      >
        {/* Seek bar */}
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onPointerDown={() => setIsScrubbing(true)}
          onChange={handleSeekBarChange}
          onPointerUp={commitSeek}
          className="w-full h-1.5 accent-amber-500 cursor-pointer mb-2"
          aria-label="Seek"
        />

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={togglePlay} className="text-white hover:text-amber-400 transition-colors" aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            <span className="text-[11px] sm:text-xs text-gray-200 font-mono whitespace-nowrap">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="hidden sm:flex items-center gap-1.5 group/vol">
              <button onClick={toggleMute} className="text-white hover:text-amber-400 transition-colors" aria-label="Toggle mute">
                <VolumeIcon className="w-4.5 h-4.5" />
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(e) => changeVolume(Number(e.target.value))}
                className="w-16 sm:w-20 h-1 accent-amber-500 cursor-pointer"
                aria-label="Volume"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu((v) => !v)}
                className="flex items-center gap-1 text-white hover:text-amber-400 transition-colors text-xs font-bold font-mono"
                aria-label="Playback speed"
              >
                <Gauge className="w-4 h-4" />
                {speed}x
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-8 right-0 bg-emerald-950 border border-emerald-800 rounded-xl overflow-hidden shadow-xl z-20 min-w-[70px]">
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

            {document.pictureInPictureEnabled && (
              <button onClick={togglePiP} className={`text-white hover:text-amber-400 transition-colors ${isPiP ? 'text-amber-400' : ''}`} aria-label="Picture in picture">
                <PictureInPicture2 className="w-4.5 h-4.5" />
              </button>
            )}

            <button onClick={toggleFullscreen} className="text-white hover:text-amber-400 transition-colors" aria-label="Fullscreen">
              {isFullscreen ? <Minimize className="w-4.5 h-4.5" /> : <Maximize className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
