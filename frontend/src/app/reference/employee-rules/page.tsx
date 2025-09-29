'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserCheck, Clock, AlertCircle, CheckCircle } from 'lucide-react';

export default function EmployeeRulesPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <UserCheck className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Правила сотрудника</h1>
          <p className="text-muted-foreground">Основные правила и требования для операторов</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span>Рабочее время</span>
            </CardTitle>
            <CardDescription>Требования к рабочему времени и графику</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Рабочий день: 10:00 - 22:00</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Обязательное присутствие в системе во время работы</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Перерывы: 15 минут каждые 2 часа</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <span>Обязанности</span>
            </CardTitle>
            <CardDescription>Основные обязанности оператора</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Принимать входящие звонки в течение 3 секунд</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Отвечать на сообщения в Авито в течение 5 минут</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Создавать заказы для всех обращений</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Вести вежливый и профессиональный разговор</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Badge variant="destructive">Важно</Badge>
              <span>Запрещено</span>
            </CardTitle>
            <CardDescription>Действия, которые запрещены</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span>Пропускать звонки без уважительной причины</span>
              </div>
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span>Использовать нецензурную лексику</span>
              </div>
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span>Предоставлять неточную информацию о ценах</span>
              </div>
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span>Оставлять клиентов без ответа более 10 минут</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
