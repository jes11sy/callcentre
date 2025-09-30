'use client';

import { useState, useEffect, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  MapPin,
  User,
  Phone,
  FileText,
  Settings,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  ShoppingCart,
  Loader2,
  Info,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2
} from 'lucide-react';
import { toast } from 'sonner';
import CreateOrderModal from '@/components/orders/CreateOrderModal';
import { LoadingState, LoadingSpinner, TableSkeleton } from '@/components/ui/loading';
import { ErrorBoundary, ErrorMessage, EmptyState } from '@/components/ui/error-boundary';
import { notifications } from '@/components/ui/notifications';
import { OptimizedPagination } from '@/components/ui/optimized-pagination';

interface Order {
  id: number;
  rk: string;
  city: string;
  avitoName?: string;
  avitoChatId?: string;
  phone: string;
  typeOrder: string;
  clientName: string;
  address: string;
  dateMeeting: string;
  typeEquipment: string;
  problem: string;
  callRecord?: string;
  statusOrder: string;
  result?: number;
  expenditure?: number;
  clean?: number;
  bsoDoc?: string;
  expenditureDoc?: string;
  masterId?: number;
  operatorNameId: number;
  createDate: string;
  closingData?: string;
  operator: {
    id: number;
    name: string;
    login: string;
  };
  avito?: {
    id: number;
    name: string;
  };
  callId?: string;
}

interface OrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const statusLabels = {
  'Ожидает': 'Ожидает',
  'Принял': 'Принял',
  'В пути': 'В пути',
  'В работе': 'В работе',
  'Готово': 'Готово',
  'Отказ': 'Отказ',
  'Модерн': 'Модерн',
  'Незаказ': 'Незаказ'
};

const statusColors = {
  'Ожидает': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Принял': 'bg-sky-100 text-sky-800 border-sky-200',
  'В пути': 'bg-blue-100 text-blue-800 border-blue-200',
  'В работе': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Готово': 'bg-green-100 text-green-800 border-green-200',
  'Отказ': 'bg-red-100 text-red-800 border-red-200',
  'Модерн': 'bg-orange-100 text-orange-800 border-orange-200',
  'Незаказ': 'bg-gray-900 text-white border-gray-900'
};

// Убираем маппинг - просто отображаем данные из БД

