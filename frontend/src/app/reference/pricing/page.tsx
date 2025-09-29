'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Wrench, Monitor, Laptop, Smartphone, Tv, Droplets, Zap, Home } from 'lucide-react';
import { Header } from '@/components/layout/Header';

export default function PricingPage() {
  const pricingData = [
    {
      category: 'КП (Компьютеры)',
      icon: Monitor,
      subcategories: [
        {
          name: 'ПК/Ноутбуки/Моноблоки',
          services: [
            { name: 'Чистка от пыли', price: 'от 1500₽' },
            { name: 'Замена термопасты', price: 'от 500₽' },
            { name: 'Пайка платы', price: 'от 2000₽' },
            { name: 'Сборка компьютера с 0', price: 'от 3000₽' },
            { name: 'Обучение пользоваться', price: 'от 1500₽' },
            { name: 'Замена комплектующих', price: 'от 500₽' },
            { name: 'Установка виндовс/mac/linux', price: 'от 1000₽' },
            { name: 'Установка драйверов', price: 'от 500₽' },
            { name: 'Установка программ', price: 'от 500₽' },
            { name: 'Удаление вирусов', price: 'от 500₽' },
            { name: 'Установка антивируса', price: 'от 1000₽' },
            { name: 'Установка офис', price: 'от 1000₽' },
            { name: 'Настройка виндовс/mac/linux', price: 'от 500₽' },
            { name: 'Восстановление данных', price: 'от 1000₽' },
            { name: 'Прошивка/сброс bios', price: 'от 1500₽' },
            { name: 'Настройка bios(ПК)', price: 'от 1000₽' },
            { name: 'Улучшение ПК/Ноутбука/Моноблока', price: 'от 2000₽' },
            { name: 'Настройка интернета', price: 'от 1000₽' },
            { name: 'Другие услуги', price: 'уточнять у директора' },
          ]
        },
        {
          name: 'ТВ',
          services: [
            { name: 'Ремонт мат платы', price: 'от 2000₽' },
            { name: 'Ремонт блока питания', price: 'от 2000₽' },
            { name: 'Замена подсветки (до 43 диагонали)', price: 'от 3000₽' },
            { name: 'Замена подсветки (43-55 диагонали)', price: 'от 5000₽' },
            { name: 'Замена подсветки (свыше 55 диагонали)', price: 'от 7000₽' },
            { name: 'Прошивка тв', price: 'от 2500₽' },
            { name: 'Настройка тв', price: 'от 1000₽' },
            { name: 'Настройка приставки', price: 'от 500₽' },
            { name: 'Другие услуги', price: 'уточнять у директора' },
          ]
        }
      ]
    },
    {
      category: 'БТ (Бытовая техника)',
      icon: Wrench,
      subcategories: [
        {
          name: 'СМ/ПМ (Стиральные машины/Посудомоечные машины)',
          services: [
            { name: 'Не сливает (помпа/засор/модуль)', price: 'от 1000₽' },
            { name: 'Не греет (тэн/модуль)', price: 'от 1000₽' },
            { name: 'Не отжимает (двигатель/щетки/модуль)', price: 'от 1000₽' },
            { name: 'Замена подшипника', price: 'от 3000₽' },
            { name: 'Замена крестовины', price: 'от 3000₽' },
            { name: 'Пайка бака', price: 'от 500₽' },
            { name: 'Замена шланга', price: 'от 500₽' },
            { name: 'Замена амортизаторов', price: 'от 800₽' },
            { name: 'Замена замка открывания(убл)', price: 'от 1000₽' },
            { name: 'Замена манжеты', price: 'от 1500₽' },
            { name: 'Замена кэна (не набирает воду)', price: 'от 1000₽' },
            { name: 'Замена пресостата (не набирает воду/много воды)', price: 'от 1000₽' },
            { name: 'Ремонт модуля', price: 'от 1500₽' },
            { name: 'Замена аквастопа (не включается у некоторых см)', price: 'от 1000₽' },
            { name: 'Другие услуги', price: 'уточнять у директора' },
          ]
        },
        {
          name: 'ХД (Холодильники)',
          services: [
            { name: 'Утечка фреона', price: 'от 3000₽' },
            { name: 'Заправка фреона', price: 'от 1500₽' },
            { name: 'Замена компрессора', price: 'от 3500₽' },
            { name: 'Ремонт модуля', price: 'от 2000₽' },
            { name: 'Замена термостата', price: 'от 800₽' },
            { name: 'Замена пускового реле (ПЗР)', price: 'от 800₽' },
            { name: 'Устранение утечки в запенке', price: 'от 7000₽' },
            { name: 'Установка обманки (инверторные компрессора)', price: 'от 9000₽' },
            { name: 'Замена уплотнительных резинок', price: 'от 2500₽' },
            { name: 'Замена тэна', price: 'от 2500₽' },
            { name: 'Замена температурного датчика', price: 'от 1300₽' },
            { name: 'Замена предохранителя тэна', price: 'от 1000₽' },
            { name: 'Замена лампочки', price: 'от 1000₽' },
            { name: 'Замена вентилятора', price: 'от 1500₽' },
            { name: 'Замена заслонки', price: 'от 1500₽' },
            { name: 'Другие услуги', price: 'уточнять у директора' },
          ]
        },
        {
          name: 'ДШ (Духовые шкафы)',
          services: [
            { name: 'Замена термостата(не включатся)', price: 'от 1000₽' },
            { name: 'Замена тэна(не греет/не включается)', price: 'от 1000₽' },
            { name: 'Ремонт модуля управления', price: 'от 1500₽' },
            { name: 'Замена таймера', price: 'от 1000₽' },
            { name: 'Ремонт/замена петли', price: 'от 1500₽' },
            { name: 'Другие услуги', price: 'уточнять у директора' },
          ]
        },
        {
          name: 'ВП (Варочные панели)',
          services: [
            { name: 'Замена конфорки', price: 'от 1500₽' },
            { name: 'Замена датчика температуры', price: 'от 1500₽' },
            { name: 'Ремонт модуля', price: 'от 2000₽' },
            { name: 'Другие услуги', price: 'уточнять у директора' },
          ]
        },
        {
          name: 'Водонагреватели/бойлеры',
          services: [
            { name: 'Замена тэна', price: 'от 2000₽' },
            { name: 'Замена термостата', price: 'от 1500₽' },
            { name: 'Ремонт модуля', price: 'от 2000₽' },
            { name: 'Замена УЗО', price: 'от 1000₽' },
            { name: 'Чистка бака', price: 'от 2000₽' },
            { name: 'Другие услуги', price: 'уточнять у директора' },
          ]
        },
        {
          name: 'КДЦ (Кондиционеры)',
          services: [
            { name: 'Заправка фреоном', price: 'от 1500₽' },
            { name: 'Чистка фильтров', price: 'от 1000₽' },
            { name: 'Мойка кондиционера', price: 'от 2000₽' },
            { name: 'Замена температурного датчика', price: 'от 1500₽' },
            { name: 'Замена помпы', price: 'от 6000₽' },
            { name: 'Другие услуги', price: 'уточнять у директора' },
          ]
        },
        {
          name: 'КМ (Кофемашины)',
          services: [
            { name: 'Замена помпы', price: 'от 3000₽' },
            { name: 'Замена тэна', price: 'от 3000₽' },
            { name: 'Комплексное обслуживание', price: 'от 5000₽' },
            { name: 'Замена датчиков', price: 'от 2000₽' },
            { name: 'Ремонт модуля', price: 'от 3000₽' },
            { name: 'Другие услуги', price: 'уточнять у директора' },
          ]
        }
      ]
    },
    {
      category: 'МНЧ (Муж на час)',
      icon: Home,
      subcategories: [
        {
          name: 'Сантехника',
          services: [
            { name: 'Установка/замена раковины', price: 'от 2000₽' },
            { name: 'Установка смесителя', price: 'от 1500₽' },
            { name: 'Установка ванны', price: 'от 3500₽' },
            { name: 'Установка полотенцесушителя', price: 'от 2000₽' },
            { name: 'Установка унитаза', price: 'от 2500₽' },
            { name: 'Установка бачка унитаза', price: 'от 2000₽' },
            { name: 'Установка стиральной/посудомоечной машины с подведеными трубами', price: 'от 2000₽' },
            { name: 'Установка стиральной/посудомоечной машины без подводки', price: 'от 3500₽' },
            { name: 'Устранение протечки труб', price: 'от 2000₽' },
            { name: 'Устранение протечки унитаза/ванны/раковины/батареи', price: 'от 2000₽' },
            { name: 'Установка бойлера', price: 'от 3000₽' },
            { name: 'Разводка труб', price: 'от 3000₽' },
            { name: 'Установка/замена батареи', price: 'от 3000₽' },
            { name: 'Другие услуги', price: 'уточнять у директора' },
          ]
        },
        {
          name: 'Электрика',
          services: [
            { name: 'Замена розетки', price: 'от 800₽' },
            { name: 'Замена выключателя', price: 'от 800₽' },
            { name: 'Установка люстры', price: 'от 1500₽' },
            { name: 'Подключение электроплиты/духового шкафа', price: 'от 2000₽' },
            { name: 'Установка УЗО', price: 'от 1000₽' },
            { name: 'Установка электросчетчика', price: 'от 2000₽' },
            { name: 'Установка звонка', price: 'от 800₽' },
            { name: 'Установка светильников', price: 'от 1000₽' },
            { name: 'Монтаж автоматов защиты', price: 'от 1000₽' },
            { name: 'Монтаж электрощита', price: 'от 3500₽' },
            { name: 'Монтаж электропроводки', price: 'от 100₽/пог.м' },
            { name: 'Установка распред коробки', price: 'от 800₽' },
            { name: 'Другие услуги', price: 'уточнять у директора' },
          ]
        },
        {
          name: 'Муж на час',
          services: [
            { name: 'Замена зеркал', price: 'от 1000₽' },
            { name: 'Мелкий бытовой ремонт', price: 'от 1000₽' },
            { name: 'Сборка мебели', price: 'от 1500₽' },
            { name: 'Другие услуги', price: 'уточнять у директора' },
          ]
        }
      ]
    }
  ];

  return (
    <>
      <Header variant="operator" />
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <DollarSign className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Прайс-лист</h1>
          <p className="text-muted-foreground">Актуальные цены на услуги по ремонту</p>
        </div>
      </div>

      <div className="space-y-8">
        {pricingData.map((category, index) => {
          const Icon = category.icon;
          return (
            <div key={index} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Icon className="h-6 w-6 text-primary" />
                    <span>{category.category}</span>
                  </CardTitle>
                  <CardDescription>Услуги по ремонту {category.category.toLowerCase()}</CardDescription>
                </CardHeader>
              </Card>
              
              <div className="grid gap-6">
                {category.subcategories.map((subcategory, subIndex) => (
                  <Card key={subIndex} className="ml-4">
                    <CardHeader>
                      <CardTitle className="text-lg">{subcategory.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Услуга</TableHead>
                            <TableHead className="text-right">Цена</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subcategory.services.map((service, serviceIndex) => (
                            <TableRow key={serviceIndex}>
                              <TableCell className="font-medium">{service.name}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant="outline" className="font-semibold">
                                  {service.price}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
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
    </>
  );
}
