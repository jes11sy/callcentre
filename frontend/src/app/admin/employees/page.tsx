'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
import {
  UserPlus,
  Edit,
  Trash2,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Camera,
  FileText,
  Eye
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import authApi from '@/lib/auth';
import { toast } from 'sonner';

// Types
interface Employee {
  id: number;
  name: string;
  login: string;
  city: string;
  status: 'active' | 'inactive' | 'on_call' | 'break';
  statusWork?: string;
  passport?: string;
  contract?: string;
  dateCreate: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    orders: number;
    calls: number;
  };
}

// Zod schemas for validation
const createEmployeeSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  login: z.string().min(3, 'Логин должен содержать минимум 3 символа'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
  passportPhoto: z.any().optional(),
  contractPhoto: z.any().optional(),
  note: z.string().optional(),
});

const editEmployeeSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  login: z.string().min(3, 'Логин должен содержать минимум 3 символа'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов').or(z.literal('')), // Optional password update
  city: z.string().min(2, 'Город должен содержать минимум 2 символа'),
  status: z.enum(['active', 'inactive', 'on_call', 'break'], { required_error: 'Выберите статус' }),
  statusWork: z.string().optional(),
  passport: z.string().optional(),
  contract: z.string().optional(),
  note: z.string().optional(),
});

