'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Loader2, 
  CheckCircle, 
  User, 
  MapPin, 
  Phone, 
  Calendar, 
  FileText, 
  Settings,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const orderSchema = z.object({
  rk: z.string().min(1, 'РК обязателен'),
  city: z.string().min(1, 'Город обязателен'),
  avitoName: z.string().optional(),
  phone: z.string().min(1, 'Телефон обязателен'),
  typeOrder: z.enum(['Впервые', 'Повтор', 'Гарантия'], {
    required_error: 'Тип заявки обязателен'
  }),
  clientName: z.string().min(1, 'Имя клиента обязательно'),
  address: z.string().min(1, 'Адрес обязателен'),
  dateMeeting: z.string().min(1, 'Дата встречи обязательна'),
  typeEquipment: z.enum(['КП', 'БТ', 'МНЧ'], {
    required_error: 'Тип техники обязателен'
  }),
  problem: z.string().min(1, 'Описание проблемы обязательно'),
  callRecord: z.string().optional(),
  masterId: z.number().optional()
});

type OrderFormData = z.infer<typeof orderSchema>;

interface CreateOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreated?: () => void;
}

export default function CreateOrderModal({ 
  open, 
  onOpenChange, 
  onOrderCreated 
}: CreateOrderModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema)
  });

  const watchedValues = watch();

  // Создание заказа
  const createOrderMutation = useMutation({
    mutationFn: async (data: OrderFormData) => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          ...data,
          operatorNameId: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id : 0
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка при создании заказа');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Заказ успешно создан');
      handleClose();
      onOrderCreated?.();
    },
    onError: () => {
      toast.error('Ошибка при создании заказа');
    }
  });

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const onSubmit = async (data: OrderFormData) => {
    setIsSubmitting(true);
    try {
      await createOrderMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (open) {
      // Set default meeting date to tomorrow at 12:00
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);
      setValue('dateMeeting', tomorrow.toISOString().slice(0, 16));
    }
  }, [open, setValue]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl w-full h-auto max-h-[90vh] overflow-y-auto"
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
              <FileText className="h-5 w-5 text-white" />
            </div>
            Создание нового заказа
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Заполните все необходимые поля для создания заказа
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Левая колонка - Основная информация */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <div className="p-1.5 bg-blue-500 rounded-lg">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  Основная информация
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* РК */}
                <div className="space-y-2">
                  <Label htmlFor="rk" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    РК <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="rk"
                    {...register('rk')}
                    placeholder="Введите РК"
                    className={`h-10 border-2 hover:border-blue-300 focus:border-blue-500 transition-colors ${errors.rk ? 'border-red-500' : ''}`}
                  />
                  {errors.rk && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.rk.message}
                    </p>
                  )}
                </div>

                {/* Город */}
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Город <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    {...register('city')}
                    placeholder="Введите город"
                    className={`h-10 border-2 hover:border-blue-300 focus:border-blue-500 transition-colors ${errors.city ? 'border-red-500' : ''}`}
                  />
                  {errors.city && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.city.message}
                    </p>
                  )}
                </div>

                {/* Имя Авито */}
                <div className="space-y-2">
                  <Label htmlFor="avitoName" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Имя Авито аккаунта
                  </Label>
                  <Input
                    id="avitoName"
                    {...register('avitoName')}
                    placeholder="Введите имя аккаунта Авито"
                    className="h-10 border-2 hover:border-blue-300 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Телефон */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Телефон клиента <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder="Введите телефон клиента"
                    className={`h-10 border-2 hover:border-blue-300 focus:border-blue-500 transition-colors ${errors.phone ? 'border-red-500' : ''}`}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {/* Имя клиента */}
                <div className="space-y-2">
                  <Label htmlFor="clientName" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Имя клиента <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="clientName"
                    {...register('clientName')}
                    placeholder="Введите имя клиента"
                    className={`h-10 border-2 hover:border-blue-300 focus:border-blue-500 transition-colors ${errors.clientName ? 'border-red-500' : ''}`}
                  />
                  {errors.clientName && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.clientName.message}
                    </p>
                  )}
                </div>

                {/* Адрес */}
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
              </CardContent>
            </Card>

            {/* Правая колонка - Детали заказа */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <div className="p-1.5 bg-green-500 rounded-lg">
                    <Settings className="h-4 w-4 text-white" />
                  </div>
                  Детали заказа
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Тип заявки */}
                <div className="space-y-2">
                  <Label htmlFor="typeOrder" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Тип заявки <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={watchedValues.typeOrder}
                    onValueChange={(value) => setValue('typeOrder', value as any)}
                  >
                    <SelectTrigger id="typeOrder" className={`h-10 border-2 hover:border-blue-300 focus:border-blue-500 transition-colors ${errors.typeOrder ? 'border-red-500' : ''}`}>
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

                {/* Тип техники */}
                <div className="space-y-2">
                  <Label htmlFor="typeEquipment" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Тип техники <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={watchedValues.typeEquipment}
                    onValueChange={(value) => setValue('typeEquipment', value as any)}
                  >
                    <SelectTrigger id="typeEquipment" className={`h-10 border-2 hover:border-blue-300 focus:border-blue-500 transition-colors ${errors.typeEquipment ? 'border-red-500' : ''}`}>
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

                {/* Дата встречи */}
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

                {/* Запись звонка */}
                <div className="space-y-2">
                  <Label htmlFor="callRecord" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    URL записи звонка
                  </Label>
                  <Input
                    id="callRecord"
                    {...register('callRecord')}
                    placeholder="Введите URL записи звонка"
                    className="h-10 border-2 hover:border-blue-300 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* ID мастера */}
                <div className="space-y-2">
                  <Label htmlFor="masterId" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    ID мастера
                  </Label>
                  <Input
                    id="masterId"
                    type="number"
                    {...register('masterId', { valueAsNumber: true })}
                    placeholder="Введите ID мастера"
                    className="h-10 border-2 hover:border-blue-300 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Описание проблемы */}
                <div className="space-y-2">
                  <Label htmlFor="problem" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Описание проблемы <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="problem"
                    {...register('problem')}
                    placeholder="Опишите проблему с техникой"
                    rows={4}
                    className={`border-2 hover:border-blue-300 focus:border-blue-500 transition-colors ${errors.problem ? 'border-red-500' : ''}`}
                  />
                  {errors.problem && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.problem.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-4 pt-6">
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
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
