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
  typeOrder: z.enum(['first_time', 'repeat', 'warranty'], {
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
      typeOrder: 'Впервые',
      clientName: '',
      address: '',
      dateMeeting: '',
      typeEquipment: 'КП',
      problem: ''
    }
  });

  const watchedValues = watch();


  // Handle form submission
  const onSubmit = async (data: OrderFormData) => {
    if (!call) return;

    try {
      setIsSubmitting(true);

      const orderData = {
        callId: call.id,
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
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
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
                Данные будут автоматически перенесены в заказ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">РК</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-sm">{call.rk}</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Город</Label>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{call.city}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Телефон клиента</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-green-500" />
                    <span className="font-mono font-medium text-green-700">{call.phoneClient}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Оператор</Label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">{call.operator.name}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Дата звонка</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">{formatDate(call.dateCreate)}</span>
                  </div>
                </div>
                {call.avitoName && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Авито аккаунт</Label>
                    <Badge variant="outline">{call.avitoName}</Badge>
                  </div>
                )}
                {call.mango?.recordUrl && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Запись звонка</Label>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">Доступна</span>
                    </div>
                  </div>
                )}
              </div>
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
