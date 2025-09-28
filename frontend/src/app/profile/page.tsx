'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  User, 
  Edit, 
  Save, 
  X, 
  Calendar,
  MapPin,
  Phone,
  Mail,
  Shield,
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

// Схемы валидации
const profileSchema = z.object({
  name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  city: z.string().min(2, 'Город должен содержать минимум 2 символа'),
  statusWork: z.string().min(1, 'Выберите рабочий статус'),
  note: z.string().optional()
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Введите текущий пароль'),
  newPassword: z.string().min(6, 'Новый пароль должен содержать минимум 6 символов'),
  confirmPassword: z.string().min(1, 'Подтвердите пароль')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

interface Profile {
  id: number;
  name: string;
  login: string;
  city: string;
  status: string;
  statusWork: string;
  passport?: string;
  contract?: string;
  dateCreate: string;
  note?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    calls: number;
    orders: number;
  };
}

interface ProfileStats {
  operator: {
    id: number;
    name: string;
    city: string;
    startDate: string;
  };
  total: {
    calls: number;
    orders: number;
  };
  monthly: {
    calls: number;
    orders: number;
  };
  today: {
    calls: number;
    orders: number;
  };
}

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const queryClient = useQueryClient();

  // Формы
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema)
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema)
  });

  // Получение профиля
  const { data: profile, isLoading, error } = useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки профиля');
      }

      return response.json();
    }
  });

  // Получение статистики профиля (только для операторов)
  const { data: profileStats } = useQuery<ProfileStats>({
    queryKey: ['profileStats'],
    queryFn: async () => {
      const response = await fetch('/api/profile/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки статистики профиля');
      }

      return response.json();
    },
    enabled: profile?.role === 'operator'
  });

  // Обновление профиля
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Ошибка обновления профиля');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Профиль успешно обновлен');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Ошибка обновления профиля');
    }
  });

  // Смена пароля
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Ошибка смены пароля');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Пароль успешно изменен');
      setIsChangingPassword(false);
      passwordForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Ошибка смены пароля');
    }
  });

  // Инициализация формы при загрузке профиля
  useEffect(() => {
    if (profile) {
      profileForm.reset({
        name: profile.name,
        city: profile.city,
        statusWork: profile.statusWork,
        note: profile.note || ''
      });
    }
  }, [profile, profileForm]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      profileForm.reset({
        name: profile.name,
        city: profile.city,
        statusWork: profile.statusWork,
        note: profile.note || ''
      });
    }
  };

  const handleSave = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const handlePasswordChange = (data: PasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'on_call': return 'bg-blue-100 text-blue-800';
      case 'break': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Активен';
      case 'inactive': return 'Неактивен';
      case 'on_call': return 'На звонке';
      case 'break': return 'Перерыв';
      default: return status;
    }
  };

  const getWorkStatusText = (status: string) => {
    switch (status) {
      case 'offline': return 'Оффлайн';
      case 'online': return 'В сети';
      case 'break': return 'Перерыв';
      default: return status;
    }
  };

  if (error) {
    return (
      <DashboardLayout variant="operator" requiredRole="operator">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600">Ошибка при загрузке профиля</p>
              </div>
            </div>
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
                  <User className="h-8 w-8 mr-3 text-purple-600" />
                  Мой профиль
                </h1>
                <p className="text-gray-600 mt-2">
                  Управление личной информацией и настройками
                </p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Загрузка профиля...</p>
            </div>
          ) : profile ? (
            <div className="space-y-6">
              {/* Основная информация */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Основная информация
                      </CardTitle>
                      <CardDescription>
                        Личные данные и контактная информация
                      </CardDescription>
                    </div>
                    {!isEditing ? (
                      <Button onClick={handleEdit} variant="outline">
                        <Edit className="mr-2 h-4 w-4" />
                        Редактировать
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button onClick={handleCancel} variant="outline">
                          <X className="mr-2 h-4 w-4" />
                          Отмена
                        </Button>
                        <Button 
                          onClick={profileForm.handleSubmit(handleSave)}
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          Сохранить
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Полное имя</Label>
                        {isEditing ? (
                          <Input
                            id="name"
                            {...profileForm.register('name')}
                            placeholder="Введите ваше имя"
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-900">{profile.name}</span>
                          </div>
                        )}
                        {profileForm.formState.errors.name && (
                          <p className="text-sm text-red-600">
                            {profileForm.formState.errors.name.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login">Логин</Label>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">{profile.login}</span>
                        </div>
                        <p className="text-xs text-gray-500">Логин нельзя изменить</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city">Город</Label>
                        {isEditing ? (
                          <Input
                            id="city"
                            {...profileForm.register('city')}
                            placeholder="Введите город"
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-900">{profile.city}</span>
                          </div>
                        )}
                        {profileForm.formState.errors.city && (
                          <p className="text-sm text-red-600">
                            {profileForm.formState.errors.city.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="status">Статус</Label>
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-gray-400" />
                          <Badge className={getStatusColor(profile.status)}>
                            {getStatusText(profile.status)}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">Статус устанавливается администратором</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="statusWork">Рабочий статус</Label>
                        {isEditing ? (
                          <Select 
                            value={profileForm.watch('statusWork')} 
                            onValueChange={(value) => profileForm.setValue('statusWork', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите статус" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="offline">Оффлайн</SelectItem>
                              <SelectItem value="online">В сети</SelectItem>
                              <SelectItem value="break">Перерыв</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-900">{getWorkStatusText(profile.statusWork)}</span>
                          </div>
                        )}
                        {profileForm.formState.errors.statusWork && (
                          <p className="text-sm text-red-600">
                            {profileForm.formState.errors.statusWork.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dateCreate">Дата начала работы</Label>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">{formatDate(profile.dateCreate)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <Label htmlFor="note">Примечание</Label>
                    {isEditing ? (
                      <Textarea
                        id="note"
                        {...profileForm.register('note')}
                        placeholder="Дополнительная информация..."
                        rows={3}
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-md">
                        <span className="text-gray-900">
                          {profile.note || 'Примечание не указано'}
                        </span>
                      </div>
                    )}
                    {profileForm.formState.errors.note && (
                      <p className="text-sm text-red-600">
                        {profileForm.formState.errors.note.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Статистика (только для операторов) */}
              {profile.role === 'operator' && profileStats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Статистика работы
                    </CardTitle>
                    <CardDescription>
                      Показатели вашей работы
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {profileStats.total.calls}
                        </div>
                        <p className="text-sm text-gray-600">Всего звонков</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {profileStats.total.orders}
                        </div>
                        <p className="text-sm text-gray-600">Всего заказов</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {profileStats.monthly.calls}
                        </div>
                        <p className="text-sm text-gray-600">Звонков за месяц</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {profileStats.today.calls}
                        </div>
                        <p className="text-sm text-gray-600">Звонков сегодня</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Смена пароля */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Безопасность
                      </CardTitle>
                      <CardDescription>
                        Управление паролем и безопасностью
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={() => setIsChangingPassword(!isChangingPassword)}
                      variant="outline"
                    >
                      {isChangingPassword ? 'Отмена' : 'Сменить пароль'}
                    </Button>
                  </div>
                </CardHeader>
                {isChangingPassword && (
                  <CardContent>
                    <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Текущий пароль</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showCurrentPassword ? 'text' : 'password'}
                            {...passwordForm.register('currentPassword')}
                            placeholder="Введите текущий пароль"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {passwordForm.formState.errors.currentPassword && (
                          <p className="text-sm text-red-600">
                            {passwordForm.formState.errors.currentPassword.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Новый пароль</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? 'text' : 'password'}
                            {...passwordForm.register('newPassword')}
                            placeholder="Введите новый пароль"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {passwordForm.formState.errors.newPassword && (
                          <p className="text-sm text-red-600">
                            {passwordForm.formState.errors.newPassword.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            {...passwordForm.register('confirmPassword')}
                            placeholder="Подтвердите новый пароль"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {passwordForm.formState.errors.confirmPassword && (
                          <p className="text-sm text-red-600">
                            {passwordForm.formState.errors.confirmPassword.message}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsChangingPassword(false)}
                        >
                          Отмена
                        </Button>
                        <Button 
                          type="submit"
                          disabled={changePasswordMutation.isPending}
                        >
                          {changePasswordMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          Сохранить пароль
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                )}
              </Card>
            </div>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
}
