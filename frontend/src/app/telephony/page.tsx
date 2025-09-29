'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Phone, 
  Search, 
  Filter, 
  Calendar, 
  Play,
  FileText,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  User,
  MapPin,
  Settings,
  ExternalLink
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import authApi from '@/lib/auth';
import { toast } from 'sonner';
import { CreateOrderModal } from '@/components/telephony/CreateOrderModal';
import { LoadingState, LoadingSpinner, TableSkeleton } from '@/components/ui/loading';
import { ErrorBoundary, ErrorMessage, EmptyState } from '@/components/ui/error-boundary';
import { notifications } from '@/components/ui/notifications';
import { SpotifyAudioPlayer } from '@/components/ui/spotify-audio-player';

// Types
interface Call {
  id: number;
  rk: string;
  city: string;
  avitoName?: string;
  phoneClient: string;
  phoneAts: string;
  dateCreate: string;
  status: 'answered' | 'missed' | 'busy' | 'no_answer';
  recordingPath?: string;
  recordingEmailSent?: boolean;
  recordingProcessedAt?: string;
  operator: {
    id: number;
    name: string;
    login: string;
  };
  avito?: {
    id: number;
    name: string;
  };
  phone?: {
    id: number;
    number: string;
    rk: string;
    city: string;
  };
  mango?: {
    id: number;
    callId: string;
    recordUrl?: string;
    duration?: number;
    direction: string;
  };
}

interface CallsResponse {
  success: boolean;
  data: {
    calls: Call[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

interface CallFilters {
  dateFrom?: string;
  dateTo?: string;
  city?: string;
  rk?: string;
  status?: string;
  avitoName?: string;
}

// Schema for filters
const filtersSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  city: z.string().optional(),
  rk: z.string().optional(),
  status: z.enum(['answered', 'missed', 'busy', 'no_answer', '']).optional(),
  avitoName: z.string().optional(),
});

export default function TelephonyPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Редирект админов на админскую страницу телефонии
  useEffect(() => {
    if (user && user.role === 'admin') {
      router.push('/admin/telephony');
      return;
    }
  }, [user, router]);

