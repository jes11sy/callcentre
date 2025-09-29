'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserCheck, Clock, AlertCircle, CheckCircle, MessageSquare, Phone, Users, FileText, Hash } from 'lucide-react';
import { Header } from '@/components/layout/Header';

export default function EmployeeRulesPage() {
  return (
    <>
      <Header variant="operator" />
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
              <span>Рабочий график</span>
            </CardTitle>
            <CardDescription>Требования к рабочему времени и графику</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Рабочий график:</strong> с 9:00 до 20:00</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Перерыв:</strong> 1 час (сообщать заранее)</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Отметка:</strong> каждое утро отмечаться в рабочем чате</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <span>Общение с руководством</span>
            </CardTitle>
            <CardDescription>Правила общения с директорами и руководством</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Общение с руководством и директорами</strong> производится исключительно в специальных чатах</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Общение должно быть максимально вежливое и тактичное</strong></span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="h-5 w-5 text-orange-600" />
              <span>Основные обязанности</span>
            </CardTitle>
            <CardDescription>Что входит в обязанности оператора</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Прием входящих звонков</strong></span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Перенос клиентов на другое время</strong> по запросу директора</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Обзванивать клиентов</strong> по запросу директора</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Отвечать на сообщения в Авито</strong> (Центр сообщений)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-600" />
              <span>Контроль качества</span>
            </CardTitle>
            <CardDescription>Обязательные процедуры контроля качества</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="font-semibold text-yellow-800">Обзвон клиентов за прошлый день</span>
              </div>
              <div className="text-sm text-yellow-700 space-y-2">
                <div>• Уточнение по поводу качественно выполненного ремонта</div>
                <div>• Уточнение суммы</div>
                <div>• <strong>Если клиент не доволен или цена отличается от заявленной в CRM - срочно оповестить директора</strong></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <span>Примеры общения по заказам</span>
            </CardTitle>
            <CardDescription>Стандартные фразы для общения с руководством</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="font-semibold text-blue-800">Заказ 123 перенос на 15:00</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="font-semibold text-red-800">Заказ 123 отмена</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="font-semibold text-orange-800">Заказ 123 сумма отличается от базы, клиент сообщил "сумма"</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="font-semibold text-red-800">Заказ 123 негатив, клиент не доволен тем то тем то</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="font-semibold text-yellow-800">Заказ 123 нет мастера, когда будет?</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="font-semibold text-blue-800">Заказ 123 клиент уточняет что с техникой, ждет информации от мастера</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Hash className="h-5 w-5 text-purple-600" />
              <span>Сокращения и аббревиатуры</span>
            </CardTitle>
            <CardDescription>Обязательные сокращения для использования в работе</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">КП</Badge>
                    <span className="text-sm">Компьютерная помощь (ремонт цифровой техники)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">БТ</Badge>
                    <span className="text-sm">Бытовая техника</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">МНЧ</Badge>
                    <span className="text-sm">Муж на час</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">ПК</Badge>
                    <span className="text-sm">Персональный компьютер</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">СМ</Badge>
                    <span className="text-sm">Стиральная машина</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">ПМ</Badge>
                    <span className="text-sm">Посудомоечная машина</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">КМ</Badge>
                    <span className="text-sm">Кофемашина</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">ДШ</Badge>
                    <span className="text-sm">Духовой шкаф</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">ВП</Badge>
                    <span className="text-sm">Варочная панель, электроплита</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">КДЦ</Badge>
                    <span className="text-sm">Кондиционер</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">ХД</Badge>
                    <span className="text-sm">Холодильник</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">МС</Badge>
                    <span className="text-sm">Мастер</span>
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="grid gap-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="destructive">Незаказ</Badge>
                    <span className="text-sm">Техника, которую не ремонтируем</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">Модерн</Badge>
                    <span className="text-sm">Модернизация/мастер забрал технику на ремонт</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-800">
              <Badge variant="destructive">Важно</Badge>
              <span>Дополнительные вопросы</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-red-700">
              <div className="font-semibold mb-2">Занимаемся ли ремонтом инверторов у СМ?</div>
              <div>Если да, то на какое время принять и от какой суммы.</div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </>
  );
}
