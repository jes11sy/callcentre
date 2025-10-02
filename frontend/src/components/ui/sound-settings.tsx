'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { soundManager, playMessageSound } from '@/lib/sound';

export function SoundSettings() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    // Загружаем настройки из localStorage
    const savedEnabled = localStorage.getItem('soundEnabled');
    const savedVolume = localStorage.getItem('soundVolume');
    
    if (savedEnabled !== null) {
      setIsEnabled(savedEnabled === 'true');
      soundManager.setEnabled(savedEnabled === 'true');
    }
    
    if (savedVolume !== null) {
      const vol = parseFloat(savedVolume);
      setVolume(vol);
      soundManager.setVolume(vol);
    }
  }, []);

  const handleToggleSound = (enabled: boolean) => {
    setIsEnabled(enabled);
    soundManager.setEnabled(enabled);
    localStorage.setItem('soundEnabled', enabled.toString());
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0];
    setVolume(vol);
    soundManager.setVolume(vol);
    localStorage.setItem('soundVolume', vol.toString());
  };

  const testSound = () => {
    playMessageSound();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          Настройки звука
        </CardTitle>
        <CardDescription>
          Управление звуковыми уведомлениями
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Включить звук</span>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggleSound}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Громкость</span>
            <span className="text-xs text-gray-500">
              {Math.round(volume * 100)}%
            </span>
          </div>
          <Slider
            value={[volume]}
            onValueChange={handleVolumeChange}
            max={1}
            min={0}
            step={0.1}
            className="w-full"
            disabled={!isEnabled}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Тест звука</span>
          <Button
            variant="outline"
            size="sm"
            onClick={testSound}
            disabled={!isEnabled}
            className="flex items-center gap-2"
          >
            <Volume1 className="h-4 w-4" />
            Воспроизвести
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