  // Не показываем контент для админов
  if (user && user.role === 'admin') {
    return null;
  }
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCalls, setTotalCalls] = useState(0);
  const [limit] = useState(20);
  const [sortBy, setSortBy] = useState('dateCreate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [playingCall, setPlayingCall] = useState<number | null>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [selectedCallForOrder, setSelectedCallForOrder] = useState<Call | null>(null);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [showOrderHistoryModal, setShowOrderHistoryModal] = useState(false);
  const [selectedCallForHistory, setSelectedCallForHistory] = useState<Call | null>(null);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [orderHistoryLoading, setOrderHistoryLoading] = useState(false);
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [lastCallCount, setLastCallCount] = useState(0);
  const [newCallsCount, setNewCallsCount] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm<CallFilters>({
    resolver: zodResolver(filtersSchema),
    defaultValues: {
      dateFrom: '',
      dateTo: '',
      city: '',
      rk: '',
      status: '',
      avitoName: ''
    }
  });

  const watchedFilters = watch();

  // Группировка звонков по номеру клиента
  const groupedCalls = calls.reduce((groups, call) => {
    const key = call.phoneClient;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(call);
    return groups;
  }, {} as Record<string, Call[]>);

  // Сортировка звонков в каждой группе по дате
  Object.keys(groupedCalls).forEach(key => {
    groupedCalls[key].sort((a, b) => new Date(b.dateCreate).getTime() - new Date(a.dateCreate).getTime());
  });

  // Функция для переключения развернутого состояния группы
  const toggleGroup = (phoneClient: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(phoneClient)) {
      newExpanded.delete(phoneClient);
    } else {
      newExpanded.add(phoneClient);
    }
    setExpandedGroups(newExpanded);
  };

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchCalls(watchedFilters, currentPage);
      }, 5000); // Обновляем каждые 5 секунд
      
      setRefreshInterval(interval);
      
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [autoRefresh]); // Убираем watchedFilters и currentPage из зависимостей

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioPlayer.audio) {
        audioPlayer.audio.pause();
        audioPlayer.audio.currentTime = 0;
      }
    };
  }, []);

  // Fetch calls
  const fetchCalls = useCallback(async (filters: CallFilters = {}, page = currentPage) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder
      });

      // Add filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          params.append(key, value);
        }
      });

      // Add search term as general filter
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const response = await authApi.get(`/calls?${params.toString()}`);
      const data: CallsResponse = response.data;

      if (data.success) {
        const newCalls = data.data.calls;
        const currentCallCount = data.data.pagination.total;
        
        // Проверяем новые звонки
        if (lastCallCount > 0 && currentCallCount > lastCallCount) {
          const newCallsCount = currentCallCount - lastCallCount;
          setNewCallsCount(prev => prev + newCallsCount);
        }
        
        setCalls(newCalls);
        setCurrentPage(data.data.pagination.page);
        setTotalPages(data.data.pagination.totalPages);
        setTotalCalls(currentCallCount);
        setLastCallCount(currentCallCount);
      } else {
        throw new Error('Ошибка при получении данных');
      }
    } catch (err: any) {
      console.error('Error fetching calls:', err);
      setError(err.response?.data?.message || 'Ошибка при загрузке звонков');
      notifications.error('Ошибка при загрузке звонков');
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, sortBy, sortOrder, searchTerm]);

  // Initial load
  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  // Reload when sort changes
  useEffect(() => {
    fetchCalls(watchedFilters, currentPage);
  }, [sortBy, sortOrder]);

  // Handle filters
  const onFiltersSubmit = (data: CallFilters) => {
    setCurrentPage(1);
    fetchCalls(data, 1);
  };

  const clearFilters = () => {
    reset();
    setCurrentPage(1);
    fetchCalls({}, 1);
    setSearchTerm('');
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    fetchCalls(watchedFilters, 1);
  };

  // Handle sort
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      answered: { label: 'Отвечен', variant: 'default' as const },
      missed: { label: 'Пропущен', variant: 'destructive' as const },
      busy: { label: 'Занято', variant: 'secondary' as const },
      no_answer: { label: 'Не отвечает', variant: 'outline' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                   { label: status, variant: 'outline' as const };

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  // Load order history for a call
  const loadOrderHistory = async (call: Call) => {
    try {
      setOrderHistoryLoading(true);
      setSelectedCallForHistory(call);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/orders?search=${encodeURIComponent(call.phoneClient)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка при загрузке истории заказов');
      }

      const data = await response.json();
      setOrderHistory(data.data?.orders || []);
      setShowOrderHistoryModal(true);
    } catch (error) {
      console.error('Error loading order history:', error);
      notifications.error('Ошибка при загрузке истории заказов');
    } finally {
      setOrderHistoryLoading(false);
    }
  };

  // Load call recording
  const loadRecording = async (call: Call) => {
    if (!call.recordingPath) {
      toast.error('Запись не найдена');
      return;
    }

    try {
      setPlayingCall(call.id);
      
      // Получаем аудио файл через fetch с авторизацией
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/recordings/call/${call.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      let audioUrl: string;
      
      // Проверяем, возвращает ли сервер JSON (S3) или аудио поток (локальный файл)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        // S3 файл - получаем подписанный URL
        const data = await response.json();
        if (data.success && data.url) {
          audioUrl = data.url;
        } else {
          throw new Error(data.message || 'Не удалось получить URL записи');
        }
      } else {
        // Локальный файл - создаем blob URL
        const audioBlob = await response.blob();
        audioUrl = URL.createObjectURL(audioBlob);
      }
      
      setCurrentAudioUrl(audioUrl);
      
    } catch (error: any) {
      console.error('Error loading recording:', error);
      toast.error('Ошибка загрузки записи: ' + error.message);
      setPlayingCall(null);
      setCurrentAudioUrl(null);
    }
  };

  const closePlayer = () => {
    setPlayingCall(null);
    setCurrentAudioUrl(null);
  };



  // Форматирование времени
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Компонент аудиоплеера
  const AudioPlayer = ({ call }: { call: Call }) => {
    const isCurrentCall = playingCall === call.id;
    const hasRecording = !!call.recordingPath;

    if (!hasRecording) {
      if (call.recordingEmailSent) {
        return (
          <Badge variant="outline" className="text-xs">
            Ожидается
          </Badge>
        );
      }
      return <span className="text-muted-foreground">—</span>;
    }

    if (!isCurrentCall) {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadRecording(call)}
          className="h-8 flex items-center justify-center"
        >
          <Play className="h-4 w-4" />
        </Button>
      );
    }

    return currentAudioUrl ? (
      <SpotifyAudioPlayer 
        audioUrl={currentAudioUrl}
        onError={(error) => {
          toast.error(error);
          closePlayer();
        }}
        className="min-w-[250px]"
      />
    ) : (
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">Загрузка...</span>
      </div>
    );
  };

  // Download call recording
  const downloadRecording = async (call: Call) => {
    if (!call.recordingPath) {
      notifications.error('Запись звонка недоступна');
      return;
    }

    try {
      const response = await fetch(`/api/recordings/call/${call.id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка при загрузке записи');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `call_${call.id}_recording.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      notifications.success('Запись звонка загружена');
    } catch (error) {
      console.error('Error downloading recording:', error);
      notifications.error('Ошибка при загрузке записи');
    }
  };

  // Manual email check
  const triggerEmailCheck = async () => {
    try {
      setEmailCheckLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/recordings/cron/check-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        notifications.success(`Проверка завершена. Обработано писем: ${result.processedCount}`);
        // Обновляем список звонков
        fetchCalls(watchedFilters, currentPage);
      } else {
        notifications.error(result.message || 'Ошибка при проверке почты');
      }
    } catch (error) {
      console.error('Error checking email:', error);
      notifications.error('Ошибка при проверке почты');
    } finally {
      setEmailCheckLoading(false);
    }
  };

  // Create order from call
  const createOrderFromCall = (call: Call) => {
    setSelectedCallForOrder(call);
    setShowCreateOrderModal(true);
  };

  // Handle order created
  const handleOrderCreated = (order: any) => {
    notifications.success(`Заказ №${order.id} успешно создан!`);
    // Optionally refresh calls or navigate to orders page
  };

  return (
    <DashboardLayout variant="operator">
      <div className="w-full p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div>
              <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Телефония</h1>
                {newCallsCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="animate-pulse cursor-pointer"
                    onClick={() => setNewCallsCount(0)}
                  >
                    +{newCallsCount} новых
                  </Badge>
                )}
              </div>
            <p className="text-muted-foreground">
              Управление звонками и создание заказов
                {autoRefresh && (
                  <span className="ml-2 text-green-600 text-sm">
                    • Обновляется автоматически
                  </span>
                )}
            </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {autoRefresh ? (
                <>
                  <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                  Авто-обновление
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-2" />
                  Авто-обновление
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => fetchCalls(watchedFilters, currentPage)}
              disabled={loading}
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Обновить
            </Button>
            <Button
              variant="outline"
              onClick={triggerEmailCheck}
              disabled={emailCheckLoading}
              className="flex items-center gap-2"
            >
              {emailCheckLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Проверить записи
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="w-full">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Phone className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-lg font-semibold">Звонки</div>
                  <div className="text-sm text-gray-500 font-normal">
                    {Object.keys(groupedCalls).length} групп • {totalCalls} звонков
                  </div>
                </div>
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Поиск по телефону, РК, городу..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-64"
                  />
                  <Button onClick={handleSearch} size="sm">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                <Select
                  value={`${sortBy}-${sortOrder}`}
                  onValueChange={(value) => {
                    const [field, order] = value.split('-');
                    setSortBy(field);
                    setSortOrder(order as 'asc' | 'desc');
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Сортировка" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dateCreate-desc">Дата звонка (новые)</SelectItem>
                    <SelectItem value="dateCreate-asc">Дата звонка (старые)</SelectItem>
                    <SelectItem value="city-asc">Город (А-Я)</SelectItem>
                    <SelectItem value="city-desc">Город (Я-А)</SelectItem>
                    <SelectItem value="rk-asc">РК (А-Я)</SelectItem>
                    <SelectItem value="rk-desc">РК (Я-А)</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  size="sm"
                >
                  <Filter className="h-4 w-4" />
                  Фильтры
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Filters Panel */}
          {showFilters && (
            <CardContent className="border-t">
              <form onSubmit={handleSubmit(onFiltersSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="dateFrom">Дата с</Label>
                    <Input
                      id="dateFrom"
                      type="datetime-local"
                      {...register('dateFrom')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateTo">Дата по</Label>
                    <Input
                      id="dateTo"
                      type="datetime-local"
                      {...register('dateTo')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Статус</Label>
                    <Select onValueChange={(value) => register('status').onChange({ target: { value } })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Все статусы" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Все статусы</SelectItem>
                        <SelectItem value="answered">Отвечен</SelectItem>
                        <SelectItem value="missed">Пропущен</SelectItem>
                        <SelectItem value="busy">Занято</SelectItem>
                        <SelectItem value="no_answer">Не отвечает</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="city">Город</Label>
                    <Input
                      id="city"
                      placeholder="Название города"
                      {...register('city')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rk">РК</Label>
                    <Input
                      id="rk"
                      placeholder="РК"
                      {...register('rk')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="avitoName">Авито аккаунт</Label>
                    <Input
                      id="avitoName"
                      placeholder="Имя аккаунта"
                      {...register('avitoName')}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="submit" disabled={loading}>
                    Применить фильтры
                  </Button>
                  <Button type="button" variant="outline" onClick={clearFilters}>
                    Очистить
                  </Button>
                </div>
              </form>
            </CardContent>
          )}

          <CardContent className="p-0">
            {error ? (
              <div className="flex items-center justify-center p-8 text-destructive">
                <AlertTriangle className="h-5 w-5 mr-2" />
                {error}
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('rk')}
                      >
                        РК {sortBy === 'rk' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('city')}
                      >
                        Город {sortBy === 'city' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead>Авито аккаунт</TableHead>
                      <TableHead>Кто звонил</TableHead>
                      <TableHead>Куда звонил</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('dateCreate')}
                      >
                        Дата звонка {sortBy === 'dateCreate' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead>Оператор</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Запись</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8">
                          <LoadingState 
                            message="Загрузка звонков..." 
                            size="md"
                          />
                        </TableCell>
                      </TableRow>
                    ) : calls.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8">
                          <EmptyState
                            title="Звонки не найдены"
                            description="Попробуйте изменить параметры фильтрации"
                            icon={<Phone className="h-12 w-12 text-gray-300" />}
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      Object.entries(groupedCalls).map(([phoneClient, groupCalls]) => {
                        const isExpanded = expandedGroups.has(phoneClient);
                        const latestCall = groupCalls[0]; // Самый последний звонок
                        const hasMultipleCalls = groupCalls.length > 1;
                        
                        return (
                          <React.Fragment key={phoneClient}>
                            {/* Основная строка с последним звонком */}
                            <TableRow className="hover:bg-blue-50/50 bg-gradient-to-r from-blue-50/10 to-transparent">
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                  </div>
                                  {latestCall.rk}
                                </div>
                              </TableCell>
                              <TableCell>{latestCall.city}</TableCell>
                              <TableCell>
                                {latestCall.avitoName ? (
                                  <Badge variant="secondary">{latestCall.avitoName}</Badge>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="font-mono">
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold text-blue-600">{phoneClient}</span>
                                  {hasMultipleCalls && (
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        +{groupCalls.length - 1}
                                      </Badge>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleGroup(phoneClient)}
                                        className="h-7 w-7 p-0 hover:bg-blue-50"
                                      >
                                        {isExpanded ? (
                                          <ChevronUp className="h-4 w-4 text-blue-600" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4 text-blue-600" />
                                        )}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-mono">{latestCall.phoneAts}</TableCell>
                              <TableCell>{formatDate(latestCall.dateCreate)}</TableCell>
                              <TableCell>{latestCall.operator.name}</TableCell>
                              <TableCell>{getStatusBadge(latestCall.status)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <AudioPlayer call={latestCall} />
                                  {latestCall.recordingPath && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => downloadRecording(latestCall)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => createOrderFromCall(latestCall)}
                                    className="flex items-center justify-center gap-2"
                                  >
                                    <FileText className="h-4 w-4" />
                                    Создать заказ
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => loadOrderHistory(latestCall)}
                                    disabled={orderHistoryLoading}
                                    className="flex items-center justify-center gap-2"
                                  >
                                    {orderHistoryLoading ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Calendar className="h-4 w-4" />
                                    )}
                                    История заказов
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                            
                            {/* Развернутые звонки */}
                            {isExpanded && groupCalls.slice(1).map((call, index) => {
                              const isLastCall = index === groupCalls.slice(1).length - 1;
                              return (
                              <TableRow key={call.id} className="hover:bg-blue-50/30 bg-gradient-to-r from-blue-50/20 to-transparent">
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                    {call.rk}
                                  </div>
                                </TableCell>
                          <TableCell>{call.city}</TableCell>
                          <TableCell>
                            {call.avitoName ? (
                              <Badge variant="secondary">{call.avitoName}</Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                                <TableCell className="font-mono pl-8 text-gray-600">
                                  <div className="flex items-center gap-3">
                                    <div className="w-0.5 h-6 bg-blue-300"></div>
                                    <span>{call.phoneClient}</span>
                                  </div>
                                </TableCell>
                          <TableCell className="font-mono">{call.phoneAts}</TableCell>
                                <TableCell className="text-sm text-gray-600">{formatDate(call.dateCreate)}</TableCell>
                          <TableCell>{call.operator.name}</TableCell>
                          <TableCell>{getStatusBadge(call.status)}</TableCell>
                          <TableCell>
                                  <div className="flex items-center gap-2">
                                    <AudioPlayer call={call} />
                                    {call.recordingPath && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => downloadRecording(call)}
                                        className="h-8 w-8 p-0"
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                          <TableCell>
                                  <span className="text-muted-foreground">—</span>
                          </TableCell>
                        </TableRow>
                              );
                            })}
                          </React.Fragment>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>

          {/* Pagination */}
          {totalPages > 1 && (
            <CardContent className="border-t">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Показано {calls.length} из {totalCalls} звонков
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Назад
                  </Button>
                  <span className="text-sm">
                    Страница {currentPage} из {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                  >
                    Вперед
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Create Order Modal */}
        <CreateOrderModal
          call={selectedCallForOrder}
          open={showCreateOrderModal}
          onOpenChange={setShowCreateOrderModal}
          onOrderCreated={handleOrderCreated}
        />

        {/* Order History Modal */}
        <Dialog open={showOrderHistoryModal} onOpenChange={setShowOrderHistoryModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-2xl">📞</span>
                История заказов
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                Заказы для номера телефона
                {selectedCallForHistory && (
                  <Badge variant="outline" className="text-xs font-mono">
                    {selectedCallForHistory.phoneClient}
                  </Badge>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden">
              {orderHistoryLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Загрузка заказов...</span>
                </div>
              ) : orderHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Нет заказов</p>
                  <p className="text-sm">Для этого номера телефона еще не создано ни одного заказа</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {orderHistory.map((order) => (
                      <Card key={order.id} className="border border-gray-200 hover:border-blue-300 transition-colors">
                        <CardContent className="p-4">
                          {/* Header with ID and Status */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono text-xs">
                                #{order.id}
                              </Badge>
                              <Badge 
                                className={`text-xs font-medium ${
                                  order.statusOrder === 'Ожидает' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                  order.statusOrder === 'Принял' ? 'bg-sky-100 text-sky-800 border-sky-200' :
                                  order.statusOrder === 'В пути' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                  order.statusOrder === 'В работе' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                  order.statusOrder === 'Готово' ? 'bg-green-100 text-green-800 border-green-200' :
                                  order.statusOrder === 'Отказ' ? 'bg-red-100 text-red-800 border-red-200' :
                                  order.statusOrder === 'Модерн' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                  order.statusOrder === 'Незаказ' ? 'bg-gray-900 text-white border-gray-900' :
                                  'bg-gray-100 text-gray-800 border-gray-200'
                                }`}
                              >
                                {order.statusOrder}
                              </Badge>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Close modal and navigate to orders page
                                setShowOrderHistoryModal(false);
                                window.open(`/orders?orderId=${order.id}`, '_blank');
                              }}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50 h-7 px-2 text-xs"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Открыть
                            </Button>
                          </div>

                          {/* Client Information */}
                          <div className="mb-3">
                            <h3 className="font-semibold text-base text-gray-900 mb-1">{order.clientName}</h3>
                            <div className="flex items-center gap-3 text-xs text-gray-600">
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {order.phone}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {order.city}
                              </span>
                            </div>
                          </div>

                          {/* Order Details Grid */}
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="bg-gray-50 rounded p-2">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Тип</p>
                              <p className="font-semibold text-gray-900 text-sm">
                                {order.typeEquipment === 'kp' ? 'КП' :
                                 order.typeEquipment === 'bt' ? 'БТ' :
                                 'МНЧ'}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded p-2">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Дата</p>
                              <p className="font-semibold text-gray-900 text-sm">
                                {(() => {
                                  let dateStr = order.dateMeeting;
                                  if (!dateStr.includes('T') && !dateStr.includes('Z') && !dateStr.includes('+')) {
                                    dateStr = dateStr.replace(' ', 'T') + '+03:00';
                                  }
                                  return new Date(dateStr).toLocaleDateString('ru-RU', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  });
                                })()}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded p-2">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Оператор</p>
                              <p className="font-semibold text-gray-900 text-sm">{order.operator?.name || 'Не указан'}</p>
                            </div>
                          </div>

                          {/* Problem Description */}
                          <div className="bg-blue-50 rounded p-2 border-l-2 border-blue-400">
                            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Проблема</p>
                            <p className="text-xs text-gray-700">{order.problem}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
