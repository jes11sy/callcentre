'use client';

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  FileText, 
  MessageSquare, 
  MapPin, 
  Calendar, 
  User, 
  Settings,
  Loader2,
  CheckCircle,
  Sparkles,
  Clock,
  AlertCircle,
  Info,
  Phone
} from 'lucide-react';
import authApi from '@/lib/auth';
import { toast } from 'sonner';

interface AvitoChat {
  id: string;
  avitoAccountName: string;
  city: string;
  context?: {
    value: {
      title: string;
      url?: string;
    };
  };
  users: Array<{
    id: number;
    name: string;
  }>;
}

interface CreateOrderFromChatModalProps {
  chat: AvitoChat | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreated?: (order: any) => void;
}

// Validation schema
const orderSchema = z.object({
  typeOrder: z.enum(['Впервые', 'Повтор', 'Гарантия'], {
    required_error: 'Выберите тип заявки'
  }),
  clientName: z.string().min(1, 'Имя клиента обязательно'),
  phone: z.string().min(1, 'Номер телефона обязателен'),
  address: z.string().min(1, 'Адрес обязателен'),
  dateMeeting: z.string().min(1, 'Дата встречи обязательна'),
  typeEquipment: z.enum(['КП', 'БТ', 'МНЧ'], {
    required_error: 'Выберите тип техники'
  }),
  problem: z.string().min(1, 'Описание проблемы обязательно')
});

type OrderFormData = z.infer<typeof orderSchema>;

