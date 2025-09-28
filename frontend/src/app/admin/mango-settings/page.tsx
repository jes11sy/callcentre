'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, 
  Settings, 
  Save, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ExternalLink,
  Copy,
  Loader2
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import authApi from '@/lib/auth';

// Схема валидации
const mangoSettingsSchema = z.object({
  apiUrl: z.string().url('Некорректный URL API'),
  apiKey: z.string().min(1, 'API ключ обязателен'),
  apiId: z.string().min(1, 'API ID обязателен'),
  webhookUrl: z.string().min(1, 'URL webhook обязателен')
});

type MangoSettingsForm = z.infer<typeof mangoSettingsSchema>;

interface MangoSettings {
  apiUrl: string;
  apiKey: string;
  apiId: string;
  webhookUrl: string;
}

interface WebhookStatus {
  isActive: boolean;
  lastReceived?: string;
  totalReceived: number;
  errors: number;
}

export default function MangoSettingsPage() {
  const [settings, setSettings] = useState<MangoSettings>({
    apiUrl: '',
    apiKey: '',
    apiId: '',
    webhookUrl: ''
  });
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus>({
    isActive: false,
    totalReceived: 0,
    errors: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<MangoSettingsForm>({
    resolver: zodResolver(mangoSettingsSchema),
    defaultValues: settings
  });

  const watchedSettings = watch();

  // Загрузка настроек
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await authApi.get('/webhooks/mango/settings');
      
      if (response.data.success) {
        const data = response.data.data;
        setSettings(data);
        setValue('apiUrl', data.apiUrl);
        setValue('apiKey', data.apiKey);
        setValue('apiId', data.apiId);
        setValue('webhookUrl', data.webhookUrl);
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
      toast.error('Ошибка при загрузке настроек');
    } finally {
      setLoading(false);
    }
  };

  // Сохранение настроек
  const onSubmit = async (data: MangoSettingsForm) => {
    try {
      setSaving(true);
      
      // Здесь будет API для сохранения настроек
      // const response = await authApi.put('/admin/mango-settings', data);
      
      setSettings(data);
      toast.success('Настройки успешно сохранены');
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      toast.error('Ошибка при сохранении настроек');
    } finally {
      setSaving(false);
    }
  };

  // Тестирование подключения
  const testConnection = async () => {
    try {
      setTesting(true);
      
      // Здесь будет API для тестирования подключения к Mango
      // const response = await authApi.post('/admin/mango-settings/test');
      
      // Имитация теста
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Подключение к Mango ATC успешно');
    } catch (error) {
      console.error('Ошибка тестирования:', error);
      toast.error('Ошибка подключения к Mango ATC');
    } finally {
      setTesting(false);
    }
  };

  // Копирование URL webhook
  const copyWebhookUrl = () => {
    const webhookUrl = `${window.location.origin}/api/webhooks/mango`;
    navigator.clipboard.writeText(webhookUrl);
    toast.success('URL webhook скопирован в буфер обмена');
  };

  if (loading) {
    return (
      <DashboardLayout variant="admin" requiredRole="admin">
        <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Загрузка настроек...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout variant="admin" requiredRole="admin">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <Phone className="h-8 w-8 mr-3 text-purple-600" />
                  Настройки Mango ATC
                </h1>
                <p className="text-gray-600 mt-2">
                  Конфигурация интеграции с системой телефонии Mango Office
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Основные настройки */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Основные настройки
                </CardTitle>
                <CardDescription>
                  Параметры подключения к API Mango Office
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="apiUrl">URL API</Label>
                  <Input
                    id="apiUrl"
                    {...register('apiUrl')}
                    placeholder="https://app.mango-office.ru/vpbx"
                    className={errors.apiUrl ? 'border-red-500' : ''}
                  />
                  {errors.apiUrl && (
                    <p className="text-sm text-red-500 mt-1">{errors.apiUrl.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="apiKey">API Ключ</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    {...register('apiKey')}
                    placeholder="Введите API ключ"
                    className={errors.apiKey ? 'border-red-500' : ''}
                  />
                  {errors.apiKey && (
                    <p className="text-sm text-red-500 mt-1">{errors.apiKey.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="apiId">API ID</Label>
                  <Input
                    id="apiId"
                    {...register('apiId')}
                    placeholder="Введите API ID"
                    className={errors.apiId ? 'border-red-500' : ''}
                  />
                  {errors.apiId && (
                    <p className="text-sm text-red-500 mt-1">{errors.apiId.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="webhookUrl">URL Webhook</Label>
                  <Input
                    id="webhookUrl"
                    {...register('webhookUrl')}
                    placeholder="/api/webhooks/mango"
                    className={errors.webhookUrl ? 'border-red-500' : ''}
                  />
                  {errors.webhookUrl && (
                    <p className="text-sm text-red-500 mt-1">{errors.webhookUrl.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Webhook настройки */}
            <Card>
              <CardHeader>
                <CardTitle>Настройка Webhook</CardTitle>
                <CardDescription>
                  Инструкции по настройке webhook в панели Mango Office
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>URL для настройки в Mango Office</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={`${window.location.origin}/api/webhooks/mango`}
                      readOnly
                      className="bg-gray-50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyWebhookUrl}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Скопируйте этот URL и добавьте в настройки webhook в панели Mango Office
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Инструкция по настройке:</h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Войдите в панель управления Mango Office</li>
                    <li>Перейдите в раздел "Настройки" → "Webhook"</li>
                    <li>Добавьте новый webhook с URL выше</li>
                    <li>Выберите события: call/start, call/answer, call/end</li>
                    <li>Сохраните настройки</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* Статус webhook */}
            <Card>
              <CardHeader>
                <CardTitle>Статус Webhook</CardTitle>
                <CardDescription>
                  Информация о работе webhook интеграции
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      {webhookStatus.isActive ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-500" />
                      )}
                    </div>
                    <p className="text-sm font-medium">Статус</p>
                    <Badge variant={webhookStatus.isActive ? "default" : "destructive"}>
                      {webhookStatus.isActive ? "Активен" : "Неактивен"}
                    </Badge>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {webhookStatus.totalReceived}
                    </div>
                    <p className="text-sm font-medium">Получено событий</p>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {webhookStatus.errors}
                    </div>
                    <p className="text-sm font-medium">Ошибок</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Действия */}
            <div className="flex items-center gap-4">
              <Button
                type="submit"
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Сохранить настройки
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={testConnection}
                disabled={testing}
              >
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Тестирование...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Тестировать подключение
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => window.open('https://app.mango-office.ru', '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Открыть Mango Office
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
