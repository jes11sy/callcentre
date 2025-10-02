// Утилиты для воспроизведения звуков

class SoundManager {
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;
  private volume: number = 0.5;

  constructor() {
    // Проверяем, поддерживает ли браузер Web Audio API
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  // Включаем/выключаем звук
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  // Устанавливаем громкость (0-1)
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  // Воспроизводим звук уведомления
  playNotificationSound() {
    if (!this.isEnabled || !this.audioContext) return;

    try {
      // Создаем простой звук уведомления
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Настраиваем звук
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime + 0.2);

      // Настраиваем громкость
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

      // Воспроизводим
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('Не удалось воспроизвести звук уведомления:', error);
    }
  }

  // Воспроизводим звук нового сообщения
  playMessageSound() {
    if (!this.isEnabled || !this.audioContext) return;

    try {
      // Создаем более мягкий звук для сообщений
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Настраиваем звук (более мягкий)
      oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime + 0.05);
      oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime + 0.1);

      // Настраиваем громкость
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.7, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

      // Воспроизводим
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.2);
    } catch (error) {
      console.warn('Не удалось воспроизвести звук сообщения:', error);
    }
  }

  // Воспроизводим звук ошибки
  playErrorSound() {
    if (!this.isEnabled || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Настраиваем звук ошибки (низкий тон)
      oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
      oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime + 0.2);

      // Настраиваем громкость
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.8, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

      // Воспроизводим
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('Не удалось воспроизвести звук ошибки:', error);
    }
  }
}

// Создаем единственный экземпляр
export const soundManager = new SoundManager();

// Экспортируем функции для удобства
export const playNotificationSound = () => soundManager.playNotificationSound();
export const playMessageSound = () => soundManager.playMessageSound();
export const playErrorSound = () => soundManager.playErrorSound();
export const setSoundEnabled = (enabled: boolean) => soundManager.setEnabled(enabled);
export const setSoundVolume = (volume: number) => soundManager.setVolume(volume);