export function CreateOrderFromChatModal({ chat, open, onOpenChange, onOrderCreated }: CreateOrderFromChatModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      typeOrder: 'Впервые',
      clientName: '',
      phone: '',
      address: '',
      dateMeeting: '',
      typeEquipment: 'КП',
      problem: ''
    }
  });

  const watchedValues = watch();

  // Handle form submission
  const onSubmit = async (data: OrderFormData) => {
    if (!chat) return;

    try {
      setIsSubmitting(true);

      const orderData = {
        chatId: chat.id,
        rk: 'Авито',
        city: chat.city,
        avitoName: chat.avitoAccountName,
        avitoChatId: chat.id,
        typeOrder: data.typeOrder,
        clientName: data.clientName,
        phone: data.phone,
        address: data.address,
        dateMeeting: data.dateMeeting,
        typeEquipment: data.typeEquipment,
        problem: data.problem
      };

      const response = await authApi.post('/orders/from-chat', orderData);

      if (response.data.success) {
        toast.success('Заказ успешно создан!');
        onOrderCreated?.(response.data.data);
        handleClose();
      } else {
        throw new Error(response.data.message || 'Ошибка при создании заказа');
      }
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast.error(error.response?.data?.message || 'Ошибка при создании заказа');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  // Get minimum date for meeting (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
  };

  // Auto-fill form when chat changes
  React.useEffect(() => {
    if (chat && open) {
      // Auto-fill client name from chat user
      if (chat.users && chat.users.length > 0) {
        setValue('clientName', chat.users[0].name);
      }
      
      // Set default meeting date to tomorrow at 12:00
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);
      setValue('dateMeeting', tomorrow.toISOString().slice(0, 16));
    }
  }, [chat, open, setValue]);

  if (!chat) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="h-auto max-h-[90vh] overflow-y-auto"
        style={{ 
          '--dialog-width': '70vw',
          '--dialog-max-width': '70vw',
          '--dialog-min-width': '900px',
          width: 'var(--dialog-width)',
          maxWidth: 'var(--dialog-max-width)',
          minWidth: 'var(--dialog-min-width)'
        } as React.CSSProperties}
      >
        <DialogHeader className="space-y-2 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            <div className="p-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            Создание заказа из чата
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Создание заказа на основе переписки с клиентом в Авито
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-8">
          {/* Left Block - Chat Information */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                <div className="p-1.5 bg-blue-500 rounded-lg">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                Информация о чате
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Данные автоматически заполнены из чата
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* РК (Авито) */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  РК (Авито)
                </Label>
                <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-blue-200 shadow-sm">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <User className="h-3 w-3 text-blue-600" />
                  </div>
                  <span className="font-medium text-blue-800 text-sm">Авито</span>
                </div>
              </div>

              {/* ID чата */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  ID чата
                </Label>
                <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="p-1.5 bg-gray-100 rounded-lg">
                    <MessageSquare className="h-3 w-3 text-gray-600" />
                  </div>
                  <span className="font-mono text-gray-800 text-sm">{chat.id}</span>
                </div>
              </div>

              {/* Город */}
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Город
                </Label>
                <Input
                  id="city"
                  defaultValue={chat.city}
                  placeholder="Введите город"
                  className="h-10 border-2 hover:border-blue-300 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Имя клиента */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Имя клиента
                </Label>
                <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-green-200 shadow-sm">
                  <div className="p-1.5 bg-green-100 rounded-lg">
                    <User className="h-3 w-3 text-green-600" />
                  </div>
                  <span className="font-medium text-green-800 text-sm">
                    {chat.users && chat.users.length > 0 ? chat.users[0].name : 'Не указан'}
                  </span>
                </div>
              </div>

              {/* Имя мастера */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Имя мастера
                </Label>
                <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-purple-200 shadow-sm">
                  <div className="p-1.5 bg-purple-100 rounded-lg">
                    <User className="h-3 w-3 text-purple-600" />
                  </div>
                  <span className="font-medium text-purple-800 text-sm">{chat.avitoAccountName}</span>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Right Block - Order Details */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                <div className="p-1.5 bg-green-500 rounded-lg">
                  <Settings className="h-4 w-4 text-white" />
                </div>
                Детали заказа
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Заполните дополнительную информацию для создания заказа
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Type Order */}
                <div className="space-y-2">
                  <Label htmlFor="typeOrder" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Тип заявки <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={watchedValues.typeOrder}
                    onValueChange={(value) => setValue('typeOrder', value as any)}
                  >
                    <SelectTrigger id="typeOrder" className="h-10 border-2 hover:border-blue-300 focus:border-blue-500 transition-colors">
                      <SelectValue placeholder="Выберите тип заявки" />
                    </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Впервые">🆕 Впервые</SelectItem>
                            <SelectItem value="Повтор">🔄 Повтор</SelectItem>
                            <SelectItem value="Гарантия">🛡️ Гарантия</SelectItem>
                          </SelectContent>
                  </Select>
                  {errors.typeOrder && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.typeOrder.message}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Номер <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder="Введите номер телефона"
                    className={`h-10 border-2 hover:border-blue-300 focus:border-blue-500 transition-colors ${errors.phone ? 'border-red-500' : ''}`}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {/* Type Equipment */}
                <div className="space-y-2">
                  <Label htmlFor="typeEquipment" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Тип техники <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={watchedValues.typeEquipment}
                    onValueChange={(value) => setValue('typeEquipment', value as any)}
                  >
                    <SelectTrigger id="typeEquipment" className="h-10 border-2 hover:border-blue-300 focus:border-blue-500 transition-colors">
                      <SelectValue placeholder="Выберите тип техники" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="КП">💻 КП (Компьютерная помощь)</SelectItem>
                      <SelectItem value="БТ">🏠 БТ (Бытовая техника)</SelectItem>
                      <SelectItem value="МНЧ">🔧 МНЧ (Муж на час)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.typeEquipment && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.typeEquipment.message}
                    </p>
                  )}
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Адрес <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address"
                    {...register('address')}
                    placeholder="Введите адрес клиента"
                    className={`h-10 border-2 hover:border-blue-300 focus:border-blue-500 transition-colors ${errors.address ? 'border-red-500' : ''}`}
                  />
                  {errors.address && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.address.message}
                    </p>
                  )}
                </div>

                {/* Date Meeting */}
                <div className="space-y-2">
                  <Label htmlFor="dateMeeting" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Дата встречи <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dateMeeting"
                    type="datetime-local"
                    min={getMinDate()}
                    {...register('dateMeeting')}
                    className={`h-10 border-2 hover:border-blue-300 focus:border-blue-500 transition-colors ${errors.dateMeeting ? 'border-red-500' : ''}`}
                  />
                  {errors.dateMeeting && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.dateMeeting.message}
                    </p>
                  )}
                </div>

                {/* Problem */}
                <div className="space-y-2">
                  <Label htmlFor="problem" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Описание проблемы <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="problem"
                    {...register('problem')}
                    placeholder="Опишите проблему с техникой"
                    rows={3}
                    className={`border-2 hover:border-blue-300 focus:border-blue-500 transition-colors ${errors.problem ? 'border-red-500' : ''}`}
                  />
                  {errors.problem && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.problem.message}
                    </p>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex gap-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="h-10 px-6 border-2 hover:bg-gray-50 transition-colors"
          >
            Отмена
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            onClick={handleSubmit(onSubmit)}
            className="h-10 px-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Создание...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Создать заказ
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
