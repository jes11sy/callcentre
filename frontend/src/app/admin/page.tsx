'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Phone, MessageSquare, BarChart3, Settings, Mail } from 'lucide-react';

export default function AdminPage() {
  return (
    <DashboardLayout variant="admin" requiredRole="admin">
      {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Stats Cards */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Всего операторов
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">
                    Активных операторов
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Звонки сегодня
                  </CardTitle>
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">
                    Всего звонков
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Заказы сегодня
                  </CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">
                    Новых заказов
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Конверсия
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0%</div>
                  <p className="text-xs text-muted-foreground">
                    Звонки в заказы
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Admin Menu */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Users className="h-6 w-6 text-blue-600" />
                    <CardTitle>Управление сотрудниками</CardTitle>
                  </div>
                  <CardDescription>
                    Добавление, редактирование и управление операторами
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" disabled>
                    Открыть (в разработке)
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-6 w-6 text-green-600" />
                    <CardTitle>Авито аккаунты</CardTitle>
                  </div>
                  <CardDescription>
                    Управление подключенными аккаунтами Авито
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" disabled>
                    Открыть (в разработке)
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-6 w-6 text-purple-600" />
                    <CardTitle>Телефония</CardTitle>
                  </div>
                  <CardDescription>
                    Управление номерами телефонов и РК
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" disabled>
                    Открыть (в разработке)
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-6 w-6 text-orange-600" />
                    <CardTitle>Статистика</CardTitle>
                  </div>
                  <CardDescription>
                    Общая статистика по всем операторам и системе
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" disabled>
                    Открыть (в разработке)
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-6 w-6 text-green-600" />
                    <CardTitle>Настройки почты</CardTitle>
                  </div>
                  <CardDescription>
                    Мониторинг почты для автоматической загрузки записей звонков
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    onClick={() => window.location.href = '/admin/email-settings'}
                  >
                    Настроить
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Settings className="h-6 w-6 text-gray-600" />
                    <CardTitle>Настройки системы</CardTitle>
                  </div>
                  <CardDescription>
                    Общие настройки CRM системы
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" disabled>
                    Открыть (в разработке)
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-6 w-6 text-blue-600" />
                    <CardTitle>Mango ATC</CardTitle>
                  </div>
                  <CardDescription>
                    Настройки интеграции с телефонией
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    onClick={() => window.location.href = '/admin/mango-settings'}
                  >
                    Настроить
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
    </DashboardLayout>
  );
}
