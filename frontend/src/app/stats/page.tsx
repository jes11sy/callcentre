'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  ShoppingCart, 
  TrendingUp, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Filter,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { LoadingState, LoadingSpinner } from '@/components/ui/loading';
import { ErrorBoundary, ErrorMessage, EmptyState } from '@/components/ui/error-boundary';
import { notifications } from '@/components/ui/notifications';

interface OperatorStats {
  operator: {
    id: number;
    name: string;
    city: string;
  };
  period: {
    startDate: string;
    endDate: string;
  };
  calls: {
    total: number;
    accepted: number;
    missed: number;
    acceptanceRate: number;
  };
  orders: {
    total: number;
    byStatus: Record<string, number>;
  };
  dailyStats: Array<{
    date: string;
    calls: number;
  }>;
  cityStats: Array<{
    city: string;
    calls: number;
  }>;
  rkStats: Array<{
    rk: string;
    calls: number;
  }>;
}

export default function StatsPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Устанавливаем даты по умолчанию (последние 30 дней)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  // Получение статистики
  const { data: stats, isLoading, error, refetch } = useQuery<OperatorStats>({
    queryKey: ['operatorStats', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/stats/my?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки статистики');
      }

      return response.json();
    },
    enabled: !!startDate && !!endDate
  });

  const handleDateChange = () => {
    if (startDate && endDate) {
      refetch();
    }
  };

  const resetToCurrentPeriod = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
    refetch();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };


  if (error) {
    return (
      <DashboardLayout variant="operator" requiredRole="operator">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <ErrorMessage 
              error={error.message || 'Ошибка при загрузке статистики'}
              onRetry={() => refetch()}
            />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout variant="operator" requiredRole="operator">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <BarChart3 className="h-8 w-8 mr-3 text-purple-600" />
                  Моя статистика
                </h1>
                <p className="text-gray-600 mt-2">
                  Анализ вашей работы и производительности
                </p>
              </div>
            </div>
          </div>

          {/* Date Filter */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Фильтр по датам
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Начальная дата</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Конечная дата</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <div className="flex gap-2">
                    <Button onClick={handleDateChange} className="flex-1">
                      <Calendar className="mr-2 h-4 w-4" />
                      Применить фильтр
                    </Button>
                    <Button onClick={resetToCurrentPeriod} variant="outline" className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Сбросить
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <LoadingState 
              message="Загрузка статистики..." 
              size="lg"
              className="py-12"
            />
          ) : stats ? (
            <div className="space-y-6">
              {/* Period Info */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Период анализа</h3>
                      <p className="text-gray-600">
                        {formatDate(stats.period.startDate)} - {formatDate(stats.period.endDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <h3 className="text-lg font-semibold">Оператор</h3>
                      <p className="text-gray-600">{stats.operator.name}</p>
                      <p className="text-sm text-gray-500">{stats.operator.city}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Main Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Всего звонков</CardTitle>
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.calls.total}</div>
                    <p className="text-xs text-muted-foreground">
                      за период
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Принятые звонки</CardTitle>
                    <PhoneCall className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats.calls.accepted}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.calls.acceptanceRate}% от общего числа
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Пропущенные звонки</CardTitle>
                    <PhoneOff className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{stats.calls.missed}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.calls.total > 0 ? Math.round((stats.calls.missed / stats.calls.total) * 100) : 0}% от общего числа
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Созданные заказы</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">{stats.orders.total}</div>
                    <p className="text-xs text-muted-foreground">
                      за период
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Daily Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Активность по дням</CardTitle>
                  <CardDescription>
                    Количество звонков за последние 7 дней
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(() => {
                      // Группируем данные по датам и суммируем звонки
                      const groupedStats = stats.dailyStats.reduce((acc, day) => {
                        if (acc[day.date]) {
                          acc[day.date].calls += day.calls;
                        } else {
                          acc[day.date] = { ...day };
                        }
                        return acc;
                      }, {} as Record<string, { date: string; calls: number }>);

                      // Сортируем по дате
                      const sortedStats = Object.values(groupedStats).sort((a, b) => 
                        new Date(a.date).getTime() - new Date(b.date).getTime()
                      );

                      const maxCalls = Math.max(...sortedStats.map(d => d.calls), 1);

                      return sortedStats.map((day, index) => (
                        <div key={`${day.date}-${index}`} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-purple-600">
                                {new Date(day.date).getDate()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{formatDate(day.date)}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(day.date).toLocaleDateString('ru-RU', { weekday: 'long' })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-purple-600 h-2 rounded-full" 
                                style={{ 
                                  width: `${Math.min((day.calls / maxCalls) * 100, 100)}%` 
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium w-8 text-right">{day.calls}</span>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </CardContent>
              </Card>

            </div>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
}
