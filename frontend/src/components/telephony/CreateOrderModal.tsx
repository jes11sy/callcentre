'use client';

import React, { useState, useEffect } from 'react';
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
  Phone, 
  MapPin, 
  Calendar, 
  User, 
  Settings,
  Loader2,
  CheckCircle
} from 'lucide-react';
import authApi from '@/lib/auth';
import { toast } from 'sonner';

interface Call {
  id: number;
  rk: string;
  city: string;
  avitoName?: string;
  phoneClient: string;
  phoneAts: string;
  dateCreate: string;
  status: 'answered' | 'missed' | 'busy' | 'no_answer';
  operator: {
    id: number;
    name: string;
    login: string;
  };
  avito?: {
    id: number;
    name: string;
  };
  mango?: {
    id: number;
    callId: string;
    recordUrl?: string;
    duration?: number;
    direction: string;
  };
}

interface CreateOrderModalProps {
  call: Call | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreated?: (order: any) => void;
}

// Schema for form validation
const orderSchema = z.object({
  rk: z.enum(['Авито', 'Листовка'], {
    required_error: 'Выберите РК'
  }),
  avitoName: z.string().optional(),
  city: z.string().min(1, 'Введите город'),
  typeOrder: z.enum(['Впервые', 'Повтор', 'Гарантия'], {
    required_error: 'Выберите тип заявки'
  }),
  clientName: z.string().min(1, 'Введите имя клиента'),
  address: z.string().min(1, 'Введите адрес'),
  dateMeeting: z.string().min(1, 'Выберите дату встречи'),
  typeEquipment: z.enum(['КП', 'БТ', 'МНЧ'], {
    required_error: 'Выберите тип техники'
  }),
  problem: z.string().min(1, 'Опишите проблему'),
});

type OrderFormData = z.infer<typeof orderSchema>;

