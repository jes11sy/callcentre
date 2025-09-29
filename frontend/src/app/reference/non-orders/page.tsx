'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { XCircle, AlertTriangle, Phone, MessageSquare, Clock } from 'lucide-react';

export default function NonOrdersPage() {
  const nonOrderReasons = [
    {
      category: 'Технические причины',
      icon: AlertTriangle,
      reasons: [
        {
          title: 'Неточный адрес',
          description: 'Клиент не может указать точный адрес или адрес не существует',
          action: 'Попросить уточнить адрес, если не получается - отклонить заказ'
        },
        {
          title: 'Недоступный номер телефона',
          description: 'Номер телефона не отвечает или неверный',
          action: 'Попробовать связаться 2-3 раза, если не получается - отклонить'
        },
        {
          title: 'Невозможно дозвониться',
          description: 'Клиент не отвечает на звонки в течение дня',
          action: 'Оставить заказ в статусе "Ожидает", повторить попытку на следующий день'
        }
      ]
    },
    {
      category: 'Отказ клиента',
      icon: XCircle,
      reasons: [
        {
          title: 'Передумал',
          description: 'Клиент передумал и не хочет заказывать услугу',
          action: 'Вежливо попрощаться, предложить обращаться в будущем'
        },
        {
          title: 'Цена не подходит',
          description: 'Клиент считает цену слишком высокой',
          action: 'Объяснить ценовую политику, предложить альтернативы'
        },
        {
          title: 'Нашел другого мастера',
          description: 'Клиент уже нашел другого исполнителя',
          action: 'Поблагодарить за обращение, предложить обращаться в будущем'
        }
      ]
    },
    {
      category: 'Некорректные обращения',
      icon: MessageSquare,
      reasons: [
        {
          title: 'Спам/Реклама',
          description: 'Обращение не связано с нашими услугами',
          action: 'Вежливо объяснить, что мы не занимаемся этим, завершить разговор'
        },
        {
          title: 'Неподходящий тип техники',
          description: 'Клиент обращается по поводу техники, которую мы не ремонтируем',
          action: 'Объяснить, какие типы техники мы ремонтируем, предложить альтернативы'
        },
        {
          title: 'Грубое поведение',
          description: 'Клиент ведет себя неадекватно или грубо',
          action: 'Сохранять вежливость, при необходимости завершить разговор'
        }
      ]
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <XCircle className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Незаказы</h1>
          <p className="text-muted-foreground">Причины отказа от заказов и правила обработки</p>
        </div>
      </div>

      <div className="space-y-6">
        {nonOrderReasons.map((category, index) => {
          const Icon = category.icon;
          return (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Icon className="h-6 w-6 text-primary" />
                  <span>{category.category}</span>
                </CardTitle>
                <CardDescription>Основные причины из категории "{category.category.toLowerCase()}"</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {category.reasons.map((reason, reasonIndex) => (
                  <div key={reasonIndex} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{reason.title}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{reason.description}</p>
                    <div className="bg-blue-50 p-3 rounded-md">
                      <div className="flex items-center space-x-2 mb-1">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Действия:</span>
                      </div>
                      <p className="text-sm text-blue-700">{reason.action}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-800">
            <Badge variant="destructive">Важно</Badge>
            <span>Правила обработки незаказов</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 text-sm">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-red-600" />
              <span>Всегда сохранять вежливый тон, даже при отказе клиента</span>
            </div>
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-red-600" />
              <span>Обязательно записывать причину отказа в системе</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-red-600" />
              <span>Не тратить более 5 минут на попытки убедить клиента</span>
            </div>
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span>При грубом поведении - завершить разговор, не отвечать грубостью</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-800">
            <Badge variant="outline" className="border-green-300 text-green-800">
              Совет
            </Badge>
            <span>Как минимизировать незаказы</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 text-sm">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">Цена</Badge>
              <span>Четко объяснять ценовую политику с самого начала</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">Время</Badge>
              <span>Уточнять удобное время для клиента</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">Гарантия</Badge>
              <span>Подчеркивать гарантийные обязательства</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">Опыт</Badge>
              <span>Рассказывать о опыте и квалификации мастеров</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
