'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import CreateOrderModal from '@/components/orders/CreateOrderModal';
import { OptimizedPagination } from '@/components/ui/optimized-pagination';

interface Order {
  id: number;
  rk: string;
  city: string;
  avitoName?: string;
  phone: string;
  typeOrder: string;
  clientName: string;
  address: string;
  dateMeeting: string;
  typeEquipment: string;
  problem: string;
  callRecord?: string;
  statusOrder: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  result?: string;
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

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [rkFilter, setRkFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const queryClient = useQueryClient();

  // Получение списка заказов
  const { data: ordersData, isLoading, error } = useQuery<OrdersResponse>({
    queryKey: ['orders', page, limit, search, statusFilter, cityFilter, rkFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
        ...(cityFilter && { city: cityFilter }),
        ...(rkFilter && { rk: rkFilter })
        // Сортировка всегда по дате встречи и статусу "Ожидает" - не передаем параметры сортировки
      });

      const response = await fetch(`/api/orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка при загрузке заказов');
      }

      return response.json();
    }
  });

  // Обновление статуса заказа
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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
      toast.success('Статус заказа обновлен');
    },
    onError: () => {
      toast.error('Ошибка при обновлении статуса');
    }
  });

  // Удаление заказа
  const deleteOrderMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка при удалении заказа');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Заказ удален');
    },
    onError: () => {
      toast.error('Ошибка при удалении заказа');
    }
  });

  const handleStatusChange = (orderId: number, newStatus: string) => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  const handleDeleteOrder = (orderId: number) => {
    if (confirm('Вы уверены, что хотите удалить этот заказ?')) {
      deleteOrderMutation.mutate(orderId);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsEditModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    });
  };

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
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Заказы</h1>
          <p className="text-gray-600 mt-1">Управление заказами и их статусами</p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Добавить заказ
        </Button>
      </div>

      {/* Фильтры */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Фильтры и поиск
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Поиск</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Поиск по клиенту, адресу..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

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

      {/* Таблица заказов */}
      <Card>
        <CardHeader>
          <CardTitle>Список заказов</CardTitle>
          <CardDescription>
            Всего заказов: {ordersData?.pagination?.total || 0}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Клиент</TableHead>
                    <TableHead>Город</TableHead>
                    <TableHead>РК</TableHead>
                    <TableHead>Тип заявки</TableHead>
                    <TableHead>Тип техники</TableHead>
                    <TableHead>Дата встречи</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Оператор</TableHead>
                    <TableHead>Дата создания</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersData?.orders?.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.clientName}</div>
                          <div className="text-sm text-gray-500">{order.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>{order.city}</TableCell>
                      <TableCell>{order.rk}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {order.typeOrder || 'Не указан'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {order.typeEquipment}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(order.dateMeeting)}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs whitespace-nowrap ${statusColors[order.statusOrder as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                          {statusLabels[order.statusOrder as keyof typeof statusLabels] || order.statusOrder}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.operator.name}</TableCell>
                      <TableCell>{formatDate(order.createDate)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewOrder(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditOrder(order)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteOrder(order.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Информация о заказе #{selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              Подробная информация о заказе
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Основная информация */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Основная информация</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Клиент</Label>
                      <p className="text-lg font-semibold">{selectedOrder.clientName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Телефон</Label>
                      <p className="text-lg">{selectedOrder.phone}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Адрес</Label>
                      <p className="text-lg">{selectedOrder.address}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Город</Label>
                      <p className="text-lg">{selectedOrder.city}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">РК</Label>
                      <p className="text-lg">{selectedOrder.rk}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Детали заказа</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Тип заявки</Label>
                      <Badge className="mt-1">
                        {typeOrderLabels[selectedOrder.typeOrder]}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Тип техники</Label>
                      <Badge className="mt-1">
                        {selectedOrder.typeEquipment}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Статус</Label>
                      <Badge className={`mt-1 ${statusColors[selectedOrder.statusOrder as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                        {statusLabels[selectedOrder.statusOrder as keyof typeof statusLabels] || selectedOrder.statusOrder}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Дата встречи</Label>
                      <p className="text-lg">{formatDate(selectedOrder.dateMeeting)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Оператор</Label>
                      <p className="text-lg">{selectedOrder.operator.name}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Описание проблемы */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Описание проблемы</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedOrder.problem}</p>
                </CardContent>
              </Card>

              {/* Дополнительная информация */}
              {(selectedOrder.result || selectedOrder.expenditure || selectedOrder.clean) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Дополнительная информация</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedOrder.result && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Результат</Label>
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedOrder.result}</p>
                      </div>
                    )}
                    {selectedOrder.expenditure && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Расходы</Label>
                        <p className="text-lg font-semibold">{selectedOrder.expenditure} ₽</p>
                      </div>
                    )}
                    {selectedOrder.clean && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Чистая прибыль</Label>
                        <p className="text-lg font-semibold text-green-600">{selectedOrder.clean} ₽</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Модальное окно создания заказа */}
      <CreateOrderModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onOrderCreated={() => {
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
}
