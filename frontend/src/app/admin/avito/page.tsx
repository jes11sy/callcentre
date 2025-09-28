'use client';

import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  MessageSquare,
  Shield,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle,
  TrendingUp,
  Users,
  Activity,
  BarChart3,
  Globe,
  Clock,
  MessageCircle,
  Target,
  Star,
  ThumbsUp
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import authApi from '@/lib/auth';
import { toast } from 'sonner';

interface AvitoAccount {
  id: number;
  name: string;
  clientId: string;
  clientSecret?: string;
  userId?: string;
  proxyType?: string;
  proxyHost?: string;
  proxyPort?: number;
  proxyLogin?: string;
  proxyPassword?: string;
  connectionStatus?: string;
  proxyStatus?: string;
  accountBalance?: number;
  adsCount?: number;
  viewsCount?: number;
  contactsCount?: number;
  viewsToday?: number;
  contactsToday?: number;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    orders: number;
    calls: number;
  };
}

// Zod schemas for validation
const createAvitoSchema = z.object({
  name: z.string().min(2, 'Название должно содержать минимум 2 символа'),
  clientId: z.string().min(1, 'Client ID обязателен'),
  clientSecret: z.string().min(1, 'Client Secret обязателен'),
  userId: z.string().optional(),
  proxyType: z.enum(['http', 'socks4', 'socks5']).optional(),
  proxyHost: z.string().optional(),
  proxyPort: z.string().optional(),
  proxyLogin: z.string().optional(),
  proxyPassword: z.string().optional(),
});

const editAvitoSchema = z.object({
  name: z.string().min(2, 'Название должно содержать минимум 2 символа'),
  clientId: z.string().min(1, 'Client ID обязателен'),
  clientSecret: z.string().min(1, 'Client Secret обязателен'),
  userId: z.string().optional(),
  proxyType: z.enum(['http', 'socks4', 'socks5']).optional(),
  proxyHost: z.string().optional(),
  proxyPort: z.string().optional(),
  proxyLogin: z.string().optional(),
  proxyPassword: z.string().optional(),
});

type CreateAvitoFormData = z.infer<typeof createAvitoSchema>;
type EditAvitoFormData = z.infer<typeof editAvitoSchema>;

