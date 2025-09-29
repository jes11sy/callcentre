'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, FileText, Clock, CheckCircle, AlertCircle, User, MessageSquare, DollarSign, Phone, Shield } from 'lucide-react';
import { Header } from '@/components/layout/Header';

export default function OrderRulesPage() {
  return (
    <>
      <Header variant="operator" />
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
              <User className="h-5 w-5 text-blue-600" />
              <span>Роли и представление</span>
            </CardTitle>
            <CardDescription>Как представляться клиентам</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Общение ведется от лица мастера/напарника мастера/жены мастера</strong></span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>При первом звонке:</strong> "Здравствуйте, это [Имя] мастер по ремонту [тип техники]"</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>При повторном звонке с негативом:</strong> представиться напарником мастера/женой и сказать что передадите всю информацию, вопрос решится в ближайшие минуты</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Если клиент спрашивает про компанию:</strong> говорить что работаем индивидуально, но с напарниками</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <span>Этика общения</span>
            </CardTitle>
            <CardDescription>Правила вежливого общения с клиентами</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span><strong>НЕ грубить/не хамить</strong></span>
              </div>
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span><strong>НЕ перебивать клиента</strong></span>
              </div>
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span><strong>НЕ использовать жаргон и мат</strong></span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Всегда вежливо и профессионально</strong></span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Говорить четко и понятно</strong></span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Слушать клиента до конца</strong></span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Использовать "Вы" при обращении</strong></span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Извиняться за неудобства, если они есть</strong></span>
              </div>
            </div>
          </CardContent>
        </Card>

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
              <DollarSign className="h-5 w-5 text-orange-600" />
              <span>Правила работы с ценами</span>
            </CardTitle>
            <CardDescription>Как правильно говорить о ценах с клиентами</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-red-600 mb-2">🚫 Что НЕ говорить:</h4>
                <div className="grid gap-2">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span>"В районе", "до", "примерно"</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span>Конкретные суммы без диагностики</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-green-600 mb-2">✅ Что говорить:</h4>
                <div className="grid gap-2">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span><strong>"Цены ОТ [сумма]"</strong> - всегда "ОТ", никаких других формулировок</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span><strong>"Давайте лучше подъеду, посмотрю и на месте все скажу"</strong></span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span><strong>"Не волнуйтесь, о цене договоримся, главное чтобы вы остались довольны"</strong></span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span><strong>"По вашему описанию сложно сказать в чем именно проблема, лучше посмотреть на месте. Цену озвучу сразу после диагностики"</strong></span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-blue-600 mb-2">🎯 Стратегия ухода от цен:</h4>
                <div className="grid gap-2">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span>Всегда стараться уходить от вопросов о цене</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span>Говорить о необходимости диагностики</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span>Цену обсудим на месте сразу до начала работ</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span>Если клиент очень настаивает - назвать сумму из прайса</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Badge variant="destructive">КРИТИЧЕСКИ ВАЖНО</Badge>
              <span>Правила заполнения описания проблемы</span>
            </CardTitle>
            <CardDescription>Обязательные требования к описанию проблемы</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2">💰 Обязательно указывать суммы:</h4>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-yellow-600" />
                  <span><strong>В описании проблемы ВСЕГДА указывать суммы, которые были озвучены клиенту</strong></span>
                </div>
                <div className="mt-2 text-sm text-yellow-700">
                  <strong>Пример:</strong> "Проблема: не включается ноутбук. Озвучена цена ОТ 1500₽ за диагностику"
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-800 mb-2">📱 Для заказов с Авито:</h4>
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span><strong>В описание проблемы ОБЯЗАТЕЛЬНО дописывать: "ОБЯЗАТЕЛЬНО ОТЗЫВ!"</strong></span>
                </div>
                <div className="mt-2 text-sm text-red-700">
                  <strong>Пример:</strong> "Проблема: сломался холодильник. Озвучена цена ОТ 2000₽. ОБЯЗАТЕЛЬНО ОТЗЫВ!"
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="h-5 w-5 text-purple-600" />
              <span>Техника ведения разговора</span>
            </CardTitle>
            <CardDescription>Как правильно вести разговор с клиентом</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Начинать с приветствия и представления</strong></span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Уточнять удобное время для звонка/встречи</strong></span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Задавать уточняющие вопросы о проблеме</strong></span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Всегда благодарить за обращение</strong></span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-red-600" />
              <span>Критические ситуации</span>
            </CardTitle>
            <CardDescription>Как вести себя в сложных ситуациях</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span><strong>При агрессии клиента - сохранять спокойствие, не отвечать грубостью</strong></span>
              </div>
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span><strong>При технических проблемах - честно говорить о возможных сложностях</strong></span>
              </div>
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span><strong>При сомнениях в диагнозе - предлагать диагностику</strong></span>
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
    </>
  );
}
