'use client';

import { useState, useEffect } from 'react';
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
import { Label } from '@/components/ui/label';
import { 
  Phone, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  BarChart3,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import authApi from '@/lib/auth';
import { toast } from 'sonner';

// Types
interface PhoneNumber {
  id: number;
  number: string;
  rk?: string;
  city?: string;
  avitoName?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    calls: number;
  };
}

// Form schemas
const createPhoneSchema = z.object({
  number: z.string().min(10, 'Номер телефона должен содержать минимум 10 цифр'),
  rk: z.string().optional(),
  city: z.string().optional(),
  avitoName: z.string().optional(),
});

const editPhoneSchema = z.object({
  rk: z.string().optional(),
  city: z.string().optional(),
  avitoName: z.string().optional(),
});

type CreatePhoneForm = z.infer<typeof createPhoneSchema>;
type EditPhoneForm = z.infer<typeof editPhoneSchema>;

export default function TelephonyPage() {
  const [phones, setPhones] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState<PhoneNumber | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Forms
  const createForm = useForm<CreatePhoneForm>({
    resolver: zodResolver(createPhoneSchema),
  });

  const editForm = useForm<EditPhoneForm>({
    resolver: zodResolver(editPhoneSchema),
  });

  // Load phone numbers
  const loadPhones = async () => {
    try {
      setLoading(true);
      const response = await authApi.get('/phones');
      setPhones(response.data.phones);
    } catch (error: any) {
      console.error('Error loading phone numbers:', error);
      toast.error('Ошибка загрузки номеров телефонов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhones();
  }, []);

  // Create phone
  const handleCreatePhone = async (data: CreatePhoneForm) => {
    try {
      setActionLoading(true);
      await authApi.post('/phones', data);
      toast.success('Номер телефона создан успешно');
      setIsCreateDialogOpen(false);
      createForm.reset();
      loadPhones();
    } catch (error: any) {
      console.error('Error creating phone number:', error);
      toast.error(error.response?.data?.error?.message || 'Ошибка создания номера');
    } finally {
      setActionLoading(false);
    }
  };

  // Edit phone
  const handleEditPhone = async (data: EditPhoneForm) => {
    if (!selectedPhone) return;

    try {
      setActionLoading(true);
      await authApi.put(`/phones/${selectedPhone.id}`, data);
      toast.success('Номер телефона обновлен успешно');
      setIsEditDialogOpen(false);
      setSelectedPhone(null);
      editForm.reset();
      loadPhones();
    } catch (error: any) {
      console.error('Error updating phone number:', error);
      toast.error(error.response?.data?.error?.message || 'Ошибка обновления номера');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete phone
  const handleDeletePhone = async () => {
    if (!selectedPhone) return;

    try {
      setActionLoading(true);
      await authApi.delete(`/phones/${selectedPhone.id}`);
      toast.success('Номер телефона удален успешно');
      setIsDeleteDialogOpen(false);
      setSelectedPhone(null);
      loadPhones();
    } catch (error: any) {
      console.error('Error deleting phone number:', error);
      toast.error(error.response?.data?.error?.message || 'Ошибка удаления номера');
    } finally {
      setActionLoading(false);
    }
  };

  // Get phone statistics
  const handleGetStats = async (phone: PhoneNumber) => {
    try {
      const response = await authApi.get(`/phones/${phone.id}/stats`);
      toast.success('Статистика загружена');
      console.log('Phone stats:', response.data);
      // TODO: Show stats in a modal or separate view
    } catch (error: any) {
      console.error('Error getting phone stats:', error);
      toast.error('Ошибка получения статистики');
    }
  };

  // Open edit dialog
  const openEditDialog = (phone: PhoneNumber) => {
    setSelectedPhone(phone);
    editForm.reset({
      number: phone.number,
      rk: phone.rk || '',
      city: phone.city || '',
      avitoName: phone.avitoName || '',
    });
    setIsEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (phone: PhoneNumber) => {
    setSelectedPhone(phone);
    setIsDeleteDialogOpen(true);
  };

  // Filter phones
  const filteredPhones = phones.filter(phone =>
    phone.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (phone.rk && phone.rk.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (phone.city && phone.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (phone.avitoName && phone.avitoName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Format phone number for display
  const formatPhoneNumber = (number: string) => {
    // Simple formatting for Russian phone numbers
    if (number.length === 11 && number.startsWith('7')) {
      return `+7 (${number.slice(1, 4)}) ${number.slice(4, 7)}-${number.slice(7, 9)}-${number.slice(9)}`;
    }
    return number;
  };

  return (
    <DashboardLayout variant="admin" requiredRole="admin">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <Phone className="h-8 w-8 mr-3 text-purple-600" />
                  Управление телефонией
                </h1>
                <p className="text-gray-600 mt-2">
                  Управляйте номерами телефонов и рекламными компаниями
                </p>
              </div>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => createForm.reset()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить номер
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader className="space-y-3">
                    <DialogTitle className="text-xl font-semibold flex items-center">
                      <Phone className="mr-3 h-5 w-5 text-primary" />
                      Добавить номер телефона
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Добавьте новый номер телефона для приема входящих звонков
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={createForm.handleSubmit(handleCreatePhone)} className="space-y-6 py-4">
                    {/* Основная информация */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-foreground border-b pb-2">Основная информация</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="number" className="text-sm font-medium">
                          Номер телефона <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="number"
                          {...createForm.register('number')}
                          placeholder="+7 (XXX) XXX-XX-XX"
                          className="h-10 font-mono"
                        />
                        {createForm.formState.errors.number && (
                          <p className="text-xs text-destructive mt-1">
                            {createForm.formState.errors.number.message}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Введите номер телефона в формате +7XXXXXXXXXX
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="rk" className="text-sm font-medium">
                            Рекламная кампания (РК)
                          </Label>
                          <Input
                            id="rk"
                            {...createForm.register('rk')}
                            placeholder="Яндекс Директ"
                            className="h-10"
                          />
                          <p className="text-xs text-muted-foreground">
                            Источник трафика или название РК
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="city" className="text-sm font-medium">
                            Город
                          </Label>
                          <Input
                            id="city"
                            {...createForm.register('city')}
                            placeholder="Москва"
                            className="h-10"
                          />
                          <p className="text-xs text-muted-foreground">
                            Регион обслуживания номера
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="avitoName" className="text-sm font-medium">
                            Название аккаунта
                          </Label>
                          <Input
                            id="avitoName"
                            {...createForm.register('avitoName')}
                            placeholder="Название аккаунта Avito"
                            className="h-10"
                          />
                          <p className="text-xs text-muted-foreground">
                            Название аккаунта Avito для этого номера
                          </p>
                        </div>
                      </div>
                    </div>

                    <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-6 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                        disabled={actionLoading}
                        className="w-full sm:w-auto"
                      >
                        Отмена
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={actionLoading}
                        className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                      >
                        {actionLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Добавление...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Добавить номер
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Search and Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="md:col-span-2">
              <CardContent className="p-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Поиск по номеру, РК, городу или названию аккаунта..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {phones.length}
                  </div>
                  <p className="text-sm text-gray-600">Номеров телефонов</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Phones Table */}
          <Card>
            <CardHeader>
              <CardTitle>Список номеров телефонов</CardTitle>
              <CardDescription>
                Управляйте номерами телефонов для входящих звонков
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Загрузка номеров...</p>
                </div>
              ) : filteredPhones.length === 0 ? (
                <div className="text-center py-8">
                  <Phone className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600">
                    {searchTerm ? 'Номера не найдены' : 'Нет номеров телефонов'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Номер телефона</TableHead>
                      <TableHead>РК</TableHead>
                      <TableHead>Город</TableHead>
                      <TableHead>Название аккаунта</TableHead>
                      <TableHead>Звонки</TableHead>
                      <TableHead>Дата создания</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPhones.map((phone) => (
                      <TableRow key={phone.id}>
                        <TableCell className="font-medium font-mono">
                          {formatPhoneNumber(phone.number)}
                        </TableCell>
                        <TableCell>
                          {phone.rk ? (
                            <Badge variant="outline">{phone.rk}</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>{phone.city || '-'}</TableCell>
                        <TableCell>
                          {phone.avitoName ? (
                            <Badge variant="secondary">{phone.avitoName}</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {phone._count?.calls || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(phone.createdAt).toLocaleDateString('ru-RU')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGetStats(phone)}
                            >
                              <BarChart3 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(phone)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDeleteDialog(phone)}
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

          {/* Edit Phone Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-xl font-semibold flex items-center">
                  <Edit className="mr-3 h-5 w-5 text-primary" />
                  Редактировать номер телефона
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Измените настройки номера телефона
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={editForm.handleSubmit(handleEditPhone)} className="space-y-6 py-4">
                {/* Основная информация */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-foreground border-b pb-2">Основная информация</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-number" className="text-sm font-medium">
                      Номер телефона <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="edit-number"
                      {...editForm.register('number')}
                      placeholder="+7 (XXX) XXX-XX-XX"
                      className="h-10 font-mono"
                    />
                    {editForm.formState.errors.number && (
                      <p className="text-xs text-destructive mt-1">
                        {editForm.formState.errors.number.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Введите номер телефона в формате +7XXXXXXXXXX
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-rk" className="text-sm font-medium">
                        Рекламная кампания (РК)
                      </Label>
                      <Input
                        id="edit-rk"
                        {...editForm.register('rk')}
                        placeholder="Яндекс Директ"
                        className="h-10"
                      />
                      <p className="text-xs text-muted-foreground">
                        Источник трафика или название РК
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-city" className="text-sm font-medium">
                        Город
                      </Label>
                      <Input
                        id="edit-city"
                        {...editForm.register('city')}
                        placeholder="Москва"
                        className="h-10"
                      />
                      <p className="text-xs text-muted-foreground">
                        Регион обслуживания номера
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-avitoName" className="text-sm font-medium">
                        Название аккаунта
                      </Label>
                      <Input
                        id="edit-avitoName"
                        {...editForm.register('avitoName')}
                        placeholder="Название аккаунта Avito"
                        className="h-10"
                      />
                      <p className="text-xs text-muted-foreground">
                        Название аккаунта Avito для этого номера
                      </p>
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    disabled={actionLoading}
                    className="w-full sm:w-auto"
                  >
                    Отмена
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={actionLoading}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                  >
                    {actionLoading ? (
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

          {/* Delete Phone Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="sm:max-w-[450px]">
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-xl font-semibold flex items-center">
                  <AlertTriangle className="mr-3 h-5 w-5 text-destructive" />
                  Подтвердите удаление
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Вы уверены, что хотите удалить номер телефона{' '}
                  <span className="font-semibold text-foreground">{selectedPhone?.number}</span>?
                  <br />
                  <span className="text-destructive font-medium mt-2 block">
                    Это действие нельзя отменить.
                  </span>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={actionLoading}
                  className="w-full sm:w-auto"
                >
                  Отмена
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeletePhone}
                  disabled={actionLoading}
                  className="w-full sm:w-auto"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Удаление...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Удалить номер
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DashboardLayout>
  );
}
