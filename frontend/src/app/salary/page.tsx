'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Calendar,
  TrendingUp,
  Clock,
  FileText,
  AlertCircle
} from 'lucide-react';

export default function SalaryPage() {
  return (
    <DashboardLayout variant="operator" requiredRole="operator">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <DollarSign className="h-8 w-8 mr-3 text-green-600" />
                  Зарплата
                </h1>
                <p className="text-gray-600 mt-2">
                  Информация о заработной плате и выплатах
                </p>
              </div>
            </div>
          </div>

          {/* Coming Soon Card */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
              <CardTitle className="text-2xl">Скоро будет доступно</CardTitle>
              <CardDescription className="text-lg">
                Раздел "Зарплата" находится в разработке
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                В этом разделе вы сможете просматривать:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium">История выплат</p>
                    <p className="text-sm text-gray-600">Все предыдущие зарплаты</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium">Статистика доходов</p>
                    <p className="text-sm text-gray-600">Графики и аналитика</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <div className="text-left">
                    <p className="font-medium">Отработанные часы</p>
                    <p className="text-sm text-gray-600">Учет рабочего времени</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <FileText className="h-5 w-5 text-orange-600" />
                  <div className="text-left">
                    <p className="font-medium">Справки и документы</p>
                    <p className="text-sm text-gray-600">Скачивание документов</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-800 font-medium">
                  Ожидаемая дата запуска: Q1 2025
                </p>
                <p className="text-blue-600 text-sm mt-1">
                  Следите за обновлениями в системе
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
