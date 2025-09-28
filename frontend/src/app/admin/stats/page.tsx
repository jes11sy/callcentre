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
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  BarChart3, 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  ShoppingCart, 
  TrendingUp, 
  Calendar,
  MapPin,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Filter,
  Users,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface OverallStats {
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
  };
  operatorStats: Array<{
    operatorName: string;
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

export default function AdminStatsPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('');
  const [viewMode, setViewMode] = useState<'overall' | 'operator'>('overall');

  // Устанавливаем даты по умолчанию (последние 30 дней)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    // Проверяем, что даты не в будущем
    const currentYear = new Date().getFullYear();
    const endYear = end.getFullYear();
    const startYear = start.getFullYear();
    
    // Если даты в будущем, устанавливаем текущий год
    if (endYear > currentYear || startYear > currentYear) {
      end.setFullYear(currentYear);
      start.setFullYear(currentYear);
    }
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  // Получение общей статистики
  const { data: overallStats, isLoading: isLoadingOverall, error: overallError, refetch: refetchOverall } = useQuery<OverallStats>({
    queryKey: ['overallStats', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/stats/overall?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки общей статистики');
      }

      return response.json();
    },
    enabled: !!startDate && !!endDate && viewMode === 'overall'
  });

  // Получение статистики оператора
  const { data: operatorStats, isLoading: isLoadingOperator, error: operatorError, refetch: refetchOperator } = useQuery<OperatorStats>({
    queryKey: ['operatorStats', selectedOperator, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/stats/operator/${selectedOperator}?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки статистики оператора');
      }

      return response.json();
    },
    enabled: !!selectedOperator && !!startDate && !!endDate && viewMode === 'operator'
  });

  const handleDateChange = () => {
    if (startDate && endDate) {
      if (viewMode === 'overall') {
        refetchOverall();
      } else if (viewMode === 'operator' && selectedOperator) {
        refetchOperator();
      }
    }
  };

  const resetToCurrentPeriod = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ожидает': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Принял': return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'В пути': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'В работе': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Готово': return 'bg-green-100 text-green-800 border-green-200';
      case 'Отказ': return 'bg-red-100 text-red-800 border-red-200';
      case 'Модерн': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Незаказ': return 'bg-gray-900 text-white border-gray-900';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Ожидает': return 'Ожидает';
      case 'Принял': return 'Принял';
      case 'В пути': return 'В пути';
      case 'В работе': return 'В работе';
      case 'Готово': return 'Готово';
      case 'Отказ': return 'Отказ';
      case 'Модерн': return 'Модерн';
      case 'Незаказ': return 'Незаказ';
      default: return status;
    }
  };

  const isLoading = viewMode === 'overall' ? isLoadingOverall : isLoadingOperator;
  const error = viewMode === 'overall' ? overallError : operatorError;
  const stats = viewMode === 'overall' ? overallStats : operatorStats;

  if (error) {
    return (
      <DashboardLayout variant="admin" requiredRole="admin">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600">Ошибка при загрузке статистики</p>
                <Button onClick={() => viewMode === 'overall' ? refetchOverall() : refetchOperator()} className="mt-4">
                  Попробовать снова
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout variant="admin" requiredRole="admin">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <BarChart3 className="h-8 w-8 mr-3 text-purple-600" />
                  Статистика колл-центра
                </h1>
                <p className="text-gray-600 mt-2">
                  Анализ работы всех операторов и общая статистика
                </p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Настройки отчета
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="viewMode">Режим просмотра</Label>
                  <Select value={viewMode} onValueChange={(value: 'overall' | 'operator') => setViewMode(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overall">Общая статистика</SelectItem>
                      <SelectItem value="operator">Статистика оператора</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {viewMode === 'operator' && (
                  <div className="space-y-2">
                    <Label htmlFor="operator">Оператор</Label>
                    <Input
                      id="operator"
                      placeholder="ID оператора"
                      value={selectedOperator}
                      onChange={(e) => setSelectedOperator(e.target.value)}
                    />
                  </div>
                )}

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
              </div>

              <div className="mt-4 flex gap-2">
                <Button onClick={handleDateChange}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Применить фильтр
                </Button>
                <Button onClick={resetToCurrentPeriod} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Сбросить
                </Button>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Загрузка статистики...</p>
            </div>
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
                    {viewMode === 'operator' && 'operator' in stats && (
                      <div className="text-right">
                        <h3 className="text-lg font-semibold">Оператор</h3>
                        <p className="text-gray-600">{stats.operator.name}</p>
                        <p className="text-sm text-gray-500">{stats.operator.city}</p>
                      </div>
                    )}
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

              {/* Orders by Status (only for operator view) */}
              {viewMode === 'operator' && 'byStatus' in stats.orders && (
                <Card>
                  <CardHeader>
                    <CardTitle>Заказы по статусам</CardTitle>
                    <CardDescription>
                      Распределение заказов по текущим статусам
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {Object.entries(stats.orders.byStatus).map(([status, count]) => (
                        <div key={status} className="text-center">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                            {getStatusText(status)}
                          </div>
                          <div className="text-2xl font-bold mt-2">{count}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Daily Stats (only for operator view) */}
              {viewMode === 'operator' && 'dailyStats' in stats && (
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
              )}

              {/* Operator Stats (only for overall view) */}
              {viewMode === 'overall' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Статистика по операторам
                    </CardTitle>
                    <CardDescription>
                      Топ операторов по количеству звонков
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.operatorStats.slice(0, 10).map((operator, index) => (
                        <div key={operator.operatorName} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                            </div>
                            <span className="font-medium">{operator.operatorName}</span>
                          </div>
                          <Badge variant="secondary">{operator.calls}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* City and RK Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Статистика по городам
                    </CardTitle>
                    <CardDescription>
                      Топ городов по количеству звонков
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.cityStats.slice(0, 10).map((city, index) => (
                        <div key={city.city} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                            </div>
                            <span className="font-medium">{city.city}</span>
                          </div>
                          <Badge variant="secondary">{city.calls}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Статистика по РК
                    </CardTitle>
                    <CardDescription>
                      Топ рекламных кампаний
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.rkStats.slice(0, 10).map((rk, index) => (
                        <div key={rk.rk} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-green-600">{index + 1}</span>
                            </div>
                            <span className="font-medium">{rk.rk}</span>
                          </div>
                          <Badge variant="secondary">{rk.calls}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
}