export default function AdminAvitoPage() {
  const [accounts, setAccounts] = useState<AvitoAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AvitoAccount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [showProxyPassword, setShowProxyPassword] = useState(false);
  const [testingConnection, setTestingConnection] = useState<number | null>(null);
  const [syncingAccount, setSyncingAccount] = useState<number | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [testingProxy, setTestingProxy] = useState(false);
  const [isProxyCheckModalOpen, setIsProxyCheckModalOpen] = useState(false);
  const [proxyCheckResults, setProxyCheckResults] = useState<{[key: number]: string}>({});
  const [checkingProxyIds, setCheckingProxyIds] = useState<Set<number>>(new Set());
  const [showProxyPasswords, setShowProxyPasswords] = useState<Set<number>>(new Set());
  const [proxyAccounts, setProxyAccounts] = useState<AvitoAccount[]>([]);
  const [loadingProxyData, setLoadingProxyData] = useState(false);
  const [isEternalOnlineModalOpen, setIsEternalOnlineModalOpen] = useState(false);
  const [onlineStatuses, setOnlineStatuses] = useState<{[key: number]: boolean}>({});
  const [eternalOnlineSettings, setEternalOnlineSettings] = useState<{[key: number]: boolean}>({});
  const [updatingOnlineStatus, setUpdatingOnlineStatus] = useState<Set<number>>(new Set());
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const [ratingsInfo, setRatingsInfo] = useState<any[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [selectedAccountReviews, setSelectedAccountReviews] = useState<any>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [showAllReviews, setShowAllReviews] = useState<{[key: number]: boolean}>({});

  const createForm = useForm<CreateAvitoFormData>({
    resolver: zodResolver(createAvitoSchema),
    defaultValues: {
      name: '',
      clientId: '',
      clientSecret: '',
      proxyType: undefined,
      proxyHost: '',
      proxyPort: '',
      proxyLogin: '',
      proxyPassword: '',
    },
  });

  const editForm = useForm<EditAvitoFormData>({
    resolver: zodResolver(editAvitoSchema),
    defaultValues: {
      name: '',
      clientId: '',
      clientSecret: '',
      proxyType: undefined,
      proxyHost: '',
      proxyPort: '',
      proxyLogin: '',
      proxyPassword: '',
    },
  });

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await authApi.get('/avito');
      setAccounts(response.data.data || response.data.accounts || []);
    } catch (error: any) {
      console.error('Failed to fetch Avito accounts:', error);
      toast.error('Ошибка загрузки аккаунтов', {
        description: error.response?.data?.error?.message || 'Произошла ошибка при загрузке списка аккаунтов.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const filteredAccounts = useMemo(() => {
    if (!accounts || !Array.isArray(accounts)) {
      return [];
    }
    return accounts.filter(account =>
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.clientId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [accounts, searchTerm]);

  const handleCreateAccount = async (data: CreateAvitoFormData) => {
    setIsSubmitting(true);
    try {
      await authApi.post('/avito', data);
      toast.success('Аккаунт Avito успешно добавлен', {
        description: `${data.name} добавлен в систему`
      });
      setIsCreateModalOpen(false);
      createForm.reset();
      fetchAccounts();
    } catch (error: any) {
      console.error('Failed to create Avito account:', error);
      toast.error('Ошибка добавления аккаунта', {
        description: error.response?.data?.error?.message || 'Произошла ошибка при добавлении аккаунта.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAccount = async (data: EditAvitoFormData) => {
    if (!selectedAccount) return;
    setIsSubmitting(true);
    try {
      await authApi.put(`/avito/${selectedAccount.id}`, data);
      toast.success('Аккаунт Avito успешно обновлен', {
        description: `${data.name} обновлен в системе`
      });
      setIsEditModalOpen(false);
      editForm.reset();
      fetchAccounts();
    } catch (error: any) {
      console.error('Failed to update Avito account:', error);
      toast.error('Ошибка обновления аккаунта', {
        description: error.response?.data?.error?.message || 'Произошла ошибка при обновлении аккаунта.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;
    setIsSubmitting(true);
    try {
      await authApi.delete(`/avito/${selectedAccount.id}`);
      toast.success('Аккаунт Avito успешно удален');
      setIsDeleteModalOpen(false);
      fetchAccounts();
    } catch (error: any) {
      console.error('Failed to delete Avito account:', error);
      toast.error('Ошибка удаления аккаунта', {
        description: error.response?.data?.error?.message || 'Произошла ошибка при удалении аккаунта.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = async (account: AvitoAccount) => {
    setSelectedAccount(account);
    // Fetch full account details including secrets
    try {
      const response = await authApi.get(`/avito/${account.id}`);
      const fullAccount = response.data.account;
      editForm.reset({
        name: fullAccount.name,
        clientId: fullAccount.clientId,
        clientSecret: fullAccount.clientSecret,
        userId: fullAccount.userId || '',
        proxyType: fullAccount.proxyType || undefined,
        proxyHost: fullAccount.proxyHost || '',
        proxyPort: fullAccount.proxyPort ? String(fullAccount.proxyPort) : '',
        proxyLogin: fullAccount.proxyLogin || '',
        proxyPassword: fullAccount.proxyPassword || '',
      });
      setIsEditModalOpen(true);
    } catch (error) {
      toast.error('Ошибка загрузки данных аккаунта');
    }
  };

  const openDeleteModal = (account: AvitoAccount) => {
    setSelectedAccount(account);
    setIsDeleteModalOpen(true);
  };

  const handleTestConnection = async (account: AvitoAccount) => {
    setTestingConnection(account.id);
    try {
      const response = await authApi.post(`/avito/${account.id}/test`);
      const result = response.data.result;
      
      if (result.success) {
        toast.success('Тест подключения успешен', {
          description: result.message
        });
      } else {
        toast.error('Ошибка подключения', {
          description: result.message
        });
      }
      
      fetchAccounts(); // Refresh the list to show updated status
    } catch (error: any) {
      console.error('Failed to test connection:', error);
      toast.error('Ошибка тестирования', {
        description: error.response?.data?.error?.message || 'Произошла ошибка при тестировании подключения.',
      });
    } finally {
      setTestingConnection(null);
    }
  };

  const handleSyncAccount = async (account: AvitoAccount) => {
    setSyncingAccount(account.id);
    try {
      await authApi.post(`/avito/${account.id}/sync`);
      toast.success('Данные аккаунта синхронизированы', {
        description: `${account.name} обновлен`
      });
      fetchAccounts(); // Refresh the list to show updated data
    } catch (error: any) {
      console.error('Failed to sync account:', error);
      toast.error('Ошибка синхронизации', {
        description: error.response?.data?.error?.message || 'Произошла ошибка при синхронизации данных.',
      });
    } finally {
      setSyncingAccount(null);
    }
  };

  const handleSyncAllAccounts = async () => {
    setSyncingAll(true);
    try {
      const response = await authApi.post('/avito/sync-all');
      const summary = response.data.summary;
      
      toast.success('Массовая синхронизация завершена', {
        description: `Успешно: ${summary.successful}, Ошибок: ${summary.failed}`
      });
      
      fetchAccounts(); // Refresh the list to show updated data
    } catch (error: any) {
      console.error('Failed to sync all accounts:', error);
      toast.error('Ошибка массовой синхронизации', {
        description: error.response?.data?.error?.message || 'Произошла ошибка при синхронизации всех аккаунтов.',
      });
    } finally {
      setSyncingAll(false);
    }
  };

  const handleTestProxy = async () => {
    const formData = editForm.getValues();
    
    // Проверяем, что заполнены обязательные поля прокси
    if (!formData.proxyHost || !formData.proxyPort || !formData.proxyType) {
      toast.error('Заполните обязательные поля прокси', {
        description: 'Хост, порт и тип прокси обязательны для проверки'
      });
      return;
    }

    setTestingProxy(true);
    try {
      // Создаем временный объект аккаунта для тестирования
      const testAccount = {
        id: selectedAccount?.id || 0,
        name: formData.name || 'Test Account',
        clientId: formData.clientId || 'test',
        clientSecret: formData.clientSecret || 'test',
        proxyType: formData.proxyType,
        proxyHost: formData.proxyHost,
        proxyPort: parseInt(formData.proxyPort),
        proxyLogin: formData.proxyLogin,
        proxyPassword: formData.proxyPassword,
      };

      // Отправляем запрос на тестирование прокси
      const response = await authApi.post('/avito/test-proxy', {
        proxyType: formData.proxyType,
        proxyHost: formData.proxyHost,
        proxyPort: parseInt(formData.proxyPort),
        proxyLogin: formData.proxyLogin,
        proxyPassword: formData.proxyPassword,
      });

      if (response.data.success) {
        toast.success('Прокси работает', {
          description: response.data.message
        });
      } else {
        toast.error('Прокси не работает', {
          description: response.data.message
        });
      }
    } catch (error: any) {
      console.error('Failed to test proxy:', error);
      toast.error('Ошибка тестирования прокси', {
        description: error.response?.data?.error?.message || 'Произошла ошибка при тестировании прокси.',
      });
    } finally {
      setTestingProxy(false);
    }
  };

  const handleCheckSingleProxy = async (account: AvitoAccount) => {
    if (!account.proxyHost) {
      setProxyCheckResults(prev => ({
        ...prev,
        [account.id]: 'Прокси не настроен'
      }));
      return;
    }

    setCheckingProxyIds(prev => new Set(prev).add(account.id));
    
    try {
      const response = await authApi.post('/avito/test-proxy', {
        proxyType: account.proxyType,
        proxyHost: account.proxyHost,
        proxyPort: account.proxyPort,
        proxyLogin: account.proxyLogin,
        proxyPassword: account.proxyPassword,
      });

      setProxyCheckResults(prev => ({
        ...prev,
        [account.id]: response.data.success ? '✅ Работает' : `❌ ${response.data.message}`
      }));
    } catch (error: any) {
      let errorMessage = 'Неизвестная ошибка';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Дополнительная информация для диагностики
      if (errorMessage.toLowerCase().includes('auth')) {
        errorMessage += ` (Проверьте логин: ${account.proxyLogin})`;
      }
      
      setProxyCheckResults(prev => ({
        ...prev,
        [account.id]: `❌ ${errorMessage}`
      }));
    } finally {
      setCheckingProxyIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(account.id);
        return newSet;
      });
    }
  };

  const loadProxyData = async () => {
    setLoadingProxyData(true);
    try {
      const response = await authApi.get('/avito/proxy-data');
      setProxyAccounts(response.data.accounts);
    } catch (error: any) {
      console.error('Failed to load proxy data:', error);
      toast.error('Ошибка загрузки данных прокси', {
        description: error.response?.data?.error?.message || 'Произошла ошибка при загрузке данных прокси.',
      });
    } finally {
      setLoadingProxyData(false);
    }
  };

  // ===== ФУНКЦИИ ДЛЯ РАБОТЫ С ОТЗЫВАМИ =====

  const loadRatingsInfo = async () => {
    setLoadingRatings(true);
    try {
      const response = await authApi.get('/avito/ratings');
      setRatingsInfo(response.data.ratings || []);
    } catch (error: any) {
      console.error('Failed to load ratings info:', error);
      toast.error('Ошибка загрузки данных рейтингов', {
        description: error.response?.data?.error?.message || 'Произошла ошибка при загрузке рейтингов.',
      });
    } finally {
      setLoadingRatings(false);
    }
  };

  const loadAccountReviews = async (accountId: number) => {
    setLoadingReviews(true);
    try {
      const response = await authApi.get(`/avito/${accountId}/reviews?offset=0&limit=50`);
      setSelectedAccountReviews(response.data);
      setReviews(response.data.reviews?.reviews || []);
    } catch (error: any) {
      console.error('Failed to load reviews:', error);
      toast.error('Ошибка загрузки отзывов', {
        description: error.response?.data?.error?.message || 'Произошла ошибка при загрузке отзывов.',
      });
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleOpenReviewsModal = async () => {
    setIsReviewsModalOpen(true);
    await loadRatingsInfo();
  };

  const handleViewAccountReviews = async (accountId: number) => {
    await loadAccountReviews(accountId);
    setShowAllReviews(prev => ({ ...prev, [accountId]: true }));
  };

  const handleOpenProxyCheckModal = async () => {
    setIsProxyCheckModalOpen(true);
    await loadProxyData();
  };

  const loadOnlineStatuses = async () => {
    try {
      // Загружаем текущие статусы онлайн и настройки вечного онлайна
      const response = await authApi.get('/avito/online-statuses');
      setOnlineStatuses(response.data.onlineStatuses || {});
      setEternalOnlineSettings(response.data.eternalOnlineSettings || {});
    } catch (error: any) {
      console.error('Failed to load online statuses:', error);
      // Инициализируем пустыми объектами если нет данных
      const initialStatuses: {[key: number]: boolean} = {};
      const initialSettings: {[key: number]: boolean} = {};
      accounts.forEach(account => {
        initialStatuses[account.id] = false; // По умолчанию оффлайн
        initialSettings[account.id] = false; // По умолчанию выключен
      });
      setOnlineStatuses(initialStatuses);
      setEternalOnlineSettings(initialSettings);
    }
  };

  const handleToggleEternalOnline = async (accountId: number, enabled: boolean) => {
    setUpdatingOnlineStatus(prev => new Set(prev).add(accountId));
    
    try {
      const response = await authApi.post(`/avito/${accountId}/eternal-online`, {
        enabled
      });
      
      setEternalOnlineSettings(prev => ({
        ...prev,
        [accountId]: enabled
      }));
      
      // Если включаем вечный онлайн, сразу ставим статус онлайн
      if (enabled) {
        setOnlineStatuses(prev => ({
          ...prev,
          [accountId]: true
        }));
      }
      
      toast.success(enabled ? 'Вечный онлайн включен' : 'Вечный онлайн выключен', {
        description: `Аккаунт будет ${enabled ? 'всегда онлайн' : 'управляться вручную'}`
      });
    } catch (error: any) {
      console.error('Failed to toggle eternal online:', error);
      toast.error('Ошибка изменения настройки', {
        description: error.response?.data?.error?.message || 'Произошла ошибка при изменении настройки вечного онлайна.',
      });
    } finally {
      setUpdatingOnlineStatus(prev => {
        const newSet = new Set(prev);
        newSet.delete(accountId);
        return newSet;
      });
    }
  };

  const handleOpenEternalOnlineModal = async () => {
    setIsEternalOnlineModalOpen(true);
    await loadOnlineStatuses();
  };

  const getConnectionStatusBadge = (status?: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="text-xs bg-green-500">Подключен</Badge>;
      case 'disconnected':
        return <Badge variant="destructive" className="text-xs">Отключен</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Не проверен</Badge>;
    }
  };

  const getProxyStatusBadge = (account: AvitoAccount) => {
    if (!account.proxyHost) {
      return <Badge variant="outline" className="text-xs">Без прокси</Badge>;
    }

    switch (account.proxyStatus) {
      case 'working':
        return <Badge variant="default" className="text-xs bg-green-500">Работает</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="text-xs">Ошибка</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Не проверен</Badge>;
    }
  };

  const formatBalance = (balance?: number) => {
    if (balance === null || balance === undefined) return '—';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(balance);
  };

  const formatNumber = (num?: number) => {
    if (num === null || num === undefined) return '—';
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  const formatNumberWithToday = (total?: number, today?: number) => {
    if (total === null || total === undefined) return '—';
    const totalFormatted = new Intl.NumberFormat('ru-RU').format(total);
    
    if (today && today > 0) {
      const todayFormatted = new Intl.NumberFormat('ru-RU').format(today);
      return `${totalFormatted} (+${todayFormatted} сегодня)`;
    }
    
    return totalFormatted;
  };

  const totalAccounts = accounts?.length || 0;
  const connectedAccounts = accounts?.filter(acc => acc.connectionStatus === 'connected').length || 0;
  const totalBalance = accounts?.reduce((sum, acc) => sum + (acc.accountBalance || 0), 0) || 0;
  const totalAds = accounts?.reduce((sum, acc) => sum + (acc.adsCount || 0), 0) || 0;

  return (
    <DashboardLayout variant="admin" requiredRole="admin">
      <div className="container mx-auto py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Управление Avito</h1>
            <p className="text-gray-600 mt-1">Управление аккаунтами и интеграцией с Avito API</p>
          </div>
            
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => createForm.reset()}>
                <Plus className="mr-2 h-4 w-4" /> 
                Добавить аккаунт
              </Button>
            </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-3">
                  <DialogTitle className="text-xl font-semibold flex items-center">
                    <MessageSquare className="mr-3 h-5 w-5 text-primary" />
                    Добавить аккаунт Avito
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Добавьте новый аккаунт Avito с настройками API и прокси
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={createForm.handleSubmit(handleCreateAccount)} className="space-y-6 py-4">
                  {/* API настройки */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-foreground border-b pb-2">API настройки</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Название аккаунта <span className="text-destructive">*</span>
                      </Label>
                      <Input 
                        id="name" 
                        {...createForm.register('name')} 
                        placeholder="Мой аккаунт Avito"
                        className="h-10"
                      />
                      {createForm.formState.errors.name && (
                        <p className="text-xs text-destructive mt-1">{createForm.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="clientId" className="text-sm font-medium">
                          Client ID <span className="text-destructive">*</span>
                        </Label>
                        <Input 
                          id="clientId" 
                          {...createForm.register('clientId')} 
                          placeholder="client_id"
                          className="h-10"
                        />
                        {createForm.formState.errors.clientId && (
                          <p className="text-xs text-destructive mt-1">{createForm.formState.errors.clientId.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="clientSecret" className="text-sm font-medium">
                          Client Secret <span className="text-destructive">*</span>
                        </Label>
                        <div className="relative">
                          <Input 
                            id="clientSecret" 
                            type={showClientSecret ? "text" : "password"}
                            {...createForm.register('clientSecret')} 
                            placeholder="client_secret"
                            className="h-10 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-10 px-3"
                            onClick={() => setShowClientSecret(!showClientSecret)}
                          >
                            {showClientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        {createForm.formState.errors.clientSecret && (
                          <p className="text-xs text-destructive mt-1">{createForm.formState.errors.clientSecret.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="userId" className="text-sm font-medium">
                        ID Профиля
                      </Label>
                      <Input 
                        id="userId" 
                        {...createForm.register('userId')} 
                        placeholder="12345"
                        className="h-10"
                      />
                      <p className="text-xs text-muted-foreground">
                        Необязательное поле. ID пользователя Avito для связи с профилем
                      </p>
                      {createForm.formState.errors.userId && (
                        <p className="text-xs text-destructive mt-1">{createForm.formState.errors.userId.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Настройки прокси */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-foreground border-b pb-2 flex items-center">
                      <Shield className="mr-2 h-4 w-4" />
                      Настройки прокси (опционально)
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="proxyType" className="text-sm font-medium">Тип прокси</Label>
                        <Select onValueChange={(value) => createForm.setValue('proxyType', value as any)}>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Выберите тип прокси" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="http">HTTP</SelectItem>
                            <SelectItem value="socks4">SOCKS4</SelectItem>
                            <SelectItem value="socks5">SOCKS5</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="proxyHost" className="text-sm font-medium">Хост</Label>
                        <Input 
                          id="proxyHost" 
                          {...createForm.register('proxyHost')} 
                          placeholder="proxy.example.com"
                          className="h-10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="proxyPort" className="text-sm font-medium">Порт</Label>
                        <Input 
                          id="proxyPort" 
                          {...createForm.register('proxyPort')} 
                          placeholder="8080"
                          className="h-10"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="proxyLogin" className="text-sm font-medium">Логин</Label>
                        <Input 
                          id="proxyLogin" 
                          {...createForm.register('proxyLogin')} 
                          placeholder="proxy_user"
                          className="h-10"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="proxyPassword" className="text-sm font-medium">Пароль</Label>
                        <div className="relative">
                          <Input 
                            id="proxyPassword" 
                            type={showProxyPassword ? "text" : "password"}
                            {...createForm.register('proxyPassword')} 
                            placeholder="proxy_pass"
                            className="h-10 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-10 px-3"
                            onClick={() => setShowProxyPassword(!showProxyPassword)}
                          >
                            {showProxyPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-6 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateModalOpen(false)}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto"
                    >
                      Отмена
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Добавление...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Добавить аккаунт
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего аккаунтов</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAccounts}</div>
              <p className="text-xs text-muted-foreground">
                {connectedAccounts} подключено
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Общий баланс</CardTitle>
              <span className="text-muted-foreground text-lg font-bold">₽</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBalance(totalBalance)}</div>
              <p className="text-xs text-muted-foreground">
                CPA баланс всех аккаунтов
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Объявления</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(totalAds)}</div>
              <p className="text-xs text-muted-foreground">
                Активных объявлений
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Подключения</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{connectedAccounts}</div>
              <p className="text-xs text-muted-foreground">
                Активных подключений
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего просмотров</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {accounts.reduce((sum, acc) => sum + (acc.viewsCount || 0), 0).toLocaleString('ru-RU')}
              </div>
              <p className="text-xs text-muted-foreground">
                Сегодня: {accounts.reduce((sum, acc) => sum + (acc.viewsToday || 0), 0).toLocaleString('ru-RU')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего контактов</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {accounts.reduce((sum, acc) => sum + (acc.contactsCount || 0), 0).toLocaleString('ru-RU')}
              </div>
              <p className="text-xs text-muted-foreground">
                Сегодня: {accounts.reduce((sum, acc) => sum + (acc.contactsToday || 0), 0).toLocaleString('ru-RU')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tools Section */}
        {accounts.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center">
                <Activity className="mr-2 h-5 w-5 text-green-600" />
                Инструменты управления
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <Button 
                  variant="outline" 
                  className="h-12 flex flex-col items-center justify-center gap-1 hover:bg-blue-50 hover:border-blue-300"
                  onClick={handleOpenProxyCheckModal}
                >
                  <Globe className="h-4 w-4 text-blue-600" />
                  <span className="text-xs">Проверка прокси</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-12 flex flex-col items-center justify-center gap-1 hover:bg-green-50 hover:border-green-300"
                  onClick={handleOpenEternalOnlineModal}
                >
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="text-xs">Вечный онлайн</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-12 flex flex-col items-center justify-center gap-1 hover:bg-purple-50 hover:border-purple-300"
                  onClick={() => toast.info('Функция "АвтоОтвет" в разработке')}
                >
                  <MessageCircle className="h-4 w-4 text-purple-600" />
                  <span className="text-xs">АвтоОтвет</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-12 flex flex-col items-center justify-center gap-1 hover:bg-red-50 hover:border-red-300"
                  onClick={() => toast.info('Функция "БидМенеджер" в разработке')}
                >
                  <Target className="h-4 w-4 text-red-600" />
                  <span className="text-xs">БидМенеджер</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-12 flex flex-col items-center justify-center gap-1 hover:bg-yellow-50 hover:border-yellow-300"
                  onClick={() => toast.info('Функция "Статистика ТОП" в разработке')}
                >
                  <Star className="h-4 w-4 text-yellow-600" />
                  <span className="text-xs">Статистика ТОП</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="h-12 flex flex-col items-center justify-center gap-1 hover:bg-indigo-50 hover:border-indigo-300"
                  onClick={handleOpenReviewsModal}
                >
                  <ThumbsUp className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs">Отзывы</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Аккаунты Avito</CardTitle>
                <CardDescription>
                  Управление аккаунтами для интеграции с Avito API
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Поиск аккаунтов..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleSyncAllAccounts}
                  disabled={syncingAll || filteredAccounts.length === 0}
                  className="flex items-center"
                >
                  {syncingAll ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Синхронизация...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Синхронизировать все
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-gray-500" />
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Нет аккаунтов</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Аккаунты не найдены' : 'Начните с добавления первого аккаунта Avito'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Имя аккаунта</TableHead>
                    <TableHead>Статус подключения</TableHead>
                    <TableHead>Проверка прокси</TableHead>
                        <TableHead>CPA Баланс</TableHead>
                    <TableHead>Кол-во объявлений</TableHead>
                    <TableHead>Кол-во просмотров</TableHead>
                    <TableHead>Кол-во контактов</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{account.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {account.clientId}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getConnectionStatusBadge(account.connectionStatus)}</TableCell>
                      <TableCell>{getProxyStatusBadge(account)}</TableCell>
                      <TableCell className="font-mono">
                        <div className="flex items-center">
                          <span className="text-green-600 mr-1 text-sm font-bold">₽</span>
                          {formatBalance(account.accountBalance)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <MessageSquare className="h-4 w-4 mr-1 text-blue-600" />
                          {formatNumber(account.adsCount)}
                        </div>
                      </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <TrendingUp className="h-4 w-4 mr-1 text-purple-600" />
                              {formatNumberWithToday(account.viewsCount, account.viewsToday)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1 text-orange-600" />
                              {formatNumberWithToday(account.contactsCount, account.contactsToday)}
                            </div>
                          </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSyncAccount(account)}
                            disabled={syncingAccount === account.id}
                            title="Синхронизировать данные"
                          >
                            {syncingAccount === account.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(account)}
                            title="Редактировать"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteModal(account)}
                            title="Удалить"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Proxy Check Modal */}
        <Dialog open={isProxyCheckModalOpen} onOpenChange={setIsProxyCheckModalOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center">
                <Globe className="mr-3 h-5 w-5 text-blue-600" />
                Проверка прокси аккаунтов
              </DialogTitle>
              <DialogDescription>
                Проверьте состояние прокси для всех аккаунтов Avito
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {loadingProxyData ? (
                <div className="text-center py-8">
                  <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Загрузка данных прокси...</h3>
                </div>
              ) : proxyAccounts.length === 0 ? (
                <div className="text-center py-8">
                  <Globe className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Нет аккаунтов</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Добавьте аккаунты для проверки прокси
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {proxyAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{account.name}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {account.proxyHost ? (
                            <div className="space-y-1">
                              <div className="font-mono">
                                {account.proxyType?.toUpperCase()}://{account.proxyHost}:{account.proxyPort}
                              </div>
                              {account.proxyLogin && (
                                <div className="font-mono text-xs text-gray-500 flex items-center space-x-2">
                                  <span>
                                    Логин: {account.proxyLogin} | Пароль: {
                                      account.proxyPassword 
                                        ? showProxyPasswords.has(account.id) 
                                          ? account.proxyPassword
                                          : '***' + account.proxyPassword.slice(-3)
                                        : 'не указан'
                                    }
                                  </span>
                                  {account.proxyPassword && (
                                    <button
                                      onClick={() => {
                                        setShowProxyPasswords(prev => {
                                          const newSet = new Set(prev);
                                          if (newSet.has(account.id)) {
                                            newSet.delete(account.id);
                                          } else {
                                            newSet.add(account.id);
                                          }
                                          return newSet;
                                        });
                                      }}
                                      className="text-blue-500 hover:text-blue-700 ml-1"
                                    >
                                      {showProxyPasswords.has(account.id) ? (
                                        <EyeOff className="h-3 w-3" />
                                      ) : (
                                        <Eye className="h-3 w-3" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="italic text-gray-400">Прокси не настроен</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="min-w-[120px] text-right">
                          {proxyCheckResults[account.id] ? (
                            <span className={`text-sm ${
                              proxyCheckResults[account.id].includes('✅') 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {proxyCheckResults[account.id]}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">Не проверен</span>
                          )}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCheckSingleProxy(account)}
                          disabled={checkingProxyIds.has(account.id)}
                          className="min-w-[80px]"
                        >
                          {checkingProxyIds.has(account.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Проверить'
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="pt-6 border-t">
              <Button 
                variant="outline"
                onClick={() => {
                  setProxyCheckResults({});
                  setCheckingProxyIds(new Set());
                  setShowProxyPasswords(new Set());
                }}
              >
                Очистить результаты
              </Button>
              <Button 
                onClick={() => setIsProxyCheckModalOpen(false)}
                className="w-full sm:w-auto"
              >
                Закрыть
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Eternal Online Modal */}
        <Dialog open={isEternalOnlineModalOpen} onOpenChange={setIsEternalOnlineModalOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center">
                <Clock className="mr-3 h-5 w-5 text-green-600" />
                Вечный онлайн
              </DialogTitle>
              <DialogDescription>
                Управление автоматическим поддержанием профилей в онлайне
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {accounts.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Нет аккаунтов</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Добавьте аккаунты для управления онлайн-статусом
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {accounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{account.name}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm text-gray-600">Статус онлайн:</span>
                          <Badge 
                            variant={onlineStatuses[account.id] ? "default" : "secondary"} 
                            className={`text-xs ${
                              onlineStatuses[account.id] 
                                ? "bg-green-500" 
                                : "bg-gray-400"
                            }`}
                          >
                            {onlineStatuses[account.id] ? "🟢 Онлайн" : "⚫ Оффлайн"}
                          </Badge>
                          {eternalOnlineSettings[account.id] && (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                              🔄 Автоматически
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-medium text-gray-700 mb-1">
                            Вечный онлайн
                          </span>
                          <Switch
                            checked={eternalOnlineSettings[account.id] || false}
                            onCheckedChange={(checked) => handleToggleEternalOnline(account.id, checked)}
                            disabled={updatingOnlineStatus.has(account.id)}
                            className="data-[state=checked]:bg-green-500"
                          />
                        </div>
                        {updatingOnlineStatus.has(account.id) && (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-2">
                <div className="text-blue-600 mt-0.5">ℹ️</div>
                <div className="text-sm text-blue-800">
                  <strong>Как работает "Вечный онлайн":</strong>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>При включении аккаунт автоматически поддерживается в онлайне</li>
                    <li>Система периодически проверяет и обновляет статус</li>
                    <li>Помогает увеличить видимость ваших объявлений</li>
                  </ul>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-6 border-t">
              <Button 
                onClick={() => setIsEternalOnlineModalOpen(false)}
                className="w-full sm:w-auto"
              >
                Закрыть
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog - Similar structure but simplified for brevity */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center">
                <Edit className="mr-3 h-5 w-5 text-blue-600" />
                Редактировать аккаунт
              </DialogTitle>
              <DialogDescription>
                Измените настройки аккаунта Avito и прокси
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={editForm.handleSubmit(handleEditAccount)} className="space-y-6 py-4">
              {/* API настройки */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground border-b pb-2">API настройки</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-sm font-medium">
                    Название аккаунта <span className="text-destructive">*</span>
                  </Label>
                  <Input 
                    id="edit-name" 
                    {...editForm.register('name')} 
                    placeholder="Мой аккаунт Avito"
                    className="h-10"
                  />
                  {editForm.formState.errors.name && (
                    <p className="text-xs text-destructive mt-1">{editForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-clientId" className="text-sm font-medium">
                      Client ID <span className="text-destructive">*</span>
                    </Label>
                    <Input 
                      id="edit-clientId" 
                      {...editForm.register('clientId')} 
                      placeholder="client_id"
                      className="h-10 font-mono"
                    />
                    {editForm.formState.errors.clientId && (
                      <p className="text-xs text-destructive mt-1">{editForm.formState.errors.clientId.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-clientSecret" className="text-sm font-medium">
                      Client Secret <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input 
                        id="edit-clientSecret" 
                        type={showClientSecret ? "text" : "password"}
                        {...editForm.register('clientSecret')} 
                        placeholder="client_secret"
                        className="h-10 pr-10 font-mono"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-10 px-3"
                        onClick={() => setShowClientSecret(!showClientSecret)}
                      >
                        {showClientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {editForm.formState.errors.clientSecret && (
                      <p className="text-xs text-destructive mt-1">{editForm.formState.errors.clientSecret.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-userId" className="text-sm font-medium">
                    ID Профиля
                  </Label>
                  <Input 
                    id="edit-userId" 
                    {...editForm.register('userId')} 
                    placeholder="12345"
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Необязательное поле. ID пользователя Avito для связи с профилем
                  </p>
                  {editForm.formState.errors.userId && (
                    <p className="text-xs text-destructive mt-1">{editForm.formState.errors.userId.message}</p>
                  )}
                </div>
              </div>

              {/* Настройки прокси */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground border-b pb-2 flex items-center">
                  <Shield className="mr-2 h-4 w-4" />
                  Настройки прокси (опционально)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-proxyType" className="text-sm font-medium">Тип прокси</Label>
                    <Select onValueChange={(value) => editForm.setValue('proxyType', value as any)}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Выберите тип прокси" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="http">HTTP</SelectItem>
                        <SelectItem value="socks4">SOCKS4</SelectItem>
                        <SelectItem value="socks5">SOCKS5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-proxyHost" className="text-sm font-medium">Хост</Label>
                    <Input 
                      id="edit-proxyHost" 
                      {...editForm.register('proxyHost')} 
                      placeholder="proxy.example.com"
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-proxyPort" className="text-sm font-medium">Порт</Label>
                    <Input 
                      id="edit-proxyPort" 
                      {...editForm.register('proxyPort')} 
                      placeholder="8080"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-proxyLogin" className="text-sm font-medium">Логин</Label>
                    <Input 
                      id="edit-proxyLogin" 
                      {...editForm.register('proxyLogin')} 
                      placeholder="proxy_user"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-proxyPassword" className="text-sm font-medium">Пароль</Label>
                    <div className="relative">
                      <Input 
                        id="edit-proxyPassword" 
                        type={showProxyPassword ? "text" : "password"}
                        {...editForm.register('proxyPassword')} 
                        placeholder="proxy_pass"
                        className="h-10 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-10 px-3"
                        onClick={() => setShowProxyPassword(!showProxyPassword)}
                      >
                        {showProxyPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Кнопка проверки прокси */}
                <div className="flex justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestProxy}
                    disabled={testingProxy}
                    className="flex items-center gap-2"
                  >
                    {testingProxy ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Проверка прокси...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4" />
                        Проверить прокси
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-6 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  Отмена
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      Сохранить изменения
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Удалить аккаунт</DialogTitle>
              <DialogDescription>
                Вы уверены, что хотите удалить аккаунт "{selectedAccount?.name}"? Это действие необратимо.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                Отмена
              </Button>
              <Button variant="destructive" onClick={handleDeleteAccount} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Удалить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reviews Modal */}
        <Dialog open={isReviewsModalOpen} onOpenChange={setIsReviewsModalOpen}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center">
                <ThumbsUp className="mr-3 h-5 w-5 text-indigo-600" />
                Отзывы и рейтинги аккаунтов
              </DialogTitle>
              <DialogDescription>
                Просмотр рейтингов и отзывов для всех аккаунтов Avito
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {loadingRatings ? (
                <div className="text-center py-8">
                  <Loader2 className="mx-auto h-12 w-12 animate-spin text-indigo-500" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Загрузка рейтингов...</h3>
                </div>
              ) : ratingsInfo.length === 0 ? (
                <div className="text-center py-8">
                  <ThumbsUp className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Нет данных о рейтингах</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Убедитесь, что аккаунты настроены правильно
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ratingsInfo.map((account) => (
                    <div key={account.accountId} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 mb-2">{account.accountName}</div>
                          
                          {account.error ? (
                            <div className="text-red-600 text-sm">
                              ❌ Ошибка: {account.error}
                            </div>
                          ) : account.ratingInfo ? (
                            <div className="space-y-2">
                              {account.ratingInfo.isEnabled ? (
                                account.ratingInfo.rating ? (
                                  <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-1">
                                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                      <span className="font-medium text-lg">
                                        {account.ratingInfo.rating.score?.toFixed(1) || 'N/A'}
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      Отзывов: {account.ratingInfo.rating.reviewsCount || 0}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      Влияют на рейтинг: {account.ratingInfo.rating.reviewsWithScoreCount || 0}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-gray-600 text-sm">
                                    Рейтинг включен, но данных пока нет
                                  </div>
                                )
                              ) : (
                                <div className="text-gray-600 text-sm">
                                  ⚪ Рейтинг отключен
                                </div>
                              )}

                              {showAllReviews[account.accountId] && selectedAccountReviews?.accountId === account.accountId && (
                                <div className="mt-4 border-t pt-4">
                                  <h4 className="font-medium mb-3">Отзывы:</h4>
                                  {loadingReviews ? (
                                    <div className="text-center py-4">
                                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-indigo-500" />
                                      <p className="text-sm text-gray-500 mt-2">Загрузка отзывов...</p>
                                    </div>
                                  ) : reviews.length === 0 ? (
                                    <p className="text-gray-500 text-sm">Отзывов пока нет</p>
                                  ) : (
                                    <div className="space-y-3 max-h-60 overflow-y-auto">
                                      {reviews.map((review: any) => (
                                        <div key={review.id} className="bg-white border rounded p-3">
                                          <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                              <div className="flex items-center">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                  <Star 
                                                    key={star}
                                                    className={`h-3 w-3 ${
                                                      star <= review.score 
                                                        ? 'text-yellow-400 fill-current' 
                                                        : 'text-gray-300'
                                                    }`}
                                                  />
                                                ))}
                                              </div>
                                              <span className="text-sm font-medium">
                                                {review.sender?.name || 'Аноним'}
                                              </span>
                                            </div>
                                            <span className="text-xs text-gray-500">
                                              {new Date(review.createdAt * 1000).toLocaleDateString('ru-RU')}
                                            </span>
                                          </div>
                                          
                                          <p className="text-sm text-gray-700 mb-2">{review.text}</p>
                                          
                                          {review.item && (
                                            <p className="text-xs text-gray-500 mb-2">
                                              Объявление: {review.item.title}
                                            </p>
                                          )}
                                          
                                          <div className="flex items-center justify-between">
                                            <Badge 
                                              variant={review.stage === 'done' ? 'default' : 'secondary'}
                                              className="text-xs"
                                            >
                                              {review.stage === 'done' && '✅ Сделка состоялась'}
                                              {review.stage === 'fell_through' && '❌ Сделка сорвалась'}
                                              {review.stage === 'not_agree' && '⚪ Не договорились'}
                                              {review.stage === 'not_communicate' && '⚫ Не общались'}
                                            </Badge>
                                            
                                            {review.usedInScore && (
                                              <Badge variant="outline" className="text-xs">
                                                Учитывается в рейтинге
                                              </Badge>
                                            )}
                                          </div>
                                          
                                          {review.answer && (
                                            <div className="mt-2 pl-4 border-l-2 border-blue-200 bg-blue-50 p-2 rounded">
                                              <p className="text-sm font-medium text-blue-800">Ваш ответ:</p>
                                              <p className="text-sm text-blue-700">{review.answer.text}</p>
                                              <Badge 
                                                variant={review.answer.status === 'published' ? 'default' : 'secondary'}
                                                className="text-xs mt-1"
                                              >
                                                {review.answer.status === 'published' && '✅ Опубликован'}
                                                {review.answer.status === 'moderation' && '⏳ На модерации'}
                                                {review.answer.status === 'rejected' && '❌ Отклонен'}
                                              </Badge>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-gray-500 text-sm">
                              Нет данных о рейтинге
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          {account.ratingInfo?.isEnabled && account.ratingInfo?.rating?.reviewsCount > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewAccountReviews(account.accountId)}
                              disabled={loadingReviews && selectedAccountReviews?.accountId === account.accountId}
                              className="min-w-[120px]"
                            >
                              {showAllReviews[account.accountId] && selectedAccountReviews?.accountId === account.accountId ? (
                                loadingReviews ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Скрыть отзывы'
                                )
                              ) : (
                                'Посмотреть отзывы'
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="pt-6 border-t">
              <Button
                onClick={() => {
                  setIsReviewsModalOpen(false);
                  setShowAllReviews({});
                  setSelectedAccountReviews(null);
                  setReviews([]);
                }}
                className="w-full sm:w-auto"
              >
                Закрыть
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
