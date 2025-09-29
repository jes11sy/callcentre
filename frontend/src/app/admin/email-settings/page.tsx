'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Server, 
  Shield, 
  Clock, 
  TestTube, 
  Save, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  AlertTriangle,
  Loader2,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Схема валидации
const emailSettingsSchema = z.object({
  host: z.string().min(1, 'Host обязателен'),
  port: z.number().min(1).max(65535, 'Порт должен быть от 1 до 65535'),
  secure: z.boolean(),
  user: z.string().min(1, 'Пользователь обязателен'),
  password: z.string().min(1, 'Пароль обязателен'),
  mangoEmail: z.string().email('Некорректный email адрес'),
  checkInterval: z.number().min(1).max(1440, 'Интервал должен быть от 1 до 1440 минут'),
  enabled: z.boolean()
});

type EmailSettingsFormData = z.infer<typeof emailSettingsSchema>;

interface EmailSettings extends EmailSettingsFormData {
  password?: string; // Может быть скрыт
}

interface MonitoringStats {
  lastCheck: string;
  totalProcessed: number;
  successRate: number;
  nextCheck: string;
}

export default function EmailSettingsPage() {
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<EmailSettingsFormData>({
    resolver: zodResolver(emailSettingsSchema)
  });

  const enabled = watch('enabled');

  // Загрузка настроек
  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/email-settings/settings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setSettings(result.data);
        // Заполняем форму
        Object.keys(result.data).forEach(key => {
          setValue(key as keyof EmailSettingsFormData, result.data[key]);
        });
      } else {
        toast.error('Ошибка при загрузке настроек');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Ошибка при загрузке настроек');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка статистики
  const loadStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/email-settings/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  useEffect(() => {
    loadSettings();
    loadStats();
  }, []);

  // Сохранение настроек
  const onSubmit = async (data: EmailSettingsFormData) => {
    try {
      setSaving(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/email-settings/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Настройки почты сохранены');
        setSettings(result.data);
      } else {
        toast.error(result.message || 'Ошибка при сохранении настроек');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Ошибка при сохранении настроек');
    } finally {
      setSaving(false);
    }
  };

  // Тестирование подключения
  const testConnection = async () => {
    const formData = watch();
    
    try {
      setTesting(true);
      setTestResult(null);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/email-settings/test-connection`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          host: formData.host,
          port: formData.port,
          secure: formData.secure,
          user: formData.user,
          password: formData.password
        })
      });

      const result = await response.json();
      setTestResult(result);
      
      if (result.success) {
        toast.success('Подключение к почте успешно');
      } else {
        toast.error(result.message || 'Ошибка подключения к почте');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setTestResult({
        success: false,
        message: 'Ошибка при тестировании подключения'
      });
      toast.error('Ошибка при тестировании подключения');
    } finally {
      setTesting(false);
    }
  };

  // Ручная проверка почты
  const triggerEmailCheck = async () => {
    try {
      setChecking(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/email-settings/check-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Проверка завершена. Обработано писем: ${result.processedCount}`);
        loadStats(); // Обновляем статистику
      } else {
        toast.error(result.message || 'Ошибка при проверке почты');
      }
    } catch (error) {
      console.error('Error checking email:', error);
      toast.error('Ошибка при проверке почты');
    } finally {
      setChecking(false);
    }
  };

  // Очистка дублированных записей
  const cleanupDuplicates = async () => {
    try {
      setChecking(true);
      const response = await fetch('/api/recordings/cleanup-duplicates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Очистка завершена. Удалено дубликатов: ${result.cleanedCount}`);
        loadStats(); // Обновляем статистику
      } else {
        toast.error(result.message || 'Ошибка при очистке дубликатов');
      }
    } catch (error) {
      console.error('Error cleaning up duplicates:', error);
      toast.error('Ошибка при очистке дубликатов');
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Загрузка настроек...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Заголовок */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Settings className="h-8 w-8 text-blue-600" />
              Настройки почты
            </h1>
            <p className="text-gray-600 mt-2">
              Управление настройками мониторинга почты для автоматической загрузки записей звонков
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Основные настройки */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Настройки подключения
                </CardTitle>
                <CardDescription>
                  Конфигурация IMAP подключения для мониторинга почты
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Включить/выключить мониторинг */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <Label htmlFor="enabled" className="text-base font-medium">
                        Включить мониторинг почты
                      </Label>
                      <p className="text-sm text-gray-600">
                        Автоматическая проверка почты на новые записи звонков
                      </p>
                    </div>
                    <Switch
                      id="enabled"
                      checked={enabled}
                      onCheckedChange={(checked) => setValue('enabled', checked)}
                    />
                  </div>

                  {/* Настройки сервера */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="host">IMAP Host</Label>
                      <Input
                        id="host"
                        {...register('host')}
                        placeholder="imap.gmail.com"
                        className={errors.host ? 'border-red-500' : ''}
                      />
                      {errors.host && (
                        <p className="text-sm text-red-500 mt-1">{errors.host.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="port">Порт</Label>
                      <Input
                        id="port"
                        type="number"
                        {...register('port', { valueAsNumber: true })}
                        placeholder="993"
                        className={errors.port ? 'border-red-500' : ''}
                      />
                      {errors.port && (
                        <p className="text-sm text-red-500 mt-1">{errors.port.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Безопасность */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="secure"
                      checked={watch('secure')}
                      onCheckedChange={(checked) => setValue('secure', checked)}
                    />
                    <Label htmlFor="secure">Использовать SSL/TLS</Label>
                  </div>

                  {/* Учетные данные */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="user">Email пользователь</Label>
                      <Input
                        id="user"
                        {...register('user')}
                        placeholder="your-email@gmail.com"
                        className={errors.user ? 'border-red-500' : ''}
                      />
                      {errors.user && (
                        <p className="text-sm text-red-500 mt-1">{errors.user.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="password">Пароль</Label>
                      <Input
                        id="password"
                        type="password"
                        {...register('password')}
                        placeholder="••••••••"
                        className={errors.password ? 'border-red-500' : ''}
                      />
                      {errors.password && (
                        <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Email Mango */}
                  <div>
                    <Label htmlFor="mangoEmail">Email отправителя (Mango)</Label>
                    <Input
                      id="mangoEmail"
                      {...register('mangoEmail')}
                      placeholder="mango@example.com"
                      className={errors.mangoEmail ? 'border-red-500' : ''}
                    />
                    {errors.mangoEmail && (
                      <p className="text-sm text-red-500 mt-1">{errors.mangoEmail.message}</p>
                    )}
                  </div>

                  {/* Интервал проверки */}
                  <div>
                    <Label htmlFor="checkInterval">Интервал проверки (минуты)</Label>
                    <Input
                      id="checkInterval"
                      type="number"
                      {...register('checkInterval', { valueAsNumber: true })}
                      placeholder="5"
                      className={errors.checkInterval ? 'border-red-500' : ''}
                    />
                    {errors.checkInterval && (
                      <p className="text-sm text-red-500 mt-1">{errors.checkInterval.message}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      Рекомендуется: 5-15 минут
                    </p>
                  </div>

                  {/* Кнопки */}
                  <div className="flex items-center gap-4 pt-4">
                    <Button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {saving ? 'Сохранение...' : 'Сохранить настройки'}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={testConnection}
                      disabled={testing}
                      className="flex items-center gap-2"
                    >
                      {testing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <TestTube className="h-4 w-4" />
                      )}
                      {testing ? 'Тестирование...' : 'Тестировать подключение'}
                    </Button>
                  </div>

                  {/* Результат тестирования */}
                  {testResult && (
                    <div className={`p-4 rounded-lg flex items-center gap-2 ${
                      testResult.success 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      {testResult.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                        {testResult.message}
                      </span>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Статистика и управление */}
          <div className="space-y-6">
            {/* Статистика мониторинга */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Статистика мониторинга
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Всего звонков:</span>
                      <Badge variant="outline">{stats.totalCalls}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">С записями:</span>
                      <Badge variant="default">{stats.callsWithRecordings}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Обработано за 24ч:</span>
                      <Badge variant="secondary">{stats.recentProcessed}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Успешность:</span>
                      <Badge variant={stats.successRate >= 50 ? 'default' : 'destructive'}>
                        {stats.successRate}%
                      </Badge>
                    </div>
                    {stats.lastProcessed && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Последняя обработка:</span>
                        <span className="text-sm font-medium">
                          {new Date(stats.lastProcessed).toLocaleString('ru-RU')}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Следующая проверка:</span>
                      <span className="text-sm font-medium">
                        {new Date(stats.nextCheck).toLocaleString('ru-RU')}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-500">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>Статистика недоступна</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Управление */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Управление
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={triggerEmailCheck}
                  disabled={checking}
                  className="w-full flex items-center gap-2"
                >
                  {checking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {checking ? 'Проверка...' : 'Проверить почту сейчас'}
                </Button>

                <Button
                  onClick={loadStats}
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Обновить статистику
                </Button>

                <Button
                  onClick={cleanupDuplicates}
                  disabled={checking}
                  variant="destructive"
                  className="w-full flex items-center gap-2"
                >
                  {checking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  {checking ? 'Очистка...' : 'Очистить дубликаты'}
                </Button>
              </CardContent>
            </Card>

            {/* Информация */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Информация
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <p>
                  <strong>Gmail:</strong> Используйте пароль приложения вместо обычного пароля
                </p>
                <p>
                  <strong>Безопасность:</strong> Пароли хранятся в зашифрованном виде
                </p>
                <p>
                  <strong>Поддержка:</strong> IMAP, POP3, Exchange
                </p>
                <p>
                  <strong>Форматы:</strong> MP3, WAV, M4A, AAC
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