function OrdersContent() {
  const router = useRouter();
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);

  // Редирект админов на админскую страницу заказов
  useEffect(() => {
    if (user && user.role === 'admin') {
      router.push('/admin/orders');
      return;
    }
  }, [user, router]);

  // Не показываем контент для админов
  if (user && user.role === 'admin') {
    return null;
  }
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [rkFilter, setRkFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [orderCalls, setOrderCalls] = useState<any[]>([]);
  const [loadingCalls, setLoadingCalls] = useState(false);
  const [audioPlayer, setAudioPlayer] = useState<{
    audio: HTMLAudioElement | null;
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    volume: number;
    currentCallId: number | null;
  }>({
    audio: null,
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    volume: 1,
    currentCallId: null
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'master' | 'documents'>('description');
  const [activeEditTab, setActiveEditTab] = useState<'description' | 'master' | 'documents'>('description');
  const queryClient = useQueryClient();

  // Очистка аудио при размонтировании компонента
  useEffect(() => {
    return () => {
      if (audioPlayer.audio) {
        audioPlayer.audio.pause();
        audioPlayer.audio.currentTime = 0;
      }
    };
  }, []);
  const { user: userData, isAuthenticated, isLoading: authLoading } = useAuthStore();
  
  const userRole = userData?.role;

  // Получение списка заказов (все заказы для всех пользователей)
  const { data: ordersData, isLoading, error } = useQuery<OrdersResponse>({
    queryKey: ['orders', page, limit, search, statusFilter, cityFilter, rkFilter, userData?.id, userData?.role],
    queryFn: async () => {
      // Не выполняем запрос, пока не загружены данные пользователя
      if (!userData) {
        throw new Error('Данные пользователя не загружены');
      }
      const userId = userData?.id;
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
        ...(cityFilter && { city: cityFilter }),
        ...(rkFilter && { rk: rkFilter }),
        // Все пользователи видят все заказы
        // ...(userId && userRole === 'operator' && { operatorId: userId.toString() })
        // Сортировка всегда по дате встречи и статусу "Ожидает" - не передаем параметры сортировки
      });

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка при загрузке заказов');
      }

      const result = await response.json();
      
      // API возвращает { success: true, data: { orders: [...], pagination: {...} } }
      // Нужно извлечь data из ответа
      if (result.success && result.data) {
        return result.data;
      }
      
      throw new Error('Неверный формат ответа API');
    },
    enabled: !!userData && !authLoading // Запрос выполняется только после загрузки данных пользователя
  });

  // Обработка параметра orderId из URL
  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId && ordersData?.orders) {
      const order = ordersData.orders.find(o => o.id === parseInt(orderId));
      if (order) {
        setSelectedOrder(order);
        setIsViewModalOpen(true);
        // Очищаем URL параметр
        const url = new URL(window.location.href);
        url.searchParams.delete('orderId');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [searchParams, ordersData?.orders]);

  // Обновление статуса заказа
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Ошибка при обновлении статуса');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      notifications.success('Статус заказа обновлен');
    },
    onError: () => {
      notifications.error('Ошибка при обновлении статуса');
    }
  });

  const handleStatusChange = (orderId: number, newStatus: string) => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  // Обновление заказа
  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, orderData }: { id: number; orderData: Partial<Order> }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error('Ошибка при обновлении заказа');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      notifications.success('Заказ успешно обновлен');
      setIsEditModalOpen(false);
    },
    onError: () => {
      notifications.error('Ошибка при обновлении заказа');
    }
  });

  const handleSaveOrder = () => {
    if (selectedOrder) {
      updateOrderMutation.mutate({ 
        id: selectedOrder.id, 
        orderData: selectedOrder 
      });
    }
  };

  const loadRecording = async (call: any) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/recordings/call/${call.id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load recording');
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
      
      const audio = new Audio(audioUrl);
      
      audio.addEventListener('loadedmetadata', () => {
        setAudioPlayer(prev => ({
          ...prev,
          audio,
          duration: audio.duration,
          currentCallId: call.id
        }));
      });

      audio.addEventListener('timeupdate', () => {
        setAudioPlayer(prev => ({
          ...prev,
          currentTime: audio.currentTime
        }));
      });

      audio.addEventListener('ended', () => {
        setAudioPlayer(prev => ({
          ...prev,
          isPlaying: false,
          currentTime: 0
        }));
        URL.revokeObjectURL(audioUrl);
      });

      audio.addEventListener('error', () => {
        notifications.error('Ошибка воспроизведения записи');
        URL.revokeObjectURL(audioUrl);
      });

    } catch (error) {
      console.error('Error loading recording:', error);
      notifications.error('Ошибка загрузки записи');
    }
  };

  const togglePlayPause = () => {
    if (!audioPlayer.audio) return;

    if (audioPlayer.isPlaying) {
      audioPlayer.audio.pause();
      setAudioPlayer(prev => ({ ...prev, isPlaying: false }));
    } else {
      audioPlayer.audio.play();
      setAudioPlayer(prev => ({ ...prev, isPlaying: true }));
    }
  };

  const seekTo = (time: number) => {
    if (!audioPlayer.audio) return;
    audioPlayer.audio.currentTime = time;
    setAudioPlayer(prev => ({ ...prev, currentTime: time }));
  };

  const setVolume = (volume: number) => {
    if (!audioPlayer.audio) return;
    audioPlayer.audio.volume = volume;
    setAudioPlayer(prev => ({ ...prev, volume }));
  };

  const skipBackward = () => {
    if (!audioPlayer.audio) return;
    const newTime = Math.max(0, audioPlayer.currentTime - 10);
    seekTo(newTime);
  };

  const skipForward = () => {
    if (!audioPlayer.audio) return;
    const newTime = Math.min(audioPlayer.duration, audioPlayer.currentTime + 10);
    seekTo(newTime);
  };

  const stopPlayback = () => {
    if (audioPlayer.audio) {
      audioPlayer.audio.pause();
      audioPlayer.audio.currentTime = 0;
    }
    setAudioPlayer({
      audio: null,
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      volume: 1,
      currentCallId: null
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const loadOrderCalls = async (callIds: string) => {
    if (!callIds) return;
    
    setLoadingCalls(true);
    try {
      const callIdArray = callIds.split(',');
      const calls = await Promise.all(
        callIdArray.map(async (callId) => {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/calls/${callId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
          });
          if (response.ok) {
            const result = await response.json();
            return result.data;
          }
          return null;
        })
      );
      // Фильтруем только звонки с записями
      setOrderCalls(calls.filter(call => call !== null && call.recordingPath));
    } catch (error) {
      console.error('Error loading calls:', error);
      setOrderCalls([]);
    } finally {
      setLoadingCalls(false);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
    if (order.callId) {
      loadOrderCalls(order.callId);
    } else {
      setOrderCalls([]);
    }
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    stopPlayback(); // Останавливаем воспроизведение при закрытии
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsEditModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    });
  };

  // Отладочная информация
  console.log('OrdersPage render:', {
    authLoading,
    userData,
    userRole,
    isAuthenticated,
    ordersData,
    isLoading,
    error
  });

  // Показываем загрузку, пока не получены данные пользователя
  if (authLoading || !userData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Загрузка данных пользователя...</p>
          <p className="text-xs text-gray-500 mt-2">
            authLoading: {authLoading ? 'true' : 'false'}, userData: {userData ? 'exists' : 'null'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Ошибка при загрузке заказов</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout variant={userRole === 'admin' ? 'admin' : 'operator'}>
      <div className="w-full py-6 px-4">
        <div className="w-full">
          <div className="space-y-6 w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <ShoppingCart className="h-8 w-8 mr-3 text-purple-600" />
              {userRole === 'admin' ? 'Все заказы' : 'Мои заказы'}
            </h1>
            <p className="text-gray-600 mt-2">
              {userRole === 'admin' 
                ? 'Управляйте всеми заказами и отслеживайте их статус'
                : 'Управляйте своими заказами и отслеживайте их статус'
              }
            </p>
          </div>
          
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Создать заказ
          </Button>
        </div>
      </div>

      {/* Search and Time Slots */}
      <div className="space-y-6 mb-8 w-full">
        {/* Search and Filters in one row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Поиск по ID, номеру телефона или адресу..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Статус</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Все статусы" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все статусы</SelectItem>
                      <SelectItem value="Ожидает">Ожидает</SelectItem>
                      <SelectItem value="Принял">Принял</SelectItem>
                      <SelectItem value="В пути">В пути</SelectItem>
                      <SelectItem value="В работе">В работе</SelectItem>
                      <SelectItem value="Готово">Готово</SelectItem>
                      <SelectItem value="Отказ">Отказ</SelectItem>
                      <SelectItem value="Модерн">Модерн</SelectItem>
                      <SelectItem value="Незаказ">Незаказ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city">Город</Label>
                  <Input
                    id="city"
                    placeholder="Фильтр по городу"
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rk">РК</Label>
                  <Input
                    id="rk"
                    placeholder="Фильтр по РК"
                    value={rkFilter}
                    onChange={(e) => setRkFilter(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time Slots Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Заявки на сегодня по времени
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="space-y-4">
                {/* Header with time slots */}
                <div className="grid gap-2 min-w-max" style={{ gridTemplateColumns: '80px repeat(25, 1fr)' }}>
                  <div className="text-sm font-medium text-gray-600 text-center">Время</div>
                  {Array.from({ length: 25 }, (_, i) => {
                    const hour = Math.floor(i / 2) + 10;
                    const minute = (i % 2) * 30;
                    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    return (
                      <div key={timeString} className="text-sm font-medium text-gray-600 text-center">
                        {timeString}
                      </div>
                    );
                  })}
                </div>
                
                {/* КП row */}
                <div className="grid gap-2 min-w-max" style={{ gridTemplateColumns: '80px repeat(25, 1fr)' }}>
                  <div className="text-sm font-medium text-blue-600 text-center">КП</div>
                  {Array.from({ length: 25 }, (_, i) => {
                    const hour = Math.floor(i / 2) + 10;
                    const minute = (i % 2) * 30;
                    
                    const kpCount = ordersData?.orders?.filter(order => {
                      if (!order.dateMeeting || order.typeEquipment !== 'КП') return false;
                      const orderTime = new Date(order.dateMeeting);
                      const today = new Date();
                      
                      // Проверяем, что заявка на сегодня (используем UTC для корректного сравнения)
                      const isToday = orderTime.getUTCDate() === today.getDate() && 
                                     orderTime.getUTCMonth() === today.getMonth() && 
                                     orderTime.getUTCFullYear() === today.getFullYear();
                      
                      if (!isToday) return false;
                      
                      const orderHour = orderTime.getUTCHours();
                      const orderMinute = orderTime.getUTCMinutes();
                      return orderHour === hour && orderMinute === minute;
                    }).length || 0;
                    
                    return (
                      <div key={`kp-${i}`} className="text-center">
                        <div className={`text-lg font-bold ${
                          kpCount > 0 ? 'text-blue-600' : 'text-gray-400'
                        }`}>
                          {kpCount}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* БТ row */}
                <div className="grid gap-2 min-w-max" style={{ gridTemplateColumns: '80px repeat(25, 1fr)' }}>
                  <div className="text-sm font-medium text-green-600 text-center">БТ</div>
                  {Array.from({ length: 25 }, (_, i) => {
                    const hour = Math.floor(i / 2) + 10;
                    const minute = (i % 2) * 30;
                    
                    const btCount = ordersData?.orders?.filter(order => {
                      if (!order.dateMeeting || order.typeEquipment !== 'БТ') return false;
                      const orderTime = new Date(order.dateMeeting);
                      const today = new Date();
                      
                      // Проверяем, что заявка на сегодня (используем UTC для корректного сравнения)
                      const isToday = orderTime.getUTCDate() === today.getDate() && 
                                     orderTime.getUTCMonth() === today.getMonth() && 
                                     orderTime.getUTCFullYear() === today.getFullYear();
                      
                      if (!isToday) return false;
                      
                      const orderHour = orderTime.getUTCHours();
                      const orderMinute = orderTime.getUTCMinutes();
                      return orderHour === hour && orderMinute === minute;
                    }).length || 0;
                    
                    return (
                      <div key={`bt-${i}`} className="text-center">
                        <div className={`text-lg font-bold ${
                          btCount > 0 ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {btCount}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* МНЧ row */}
                <div className="grid gap-2 min-w-max" style={{ gridTemplateColumns: '80px repeat(25, 1fr)' }}>
                  <div className="text-sm font-medium text-orange-600 text-center">МНЧ</div>
                  {Array.from({ length: 25 }, (_, i) => {
                    const hour = Math.floor(i / 2) + 10;
                    const minute = (i % 2) * 30;
                    
                    const mnchCount = ordersData?.orders?.filter(order => {
                      if (!order.dateMeeting || order.typeEquipment !== 'МНЧ') return false;
                      const orderTime = new Date(order.dateMeeting);
                      const today = new Date();
                      
                      // Проверяем, что заявка на сегодня (используем UTC для корректного сравнения)
                      const isToday = orderTime.getUTCDate() === today.getDate() && 
                                     orderTime.getUTCMonth() === today.getMonth() && 
                                     orderTime.getUTCFullYear() === today.getFullYear();
                      
                      if (!isToday) return false;
                      
                      const orderHour = orderTime.getUTCHours();
                      const orderMinute = orderTime.getUTCMinutes();
                      return orderHour === hour && orderMinute === minute;
                    }).length || 0;
                    
                    return (
                      <div key={`mnch-${i}`} className="text-center">
                        <div className={`text-lg font-bold ${
                          mnchCount > 0 ? 'text-orange-600' : 'text-gray-400'
                        }`}>
                          {mnchCount}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Список заказов</CardTitle>
          <CardDescription>
            Управляйте своими заказами и отслеживайте их статус
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState 
              message="Загрузка заказов..." 
              size="lg"
              className="py-12"
            />
          ) : ordersData?.orders?.length === 0 ? (
            <EmptyState
              title={search ? 'Заказы не найдены' : 'Нет заказов'}
              description={search ? 'Попробуйте изменить параметры поиска' : 'Создайте свой первый заказ'}
              icon={<ShoppingCart className="h-12 w-12 text-gray-300" />}
              action={!search ? (
                <Button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-4"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Создать первый заказ
                </Button>
              ) : undefined}
            />
          ) : ordersData?.orders && ordersData.orders.length > 0 ? (
            <div className="overflow-x-auto w-full">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead className="w-20">РК</TableHead>
                    <TableHead className="w-24">Город</TableHead>
                    <TableHead className="w-28">Имя мастера</TableHead>
                    <TableHead className="w-24">Телефон</TableHead>
                    <TableHead className="w-24">Тип заявки</TableHead>
                    <TableHead className="w-32">Клиент</TableHead>
                    <TableHead className="w-40">Адрес</TableHead>
                    <TableHead className="w-28">Дата встречи</TableHead>
                    <TableHead className="w-28">Тип техники</TableHead>
                    <TableHead className="w-40">Проблема</TableHead>
                    <TableHead className="w-24">Статус</TableHead>
                    <TableHead className="w-24">Мастер</TableHead>
                    <TableHead className="w-20">Итог</TableHead>
                    <TableHead className="w-24">Оператор</TableHead>
                    <TableHead className="w-24">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersData.orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.rk}</TableCell>
                      <TableCell>{order.city}</TableCell>
                      <TableCell>
                        <div className="max-w-28 truncate" title={order.avitoName || 'Не указан'}>
                          {order.avitoName || <span className="text-gray-400">Не указан</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-24 truncate" title={order.phone}>
                          {order.phone || <span className="text-gray-400">Не указан</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          {order.typeOrder || 'Не указан'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-32 truncate" title={order.clientName}>
                          {order.clientName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-40 truncate" title={order.address}>
                          {order.address}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm whitespace-nowrap">
                          {formatDate(order.dateMeeting)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-28 truncate" title={order.typeEquipment}>
                          <Badge variant="outline" className="text-xs">
                            {order.typeEquipment}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-40 truncate" title={order.problem}>
                          {order.problem}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={`text-xs whitespace-nowrap ${statusColors[order.statusOrder as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200'}`}
                        >
                          {order.statusOrder}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-24 truncate" title={order.masterId ? `ID: ${order.masterId}` : 'Не назначен'}>
                          {order.masterId || <span className="text-gray-400">Не назначен</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {order.result ? `${order.result} ₽` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-24 truncate" title={order.operator.name}>
                          {order.operator.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewOrder(order)}
                            title="Просмотр"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditOrder(order)}
                            title="Редактировать"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600">Нет данных для отображения</p>
              <p className="text-xs text-gray-500 mt-2">
                ordersData: {ordersData ? 'exists' : 'null'}, orders: {ordersData?.orders?.length || 0}
              </p>
            </div>
          )}

          {/* Пагинация */}
          {ordersData?.pagination && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-700">
                  Показано {((ordersData.pagination.page - 1) * ordersData.pagination.limit) + 1} - {Math.min(ordersData.pagination.page * ordersData.pagination.limit, ordersData.pagination.total)} из {ordersData.pagination.total} заказов
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="page-size" className="text-sm text-gray-600">
                    На странице:
                  </Label>
                  <Select
                    value={limit.toString()}
                    onValueChange={(value) => {
                      setLimit(parseInt(value));
                      setPage(1);
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {ordersData.pagination.totalPages > 1 && (
                <OptimizedPagination
                  currentPage={ordersData.pagination.page}
                  totalPages={ordersData.pagination.totalPages}
                  onPageChange={setPage}
                  showFirstLast={true}
                  showPrevNext={true}
                  maxVisiblePages={5}
                  disabled={isLoading}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Модальное окно просмотра заказа */}
      {isViewModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={handleCloseViewModal}
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-[85vw] h-[80vh] overflow-y-auto"
            style={{ 
              width: '85vw', 
              height: '80vh'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FileText className="h-6 w-6 text-purple-600" />
                  Заказ #{selectedOrder?.id}
                </h2>
                <p className="text-gray-600 mt-1">
                  Подробная информация о заказе
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseViewModal}
                className="h-8 w-8 p-0"
              >
                <span className="sr-only">Закрыть</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Статус и основные бейджи */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <Badge 
                    className={`text-sm px-3 py-1 ${statusColors[selectedOrder.statusOrder as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200'}`}
                  >
                    {statusLabels[selectedOrder.statusOrder as keyof typeof statusLabels] || selectedOrder.statusOrder}
                  </Badge>
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    {selectedOrder.typeOrder}
                  </Badge>
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    {selectedOrder.typeEquipment}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  Создан: {new Date(selectedOrder.createDate).toLocaleDateString('ru-RU')}
                </div>
              </div>

              {/* Вкладки */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('description')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'description'
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <FileText className="h-4 w-4 inline mr-2" />
                    Описание
                  </button>
                  <button
                    onClick={() => setActiveTab('master')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'master'
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <User className="h-4 w-4 inline mr-2" />
                    Мастер
                  </button>
                  <button
                    onClick={() => setActiveTab('documents')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'documents'
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Settings className="h-4 w-4 inline mr-2" />
                    Документы
                  </button>
                </nav>
              </div>

              {/* Содержимое вкладок */}
              <div className="mt-6">
                {activeTab === 'description' && (
                  <div className="space-y-6">
                    {/* Основная информация в 2 колонки */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Левая колонка */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <User className="h-5 w-5 text-blue-600" />
                            Основная информация
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-500">РК</Label>
                            <p className="text-lg font-semibold">{selectedOrder.rk}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Город</Label>
                            <p className="text-lg">{selectedOrder.city}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Имя мастера</Label>
                            <p className="text-lg">{selectedOrder.avitoName || <span className="text-gray-400">Не назначен</span>}</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Правая колонка */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Settings className="h-5 w-5 text-green-600" />
                            Детали заказа
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Клиент</Label>
                            <p className="text-lg font-semibold">{selectedOrder.clientName}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Телефон</Label>
                            <p className="text-lg flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              {selectedOrder.phone || <span className="text-gray-400">Не указан</span>}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Тип заявки</Label>
                            <p className="text-lg">
                              <Badge variant="outline">
                                {selectedOrder.typeOrder}
                              </Badge>
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Адрес</Label>
                            <p className="text-lg flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              {selectedOrder.address}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Дата встречи</Label>
                            <p className="text-lg flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {formatDate(selectedOrder.dateMeeting)}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Тип техники</Label>
                            <p className="text-lg">
                              <Badge variant="outline">
                                {selectedOrder.typeEquipment}
                              </Badge>
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Статус</Label>
                            <p className="text-lg">
                              <Badge 
                                className={`${statusColors[selectedOrder.statusOrder as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200'}`}
                              >
                                {selectedOrder.statusOrder}
                              </Badge>
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Описание проблемы */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileText className="h-5 w-5 text-orange-600" />
                          Описание проблемы
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {selectedOrder.problem}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Оператор */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <User className="h-5 w-5 text-purple-600" />
                          Оператор
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Имя оператора</Label>
                            <p className="text-lg font-semibold">{selectedOrder.operator.name}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-500">ID оператора</Label>
                            <p className="text-lg font-mono">{selectedOrder.operatorNameId}</p>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Записи звонков</Label>
                          <div className="mt-2 space-y-2">
                            {loadingCalls ? (
                              <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                <LoadingSpinner size="sm" className="text-gray-400" />
                                <span className="text-gray-500">Загрузка записей...</span>
                              </div>
                            ) : orderCalls.length > 0 ? (
                              orderCalls.map((call, index) => {
                                const isCurrentCall = audioPlayer.currentCallId === call.id;
                                const hasRecording = !!call.recordingPath;

                                return (
                                  <div key={call.id || index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                        <div>
                                          <span className="text-blue-800 font-medium">Звонок #{call.id}</span>
                                          <div className="text-xs text-blue-600">
                                            {new Date(call.dateCreate).toLocaleString('ru-RU')}
                                          </div>
                                        </div>
                                      </div>
                                      {!isCurrentCall && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => loadRecording(call)}
                                          className="h-8"
                                        >
                                          <Play className="h-4 w-4 mr-1" />
                                          Загрузить
                                        </Button>
                                      )}
                                    </div>

                                    {isCurrentCall && (
                                      <div className="flex items-center gap-2 p-2 bg-white rounded border">
                                        {/* Кнопки управления */}
                                        <div className="flex items-center gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={skipBackward}
                                            className="h-6 w-6 p-0"
                                          >
                                            <SkipBack className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={togglePlayPause}
                                            className="h-6 w-6 p-0"
                                          >
                                            {audioPlayer.isPlaying ? (
                                              <Pause className="h-3 w-3" />
                                            ) : (
                                              <Play className="h-3 w-3" />
                                            )}
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={skipForward}
                                            className="h-6 w-6 p-0"
                                          >
                                            <SkipForward className="h-3 w-3" />
                                          </Button>
                                        </div>

                                        {/* Прогресс бар */}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <span>{formatTime(audioPlayer.currentTime)}</span>
                                            <div className="flex-1 bg-gray-200 rounded-full h-1 cursor-pointer"
                                                 onClick={(e) => {
                                                   const rect = e.currentTarget.getBoundingClientRect();
                                                   const clickX = e.clientX - rect.left;
                                                   const percentage = clickX / rect.width;
                                                   const newTime = percentage * audioPlayer.duration;
                                                   seekTo(newTime);
                                                 }}>
                                              <div
                                                className="bg-blue-500 h-1 rounded-full transition-all duration-100"
                                                style={{ width: `${audioPlayer.duration > 0 ? (audioPlayer.currentTime / audioPlayer.duration) * 100 : 0}%` }}
                                              />
                                            </div>
                                            <span>{formatTime(audioPlayer.duration)}</span>
                                          </div>
                                        </div>

                                        {/* Громкость */}
                                        <div className="flex items-center gap-1">
                                          <Volume2 className="h-3 w-3 text-gray-500" />
                                          <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={audioPlayer.volume}
                                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                                            className="w-12 h-1"
                                          />
                                        </div>

                                        {/* Кнопка остановки */}
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={stopPlayback}
                                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                        >
                                          ×
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                <FileText className="h-5 w-5 text-gray-400" />
                                <span className="text-gray-500">Записи не найдены</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeTab === 'master' && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <User className="h-5 w-5 text-blue-600" />
                          Информация о мастере
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Имя мастера</Label>
                            <p className="text-lg font-semibold">{selectedOrder.avitoName || <span className="text-gray-400">Не назначен</span>}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Мастер ID</Label>
                            <p className="text-lg font-mono text-lg">{selectedOrder.masterId || <span className="text-gray-400">-</span>}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          Финансовые результаты
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Итог</Label>
                            <p className="text-2xl font-bold text-green-600">
                              {selectedOrder.result ? `${selectedOrder.result} ₽` : <span className="text-gray-400">Не указан</span>}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Расходы</Label>
                            <p className="text-2xl font-bold text-red-600">
                              {selectedOrder.expenditure ? `${selectedOrder.expenditure} ₽` : <span className="text-gray-400">Не указаны</span>}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Чистая прибыль</Label>
                            <p className="text-2xl font-bold text-blue-600">
                              {selectedOrder.clean ? `${selectedOrder.clean} ₽` : <span className="text-gray-400">Не указана</span>}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          Документы заказа
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label className="text-sm font-medium text-gray-500">БСО документ</Label>
                            <div className="mt-2">
                              {selectedOrder.bsoDoc ? (
                                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                  <FileText className="h-5 w-5 text-green-600" />
                                  <span className="text-green-800 font-medium">{selectedOrder.bsoDoc}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                  <FileText className="h-5 w-5 text-gray-400" />
                                  <span className="text-gray-500">Документ не загружен</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Документ расходов</Label>
                            <div className="mt-2">
                              {selectedOrder.expenditureDoc ? (
                                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <FileText className="h-5 w-5 text-blue-600" />
                                  <span className="text-blue-800 font-medium">{selectedOrder.expenditureDoc}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                  <FileText className="h-5 w-5 text-gray-400" />
                                  <span className="text-gray-500">Документ не загружен</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Info className="h-5 w-5 text-gray-600" />
                          Системная информация
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Дата создания:</span>
                              <span className="font-medium">{new Date(selectedOrder.createDate).toLocaleString('ru-RU')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Последнее обновление:</span>
                              <span className="font-medium">{new Date(selectedOrder.updatedAt).toLocaleString('ru-RU')}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-500">ID заказа:</span>
                              <span className="font-medium">#{selectedOrder.id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">ID оператора:</span>
                              <span className="font-medium">{selectedOrder.operatorNameId}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          )}
          </div>
        </div>
      )}

      {/* Модальное окно редактирования заказа */}
      {isEditModalOpen && selectedOrder && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-[85vw] h-[80vh] max-w-none max-h-none flex flex-col"
            style={{ width: '85vw', height: '80vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Заголовок */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Редактирование заказа</h2>
                <p className="text-gray-600">ID: #{selectedOrder.id}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditModalOpen(false)}
                className="h-8 w-8 p-0"
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>

            {/* Навигация по вкладкам */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveEditTab('description')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeEditTab === 'description'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Описание
              </button>
              <button
                onClick={() => setActiveEditTab('master')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeEditTab === 'master'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Мастер
              </button>
              <button
                onClick={() => setActiveEditTab('documents')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeEditTab === 'documents'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Документы
              </button>
            </div>

            {/* Содержимое вкладок */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeEditTab === 'description' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Основная информация */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <User className="h-5 w-5 text-blue-600" />
                          Основная информация
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">РК</Label>
                          <Input 
                            value={selectedOrder.rk} 
                            disabled={userRole === 'operator'}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Город</Label>
                          <Input 
                            value={selectedOrder.city} 
                            onChange={(e) => setSelectedOrder({...selectedOrder, city: e.target.value})}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Имя мастера</Label>
                          <Input 
                            value={selectedOrder.avitoName || ''} 
                            disabled={userRole === 'operator'}
                            className="mt-1"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Детали заказа */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Settings className="h-5 w-5 text-green-600" />
                          Детали заказа
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Клиент</Label>
                          <Input 
                            value={selectedOrder.clientName} 
                            disabled={userRole === 'operator'}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Телефон</Label>
                          <Input 
                            value={selectedOrder.phone || ''} 
                            onChange={(e) => setSelectedOrder({...selectedOrder, phone: e.target.value})}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Тип заявки</Label>
                          <Select 
                            value={selectedOrder.typeOrder} 
                            onValueChange={(value: string) => setSelectedOrder({...selectedOrder, typeOrder: value})}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Впервые">Впервые</SelectItem>
                              <SelectItem value="Повтор">Повтор</SelectItem>
                              <SelectItem value="Гарантия">Гарантия</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Адрес</Label>
                          <Input 
                            value={selectedOrder.address} 
                            onChange={(e) => setSelectedOrder({...selectedOrder, address: e.target.value})}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Дата встречи</Label>
                          <Input 
                            type="datetime-local"
                            value={selectedOrder.dateMeeting ? new Date(selectedOrder.dateMeeting).toISOString().slice(0, 16) : ''} 
                            onChange={(e) => {
                              // Создаем дату из локального времени, но сохраняем как UTC
                              const localDate = new Date(e.target.value);
                              const utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);
                              setSelectedOrder({...selectedOrder, dateMeeting: utcDate.toISOString()});
                            }}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Тип техники</Label>
                          <Select 
                            value={selectedOrder.typeEquipment} 
                            onValueChange={(value: string) => setSelectedOrder({...selectedOrder, typeEquipment: value})}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="КП">КП (Компьютерная помощь)</SelectItem>
                              <SelectItem value="БТ">БТ (Бытовая техника)</SelectItem>
                              <SelectItem value="МНЧ">МНЧ (Муж на час)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Статус</Label>
                          <Select 
                            value={selectedOrder.statusOrder} 
                            onValueChange={(value: string) => setSelectedOrder({...selectedOrder, statusOrder: value})}
                            disabled={userRole === 'operator'}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Ожидает">Ожидает</SelectItem>
                              <SelectItem value="Принял">Принял</SelectItem>
                              <SelectItem value="В пути">В пути</SelectItem>
                              <SelectItem value="В работе">В работе</SelectItem>
                              <SelectItem value="Готово">Готово</SelectItem>
                              <SelectItem value="Отказ">Отказ</SelectItem>
                              <SelectItem value="Модерн">Модерн</SelectItem>
                              <SelectItem value="Незаказ">Незаказ</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Описание проблемы */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        Описание проблемы
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea 
                        value={selectedOrder.problem} 
                        onChange={(e) => setSelectedOrder({...selectedOrder, problem: e.target.value})}
                        className="min-h-[100px]"
                        placeholder="Опишите проблему..."
                      />
                    </CardContent>
                  </Card>

                  {/* Оператор */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5 text-purple-600" />
                        Оператор
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Имя оператора</Label>
                          <p className="text-lg font-semibold">{selectedOrder.operator.name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">ID оператора</Label>
                          <p className="text-lg font-mono">{selectedOrder.operatorNameId}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Запись звонка</Label>
                        <Input 
                          value={selectedOrder.callRecord || ''} 
                          disabled={userRole === 'operator'}
                          className="mt-1"
                          placeholder="Название файла записи..."
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeEditTab === 'master' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600" />
                        Информация о мастере
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Имя мастера</Label>
                          <Input 
                            value={selectedOrder.avitoName || ''} 
                            disabled={userRole === 'operator'}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Мастер ID</Label>
                          <Input 
                            type="number"
                            value={selectedOrder.masterId || ''} 
                            disabled={userRole === 'operator'}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Финансовые результаты
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Итог</Label>
                          <Input 
                            type="number"
                            value={selectedOrder.result || ''} 
                            disabled={userRole === 'operator'}
                            className="mt-1"
                            placeholder="Сумма в рублях"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Расходы</Label>
                          <Input 
                            type="number"
                            value={selectedOrder.expenditure || ''} 
                            disabled={userRole === 'operator'}
                            className="mt-1"
                            placeholder="Сумма в рублях"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Чистая прибыль</Label>
                          <Input 
                            type="number"
                            value={selectedOrder.clean || ''} 
                            disabled={userRole === 'operator'}
                            className="mt-1"
                            placeholder="Сумма в рублях"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeEditTab === 'documents' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Документы заказа
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">БСО документ</Label>
                          <Input 
                            value={selectedOrder.bsoDoc || ''} 
                            disabled={userRole === 'operator'}
                            className="mt-1"
                            placeholder="Название файла БСО..."
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Документ расходов</Label>
                          <Input 
                            value={selectedOrder.expenditureDoc || ''} 
                            disabled={userRole === 'operator'}
                            className="mt-1"
                            placeholder="Название файла расходов..."
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Info className="h-5 w-5 text-gray-600" />
                        Системная информация
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Дата создания:</span>
                            <span className="font-medium">{new Date(selectedOrder.createDate).toLocaleString('ru-RU')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Последнее обновление:</span>
                            <span className="font-medium">{new Date(selectedOrder.updatedAt).toLocaleString('ru-RU')}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500">ID заказа:</span>
                            <span className="font-medium">#{selectedOrder.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">ID оператора:</span>
                            <span className="font-medium">{selectedOrder.operatorNameId}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Кнопки действий */}
            <div className="flex items-center justify-end gap-3 p-6 border-t">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Отмена
              </Button>
              <Button
                onClick={handleSaveOrder}
                disabled={updateOrderMutation.isPending}
              >
                {updateOrderMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Сохранение...
                  </>
                ) : (
                  'Сохранить изменения'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно создания заказа */}
      <CreateOrderModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onOrderCreated={() => {
          setIsCreateModalOpen(false);
        }}
      />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