type CreateEmployeeFormData = z.infer<typeof createEmployeeSchema>;
type EditEmployeeFormData = z.infer<typeof editEmployeeSchema>;

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [editPassportFile, setEditPassportFile] = useState<File | null>(null);
  const [editContractFile, setEditContractFile] = useState<File | null>(null);

  const createForm = useForm<CreateEmployeeFormData>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      name: '',
      login: '',
      password: '',
      passportPhoto: null,
      contractPhoto: null,
      note: '',
    },
  });

  const editForm = useForm<EditEmployeeFormData>({
    resolver: zodResolver(editEmployeeSchema),
    defaultValues: {
      name: '',
      login: '',
      password: '',
      city: '',
      status: 'active',
      statusWork: 'offline',
      passport: '',
      contract: '',
      note: '',
    },
  });

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await authApi.get('/employees');
      setEmployees(response.data.data);
    } catch (error: any) {
      console.error('Failed to fetch employees:', error);
      toast.error('Ошибка загрузки сотрудников', {
        description: error.response?.data?.error?.message || 'Произошла ошибка при загрузке списка сотрудников.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Функции для просмотра файлов сотрудников
  const viewEmployeePassport = async (employeeId: number) => {
    try {
      const response = await authApi.get(`/employees/${employeeId}/passport`);
      if (response.data.success) {
        window.open(response.data.url, '_blank');
      } else {
        toast.error('Фото паспорта не найдено');
      }
    } catch (error: any) {
      console.error('Error viewing passport:', error);
      toast.error('Ошибка при загрузке фото паспорта');
    }
  };

  const viewEmployeeContract = async (employeeId: number) => {
    try {
      const response = await authApi.get(`/employees/${employeeId}/contract`);
      if (response.data.success) {
        window.open(response.data.url, '_blank');
      } else {
        toast.error('Фото договора не найдено');
      }
    } catch (error: any) {
      console.error('Error viewing contract:', error);
      toast.error('Ошибка при загрузке фото договора');
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = useMemo(() => {
    if (!employees || !Array.isArray(employees)) {
      return [];
    }
    return employees.filter(employee =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.login.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const getStatusVariant = (status: Employee['status']) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'destructive';
      case 'on_call': return 'secondary';
      case 'break': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: Employee['status']) => {
    switch (status) {
      case 'active': return 'Активен';
      case 'inactive': return 'Неактивен';
      case 'on_call': return 'На звонке';
      case 'break': return 'Перерыв';
      default: return 'Неизвестно';
    }
  };

  const handleCreateEmployee = async (data: CreateEmployeeFormData) => {
    setIsSubmitting(true);
    try {
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('login', data.login);
      formData.append('password', data.password);
      formData.append('status', 'active'); // Default status
      
      if (data.note) {
        formData.append('note', data.note);
      }
      
      if (passportFile) {
        formData.append('passportPhoto', passportFile);
      }
      
      if (contractFile) {
        formData.append('contractPhoto', contractFile);
      }

      await authApi.post('/employees', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      toast.success('Сотрудник успешно добавлен', {
        description: `${data.name} добавлен в систему`
      });
      
      setIsCreateModalOpen(false);
      createForm.reset();
      setPassportFile(null);
      setContractFile(null);
      fetchEmployees();
    } catch (error: any) {
      console.error('Failed to create employee:', error);
      toast.error('Ошибка добавления сотрудника', {
        description: error.response?.data?.error?.message || 'Произошла ошибка при добавлении сотрудника.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditEmployee = async (data: EditEmployeeFormData) => {
    if (!selectedEmployee) return;
    setIsSubmitting(true);
    try {
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('login', data.login);
      formData.append('city', data.city || 'Не указан');
      formData.append('status', data.status);
      formData.append('statusWork', data.statusWork);
      
      if (data.password && data.password.trim() !== '') {
        formData.append('password', data.password);
      }
      
      if (data.note) {
        formData.append('note', data.note);
      }
      
      if (editPassportFile) {
        formData.append('passportPhoto', editPassportFile);
      }
      
      if (editContractFile) {
        formData.append('contractPhoto', editContractFile);
      }

      await authApi.put(`/employees/${selectedEmployee.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      toast.success('Данные сотрудника успешно обновлены', {
        description: `${data.name} обновлен в системе`
      });
      
      setIsEditModalOpen(false);
      editForm.reset();
      setEditPassportFile(null);
      setEditContractFile(null);
      fetchEmployees();
    } catch (error: any) {
      console.error('Failed to update employee:', error);
      toast.error('Ошибка обновления сотрудника', {
        description: error.response?.data?.error?.message || 'Произошла ошибка при обновлении данных сотрудника.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;
    setIsSubmitting(true);
    try {
      await authApi.delete(`/employees/${selectedEmployee.id}`);
      toast.success('Сотрудник успешно удален');
      setIsDeleteModalOpen(false);
      fetchEmployees();
    } catch (error: any) {
      console.error('Failed to delete employee:', error);
      toast.error('Ошибка удаления сотрудника', {
        description: error.response?.data?.error?.message || 'Произошла ошибка при удалении сотрудника.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusToggle = async (employee: Employee) => {
    setIsSubmitting(true);
    try {
      const newStatus = employee.status === 'active' ? 'inactive' : 'active';
      await authApi.patch(`/employees/${employee.id}/status`, { status: newStatus });
      toast.success(`Статус сотрудника ${employee.name} изменен на ${getStatusText(newStatus)}`);
      fetchEmployees();
    } catch (error: any) {
      console.error('Failed to toggle employee status:', error);
      toast.error('Ошибка изменения статуса', {
        description: error.response?.data?.error?.message || 'Произошла ошибка при изменении статуса сотрудника.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    editForm.reset({
      name: employee.name,
      login: employee.login,
      city: employee.city,
      status: employee.status === 'on_call' || employee.status === 'break' ? 'active' : employee.status,
      statusWork: employee.statusWork || 'offline',
      passport: employee.passport || '',
      contract: employee.contract || '',
      note: employee.note || '',
      password: '', // Always start with empty password
    });
    setEditPassportFile(null);
    setEditContractFile(null);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDeleteModalOpen(true);
  };

  const totalEmployees = employees?.length || 0;
  const activeEmployees = employees?.filter(e => e.status === 'active').length || 0;

  return (
    <DashboardLayout variant="admin" requiredRole="admin">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Управление сотрудниками</h1>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => createForm.reset()}>
                <UserPlus className="mr-2 h-4 w-4" /> Добавить сотрудника
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-xl font-semibold flex items-center">
                  <UserPlus className="mr-3 h-5 w-5 text-primary" />
                  Добавить нового сотрудника
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Заполните основные данные для создания нового оператора в системе
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={createForm.handleSubmit(handleCreateEmployee)} className="space-y-6 py-4">
                {/* Основные данные */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-foreground border-b pb-2">Основная информация</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Полное имя <span className="text-destructive">*</span>
                      </Label>
                      <Input 
                        id="name" 
                        {...createForm.register('name')} 
                        placeholder="Иван Иванович Петров"
                        className="h-10"
                      />
                      {createForm.formState.errors.name && (
                        <p className="text-xs text-destructive mt-1">{createForm.formState.errors.name.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="login" className="text-sm font-medium">
                        Логин <span className="text-destructive">*</span>
                      </Label>
                      <Input 
                        id="login" 
                        {...createForm.register('login')} 
                        placeholder="ivan.petrov"
                        className="h-10"
                      />
                      {createForm.formState.errors.login && (
                        <p className="text-xs text-destructive mt-1">{createForm.formState.errors.login.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Пароль <span className="text-destructive">*</span>
                    </Label>
                    <Input 
                      id="password" 
                      type="password" 
                      {...createForm.register('password')} 
                      placeholder="Минимум 6 символов"
                      className="h-10"
                    />
                    {createForm.formState.errors.password && (
                      <p className="text-xs text-destructive mt-1">{createForm.formState.errors.password.message}</p>
                    )}
                  </div>
                </div>

                {/* Документы */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-foreground border-b pb-2">Документы</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center">
                        <Camera className="mr-2 h-4 w-4 text-muted-foreground" />
                        Фото паспорта
                      </Label>
                      <FileUpload
                        onFileSelect={(file) => {
                          setPassportFile(file);
                          createForm.setValue('passportPhoto', file);
                        }}
                        value={passportFile}
                        placeholder="Загрузите фото паспорта"
                        className="min-h-[120px]"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center">
                        <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                        Фото договора
                      </Label>
                      <FileUpload
                        onFileSelect={(file) => {
                          setContractFile(file);
                          createForm.setValue('contractPhoto', file);
                        }}
                        value={contractFile}
                        placeholder="Загрузите фото договора"
                        className="min-h-[120px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Примечание */}
                <div className="space-y-2">
                  <Label htmlFor="note" className="text-sm font-medium">Примечание</Label>
                  <Textarea 
                    id="note" 
                    {...createForm.register('note')} 
                    placeholder="Дополнительная информация о сотруднике..."
                    className="min-h-[80px] resize-none"
                  />
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
                        Создание...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Добавить сотрудника
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего сотрудников</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEmployees}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Активные сотрудники</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeEmployees}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Неактивные сотрудники</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEmployees - activeEmployees}</div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Поиск по имени, логину или городу..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Список сотрудников</CardTitle>
            <CardDescription>Полный список всех операторов колл-центра.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Имя</TableHead>
                      <TableHead>Логин</TableHead>
                      <TableHead>Город</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Рабочий статус</TableHead>
                      <TableHead>Дата создания</TableHead>
                      <TableHead>Заказы</TableHead>
                      <TableHead>Звонки</TableHead>
                      <TableHead>Документы</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-gray-500">
                          {searchTerm ? 'Сотрудники не найдены.' : 'Нет сотрудников.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEmployees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">{employee.name}</TableCell>
                          <TableCell>{employee.login}</TableCell>
                          <TableCell>{employee.city}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(employee.status)}>
                              {getStatusText(employee.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>{employee.statusWork || '-'}</TableCell>
                          <TableCell>
                            {new Date(employee.dateCreate).toLocaleDateString('ru-RU')}
                          </TableCell>
                          <TableCell>{employee._count.orders}</TableCell>
                          <TableCell>{employee._count.calls}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              {employee.passport && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => viewEmployeePassport(employee.id)}
                                  className="h-6 w-6 p-0"
                                  title="Посмотреть паспорт"
                                >
                                  <Camera className="h-3 w-3" />
                                </Button>
                              )}
                              {employee.contract && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => viewEmployeeContract(employee.id)}
                                  className="h-6 w-6 p-0"
                                  title="Посмотреть договор"
                                >
                                  <FileText className="h-3 w-3" />
                                </Button>
                              )}
                              {!employee.passport && !employee.contract && (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusToggle(employee)}
                                disabled={isSubmitting}
                                className={employee.status === 'active' ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}
                              >
                                {isSubmitting && selectedEmployee?.id === employee.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : employee.status === 'active' ? (
                                  <XCircle className="h-4 w-4" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditModal(employee)}
                                disabled={isSubmitting}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openDeleteModal(employee)}
                                disabled={isSubmitting}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Employee Dialog */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-xl font-semibold flex items-center">
                <Edit className="mr-3 h-5 w-5 text-primary" />
                Редактировать сотрудника
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Измените данные сотрудника в системе
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={editForm.handleSubmit(handleEditEmployee)} className="space-y-6 py-4">
              {/* Основные данные */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground border-b pb-2">Основная информация</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name" className="text-sm font-medium">
                      Полное имя <span className="text-destructive">*</span>
                    </Label>
                    <Input 
                      id="edit-name" 
                      {...editForm.register('name')} 
                      placeholder="Иван Иванович Петров"
                      className="h-10"
                    />
                    {editForm.formState.errors.name && (
                      <p className="text-xs text-destructive mt-1">{editForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-login" className="text-sm font-medium">
                      Логин <span className="text-destructive">*</span>
                    </Label>
                    <Input 
                      id="edit-login" 
                      {...editForm.register('login')} 
                      placeholder="ivan.petrov"
                      className="h-10"
                    />
                    {editForm.formState.errors.login && (
                      <p className="text-xs text-destructive mt-1">{editForm.formState.errors.login.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-password" className="text-sm font-medium">
                      Новый пароль
                    </Label>
                    <Input 
                      id="edit-password" 
                      type="password" 
                      {...editForm.register('password')} 
                      placeholder="Оставьте пустым, если не меняете"
                      className="h-10"
                    />
                    {editForm.formState.errors.password && (
                      <p className="text-xs text-destructive mt-1">{editForm.formState.errors.password.message}</p>
                    )}
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
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-status" className="text-sm font-medium">
                      Статус <span className="text-destructive">*</span>
                    </Label>
                    <Select onValueChange={(value: 'active' | 'inactive') => editForm.setValue('status', value)} value={editForm.watch('status')}>
                      <SelectTrigger id="edit-status" className="h-10">
                        <SelectValue placeholder="Выберите статус" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Активен</SelectItem>
                        <SelectItem value="inactive">Неактивен</SelectItem>
                      </SelectContent>
                    </Select>
                    {editForm.formState.errors.status && (
                      <p className="text-xs text-destructive mt-1">{editForm.formState.errors.status.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-statusWork" className="text-sm font-medium">
                      Рабочий статус <span className="text-destructive">*</span>
                    </Label>
                    <Select onValueChange={(value) => editForm.setValue('statusWork', value)} value={editForm.watch('statusWork')}>
                      <SelectTrigger id="edit-statusWork" className="h-10">
                        <SelectValue placeholder="Выберите рабочий статус" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="offline">Оффлайн</SelectItem>
                        <SelectItem value="online">В сети</SelectItem>
                        <SelectItem value="break">Перерыв</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Документы */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground border-b pb-2">Документы</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center">
                        <Camera className="mr-2 h-4 w-4 text-muted-foreground" />
                        Фото паспорта
                      </Label>
                      {selectedEmployee?.passport && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => viewEmployeePassport(selectedEmployee.id)}
                          className="h-7 px-2"
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          Посмотреть
                        </Button>
                      )}
                    </div>
                    {selectedEmployee?.passport && !editPassportFile && (
                      <div className="text-xs text-muted-foreground mb-2">
                        Текущий файл загружен
                      </div>
                    )}
                    <FileUpload
                      onFileSelect={(file) => {
                        setEditPassportFile(file);
                      }}
                      value={editPassportFile}
                      placeholder="Загрузите новое фото паспорта"
                      className="min-h-[120px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center">
                        <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                        Фото договора
                      </Label>
                      {selectedEmployee?.contract && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => viewEmployeeContract(selectedEmployee.id)}
                          className="h-7 px-2"
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          Посмотреть
                        </Button>
                      )}
                    </div>
                    {selectedEmployee?.contract && !editContractFile && (
                      <div className="text-xs text-muted-foreground mb-2">
                        Текущий файл загружен
                      </div>
                    )}
                    <FileUpload
                      onFileSelect={(file) => {
                        setEditContractFile(file);
                      }}
                      value={editContractFile}
                      placeholder="Загрузите новое фото договора"
                      className="min-h-[120px]"
                    />
                  </div>
                </div>
              </div>

              {/* Примечание */}
              <div className="space-y-2">
                <Label htmlFor="edit-note" className="text-sm font-medium">Примечание</Label>
                <Textarea 
                  id="edit-note" 
                  {...editForm.register('note')} 
                  placeholder="Дополнительная информация о сотруднике..."
                  className="min-h-[80px] resize-none"
                />
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

        {/* Delete Employee Dialog */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Удалить сотрудника</DialogTitle>
              <DialogDescription>
                Вы уверены, что хотите удалить сотрудника {selectedEmployee?.name}? Это действие необратимо.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                Отмена
              </Button>
              <Button variant="destructive" onClick={handleDeleteEmployee} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Удалить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}