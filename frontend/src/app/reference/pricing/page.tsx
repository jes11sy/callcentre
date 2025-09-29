'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Wrench, Monitor, Laptop, Smartphone } from 'lucide-react';

export default function PricingPage() {
  const pricingData = [
    {
      category: 'КП (Компьютеры)',
      icon: Monitor,
      services: [
        { name: 'Диагностика', price: 'Бесплатно', description: 'Первичная диагностика неисправности' },
        { name: 'Установка Windows', price: '1500-2500₽', description: 'Установка операционной системы' },
        { name: 'Чистка от вирусов', price: '800-1500₽', description: 'Удаление вирусов и вредоносного ПО' },
        { name: 'Замена комплектующих', price: '500-2000₽', description: 'Замена деталей + стоимость детали' },
        { name: 'Восстановление данных', price: '2000-5000₽', description: 'Восстановление удаленных файлов' },
      ]
    },
    {
      category: 'БТ (Бытовая техника)',
      icon: Wrench,
      services: [
        { name: 'Диагностика', price: 'Бесплатно', description: 'Первичная диагностика неисправности' },
        { name: 'Ремонт стиральной машины', price: '2000-4000₽', description: 'Ремонт + стоимость запчастей' },
        { name: 'Ремонт холодильника', price: '2500-5000₽', description: 'Ремонт + стоимость запчастей' },
        { name: 'Ремонт микроволновки', price: '1500-3000₽', description: 'Ремонт + стоимость запчастей' },
        { name: 'Ремонт пылесоса', price: '1000-2500₽', description: 'Ремонт + стоимость запчастей' },
      ]
    },
    {
      category: 'МНЧ (Мобильные устройства)',
      icon: Smartphone,
      services: [
        { name: 'Диагностика', price: 'Бесплатно', description: 'Первичная диагностика неисправности' },
        { name: 'Замена экрана', price: '3000-8000₽', description: 'Замена + стоимость экрана' },
        { name: 'Замена батареи', price: '1500-3000₽', description: 'Замена + стоимость батареи' },
        { name: 'Ремонт после воды', price: '2000-5000₽', description: 'Чистка и восстановление' },
        { name: 'Разблокировка', price: '1000-3000₽', description: 'Снятие блокировки устройства' },
      ]
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <DollarSign className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Прайс-лист</h1>
          <p className="text-muted-foreground">Актуальные цены на услуги по ремонту</p>
        </div>
      </div>

      <div className="space-y-6">
        {pricingData.map((category, index) => {
          const Icon = category.icon;
          return (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Icon className="h-6 w-6 text-primary" />
                  <span>{category.category}</span>
                </CardTitle>
                <CardDescription>Услуги по ремонту {category.category.toLowerCase()}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Услуга</TableHead>
                      <TableHead>Цена</TableHead>
                      <TableHead>Описание</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {category.services.map((service, serviceIndex) => (
                      <TableRow key={serviceIndex}>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-semibold">
                            {service.price}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {service.description}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-orange-800">
            <Badge variant="outline" className="border-orange-300 text-orange-800">
              Важно
            </Badge>
            <span>Дополнительная информация</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 text-sm">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">Гарантия</Badge>
              <span>На все виды работ предоставляется гарантия 3-6 месяцев</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">Оплата</Badge>
              <span>Оплата производится после выполнения работ</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">Скидки</Badge>
              <span>Постоянным клиентам предоставляются скидки до 15%</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">Выезд</Badge>
              <span>Выезд мастера на дом: 500₽ (засчитывается в стоимость ремонта)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
