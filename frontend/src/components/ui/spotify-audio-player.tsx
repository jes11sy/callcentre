'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface SpotifyAudioPlayerProps {
  audioUrl: string;
  onError?: (error: string) => void;
  className?: string;
}

export function SpotifyAudioPlayer({ audioUrl, onError, className = '' }: SpotifyAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setIsLoading(false);
      onError?.('Ошибка загрузки аудио');
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl, onError]);



  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || isLoading) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio || isLoading) return;

    const newTime = (value[0] / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };


  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`flex items-center gap-2 p-2 bg-muted/30 rounded border ${className}`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Play/Pause Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={togglePlayPause}
        disabled={isLoading}
        className="h-7 w-7 p-0 flex-shrink-0"
      >
        {isLoading ? (
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        ) : isPlaying ? (
          <Pause className="h-3 w-3" />
        ) : (
          <Play className="h-3 w-3" />
        )}
      </Button>

      {/* Progress Bar */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <Slider
          value={[progressPercentage]}
          onValueChange={handleSeek}
          max={100}
          step={0.1}
          className="flex-1"
          disabled={isLoading}
        />
        
        {/* Time Display */}
        <div className="text-xs text-muted-foreground font-mono whitespace-nowrap">
          {formatTime(currentTime)}/{formatTime(duration)}
        </div>
      </div>

    </div>
  );
}
