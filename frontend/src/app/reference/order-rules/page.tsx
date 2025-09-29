'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function OrderRulesPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <ClipboardList className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Правила приема заказов</h1>
          <p className="text-muted-foreground">Процедуры и требования при создании заказов</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span>Обязательные поля</span>
            </CardTitle>
            <CardDescription>Поля, которые должны быть заполнены при создании заказа</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Имя клиента</strong> - обязательно для всех заказов</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Номер телефона</strong> - для связи с клиентом</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Адрес</strong> - место выполнения работ</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Дата встречи</strong> - когда мастер приедет</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Тип техники</strong> - КП, БТ или МНЧ</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Описание проблемы</strong> - что нужно починить</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <span>Временные слоты</span>
            </CardTitle>
            <CardDescription>Доступные временные интервалы для записи</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Интервалы: каждые 30 минут с 10:00 до 22:00</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Максимум 3 заказа на один временной слот</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Распределение по типам техники: КП, БТ, МНЧ</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Badge variant="destructive">Важно</Badge>
              <span>Правила создания</span>
            </CardTitle>
            <CardDescription>Обязательные процедуры при создании заказа</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span>Всегда создавать заказ после звонка или сообщения</span>
              </div>
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span>Проверять доступность временного слота</span>
              </div>
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span>Указывать точный адрес с подъездом и этажом</span>
              </div>
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span>Подтверждать контактные данные клиента</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Badge variant="secondary">Информация</Badge>
              <span>Типы заявок</span>
            </CardTitle>
            <CardDescription>Различные типы заявок и их особенности</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span><strong>Впервые</strong> - новый клиент, первое обращение</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Повтор</strong> - повторное обращение существующего клиента</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-orange-600" />
                <span><strong>Гарантия</strong> - обращение по гарантийному случаю</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
