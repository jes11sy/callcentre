'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';

export default function ReferencePage() {
  const referenceSections = [
    {
      title: 'Правила сотрудника',
      description: 'Основные правила и требования для операторов',
      href: '/reference/employee-rules',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      features: ['Рабочее время', 'Обязанности', 'Запреты']
    },
    {
      title: 'Правило приема заказов',
      description: 'Процедуры и требования при создании заказов',
      href: '/reference/order-rules',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      features: ['Обязательные поля', 'Временные слоты', 'Типы заявок']
    },
    {
      title: 'Прайс',
      description: 'Актуальные цены на услуги по ремонту',
      href: '/reference/pricing',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      features: ['КП (Компьютеры)', 'БТ (Бытовая техника)', 'МНЧ (Муж на час)']
    },
    {
      title: 'Незаказы',
      description: 'Причины отказа от заказов и правила обработки',
      href: '/reference/non-orders',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      features: ['Технические причины', 'Отказ клиента', 'Некорректные обращения']
    }
  ];

  return (
    <>
      <Header variant="operator" />
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <BookOpen className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Справочник</h1>
          <p className="text-muted-foreground">Справочная информация для операторов</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {referenceSections.map((section, index) => {
          return (
            <Link key={index} href={section.href} className="group">
              <Card className={`h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer ${section.bgColor} ${section.borderColor} border-2`}>
                <CardHeader>
                  <CardTitle className={`flex items-center space-x-2 ${section.color}`}>
                    <span>{section.title}</span>
                    <ArrowRight className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform" />
                  </CardTitle>
                  <CardDescription className="text-base">
                    {section.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      Содержит разделы:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {section.features.map((feature, featureIndex) => (
                        <Badge key={featureIndex} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-primary">
            <BookOpen className="h-5 w-5" />
            <span>Быстрый доступ</span>
          </CardTitle>
          <CardDescription>
            Все разделы справочника доступны для быстрого поиска информации
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">Цены</Badge>
              <span>Актуальные цены на ремонт по всем категориям техники</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">Правила</Badge>
              <span>Обязательные процедуры и требования для операторов</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">Незаказы</Badge>
              <span>Руководство по обработке отказов и проблемных ситуаций</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