export function CreateOrderModal({ call, open, onOpenChange, onOrderCreated }: CreateOrderModalProps) {
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
      rk: 'Авито',
      avitoName: '',
      city: '',
      typeOrder: 'Впервые',
      clientName: '',
      address: '',
      dateMeeting: '',
      typeEquipment: 'КП',
      problem: ''
    }
  });

  const watchedValues = watch();

  // Fill form with call data when call changes
  useEffect(() => {
    if (call && open) {
      setValue('rk', call.rk === 'Авито' ? 'Авито' : 'Листовка');
      setValue('avitoName', call.avitoName || '');
      setValue('city', call.city || '');
    }
  }, [call, open, setValue]);

  // Handle form submission
  const onSubmit = async (data: OrderFormData) => {
    if (!call) return;

    try {
      setIsSubmitting(true);

      const orderData = {
        callId: call.id,
        rk: data.rk,
        avitoName: data.avitoName,
        city: data.city,
        typeOrder: data.typeOrder,
        clientName: data.clientName,
        address: data.address,
        dateMeeting: data.dateMeeting,
        typeEquipment: data.typeEquipment,
        problem: data.problem
      };

      const response = await authApi.post('/orders/from-call', orderData);

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

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Moscow'
    });
  };

  // Get minimum date for meeting (today)
  const getMinMeetingDate = () => {
    const today = new Date();
    return today.toISOString().slice(0, 16);
  };

  // Type order labels
  const typeOrderLabels = {
    first_time: 'Впервые',
    repeat: 'Повтор',
    warranty: 'Гарантия'
  };

  // Type equipment labels
  const typeEquipmentLabels = {
    kp: 'КП',
    bt: 'БТ',
    mnch: 'МНЧ'
  };

  if (!call) return null;

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
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            Создание заказа из звонка
          </DialogTitle>
          <DialogDescription className="text-base">
            Создайте новый заказ на основе данных звонка
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Call Information Card */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Phone className="h-5 w-5 text-green-600" />
                </div>
                Информация о звонке
              </CardTitle>
              <CardDescription className="text-sm">
                Отредактируйте данные при необходимости
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* РК */}
                <div className="space-y-3">
                  <Label htmlFor="rk" className="text-sm font-semibold">
                    РК <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={watchedValues.rk}
                    onValueChange={(value) => setValue('rk', value as any)}
                  >
                    <SelectTrigger id="rk" className="h-11">
                      <SelectValue placeholder="Выберите РК" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Авито">Авито</SelectItem>
                      <SelectItem value="Листовка">Листовка</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.rk && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span className="text-red-500">⚠</span>
                      {errors.rk.message}
                    </p>
                  )}
                </div>

                {/* Авито аккаунт */}
                <div className="space-y-3">
                  <Label htmlFor="avitoName" className="text-sm font-semibold">
                    Авито аккаунт
                  </Label>
                  <Input
                    id="avitoName"
                    placeholder="Введите название Авито аккаунта"
                    className="h-11"
                    {...register('avitoName')}
                  />
                  {errors.avitoName && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span className="text-red-500">⚠</span>
                      {errors.avitoName.message}
                    </p>
                  )}
                </div>

                {/* Город */}
                <div className="space-y-3">
                  <Label htmlFor="city" className="text-sm font-semibold">
                    Город <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    placeholder="Введите город"
                    className="h-11"
                    {...register('city')}
                  />
                  {errors.city && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span className="text-red-500">⚠</span>
                      {errors.city.message}
                    </p>
                  )}
                </div>

                {/* Информация только для чтения */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-muted-foreground">Телефон клиента</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <Phone className="h-4 w-4 text-green-500" />
                    <span className="font-mono font-medium text-green-700">{call.phoneClient}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Оператор</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <User className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">{call.operator.name}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Дата звонка</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">{formatDate(call.dateCreate)}</span>
                  </div>
                </div>
              </div>

              {call.mango?.recordUrl && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Запись звонка</Label>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Доступна</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Form */}
          <form id="order-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Settings className="h-5 w-5 text-orange-600" />
                  </div>
                  Детали заказа
                </CardTitle>
                <CardDescription className="text-sm">
                  Заполните дополнительную информацию для создания заказа
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Type Order */}
                  <div className="space-y-3">
                    <Label htmlFor="typeOrder" className="text-sm font-semibold">
                      Тип заявки <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={watchedValues.typeOrder}
                      onValueChange={(value) => setValue('typeOrder', value as any)}
                    >
                      <SelectTrigger id="typeOrder" className="h-11">
                        <SelectValue placeholder="Выберите тип заявки" />
                      </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Впервые">Впервые</SelectItem>
                            <SelectItem value="Повтор">Повтор</SelectItem>
                            <SelectItem value="Гарантия">Гарантия</SelectItem>
                          </SelectContent>
                    </Select>
                    {errors.typeOrder && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <span className="text-red-500">⚠</span>
                        {errors.typeOrder.message}
                      </p>
                    )}
                  </div>

                  {/* Type Equipment */}
                  <div className="space-y-3">
                    <Label htmlFor="typeEquipment" className="text-sm font-semibold">
                      Тип техники <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={watchedValues.typeEquipment}
                      onValueChange={(value) => setValue('typeEquipment', value as any)}
                    >
                      <SelectTrigger id="typeEquipment" className="h-11">
                        <SelectValue placeholder="Выберите тип техники" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="КП">КП (Компьютерная помощь)</SelectItem>
                        <SelectItem value="БТ">БТ (Бытовая техника)</SelectItem>
                        <SelectItem value="МНЧ">МНЧ (Муж на час)</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.typeEquipment && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <span className="text-red-500">⚠</span>
                        {errors.typeEquipment.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Client Name */}
                  <div className="space-y-3">
                    <Label htmlFor="clientName" className="text-sm font-semibold">
                      Имя клиента <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="clientName"
                      placeholder="Введите имя клиента"
                      className="h-11"
                      {...register('clientName')}
                    />
                    {errors.clientName && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <span className="text-red-500">⚠</span>
                        {errors.clientName.message}
                      </p>
                    )}
                  </div>

                  {/* Date Meeting */}
                  <div className="space-y-3">
                    <Label htmlFor="dateMeeting" className="text-sm font-semibold">
                      Дата встречи <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="dateMeeting"
                      type="datetime-local"
                      min={getMinMeetingDate()}
                      className="h-11"
                      {...register('dateMeeting')}
                    />
                    {errors.dateMeeting && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <span className="text-red-500">⚠</span>
                        {errors.dateMeeting.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-3">
                  <Label htmlFor="address" className="text-sm font-semibold">
                    Адрес <span className="text-red-500">*</span>
                  </Label>
                    <Input
                      id="address"
                      placeholder="Введите адрес клиента"
                      className="h-11"
                      {...register('address')}
                    />
                    <p className="text-xs text-muted-foreground">
                      Автоматически заполнено городом из звонка
                    </p>
                  {errors.address && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span className="text-red-500">⚠</span>
                      {errors.address.message}
                    </p>
                  )}
                </div>

                {/* Problem */}
                <div className="space-y-3">
                  <Label htmlFor="problem" className="text-sm font-semibold">
                    Описание проблемы <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="problem"
                    placeholder="Опишите проблему клиента"
                    rows={4}
                    className="resize-none"
                    {...register('problem')}
                  />
                  {errors.problem && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <span className="text-red-500">⚠</span>
                      {errors.problem.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </form>
        </div>

        <DialogFooter className="gap-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="h-11 px-6"
          >
            Отмена
          </Button>
          <Button
            type="submit"
            form="order-form"
            disabled={isSubmitting}
            className="h-11 px-6 bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Создание заказа...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Создать заказ
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
