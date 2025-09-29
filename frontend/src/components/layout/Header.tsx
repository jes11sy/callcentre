'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from '@/components/ui/navigation-menu';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Phone, 
  MessageSquare, 
  FileText, 
  BarChart3, 
  User, 
  LogOut, 
  Settings,
  Menu,
  X,
  Building2,
  Users,
  PhoneCall,
  TrendingUp,
  Wallet,
  Mail,
  Bell,
  Circle
} from 'lucide-react';

interface HeaderProps {
  variant?: 'operator' | 'admin';
}

export function Header({ variant = 'operator' }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [workStatus, setWorkStatus] = useState('online');

  // Загружаем текущий статус работы из БД при инициализации
  useEffect(() => {
    const loadWorkStatus = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/profile`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.statusWork) {
            setWorkStatus(data.statusWork);
            console.log('Loaded work status from DB:', data.statusWork);
          }
        }
      } catch (error) {
        console.error('Error loading work status:', error);
      }
    };

    if (variant === 'operator') {
      loadWorkStatus();
    }
  }, [variant]);

  const handleWorkStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/employees/work-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ statusWork: newStatus }),
      });

      if (response.ok) {
        setWorkStatus(newStatus);
        console.log('Work status updated successfully');
      } else {
        const errorData = await response.json();
        console.error('Failed to update work status:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error updating work status:', error);
    }
  };

  const handleLogout = async () => {
    try {
      // Устанавливаем статус "оффлайн" перед выходом
      if (variant === 'operator') {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/employees/work-status`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ statusWork: 'offline' }),
          });
          console.log('Work status set to offline before logout');
        } catch (statusError) {
          console.error('Error setting offline status:', statusError);
          // Продолжаем logout даже если не удалось установить статус
        }
      }

      await authApi.logout();
      logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      logout();
      router.push('/login');
    }
  };

  const operatorNavItems = [
    { name: 'Телефония', href: '/telephony', icon: PhoneCall },
    { name: 'Центр сообщений', href: '/messages', icon: MessageSquare },
    { name: 'Заказы', href: '/orders', icon: FileText },
    { name: 'Статистика', href: '/stats', icon: TrendingUp },
  ];

  const adminNavItems = [
    { name: 'Сотрудники', href: '/admin/employees', icon: Users },
    { name: 'Авито', href: '/admin/avito', icon: MessageSquare },
    { name: 'Телефония', href: '/admin/telephony', icon: Phone },
    { name: 'Настройки почты', href: '/admin/email-settings', icon: Mail },
    { name: 'Статистика', href: '/admin/stats', icon: BarChart3 },
  ];

  const navItems = variant === 'admin' ? adminNavItems : operatorNavItems;
  const basePath = variant === 'admin' ? '/admin' : '';

  const isActive = (href: string) => pathname === href;

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Modern Header with shadcn/ui + reui */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 w-full">
          {/* Logo and Brand - слева */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Call Centre CRM</h1>
              <div className="flex items-center gap-2">
                <Badge variant={variant === 'admin' ? 'destructive' : 'secondary'} className="text-xs">
                  {variant === 'admin' ? 'Админ панель' : 'Рабочее место'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Desktop Navigation - по центру */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <NavigationMenuItem key={item.name}>
                    <NavigationMenuLink
                      href={item.href}
                      className={`group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50 ${
                        active 
                          ? 'bg-accent text-accent-foreground shadow-sm' 
                          : 'text-muted-foreground'
                      }`}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                );
              })}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Right Side Actions - справа */}
          <div className="flex items-center gap-2">
            {/* Work Status - только для операторов */}
            {variant === 'operator' && (
              <div className="hidden md:flex items-center gap-2">
                <Circle 
                  className={`h-2 w-2 ${
                    workStatus === 'online' ? 'text-green-500' : 
                    workStatus === 'offline' ? 'text-red-500' : 
                    'text-yellow-500'
                  }`} 
                />
                <Select value={workStatus} onValueChange={handleWorkStatusChange}>
                  <SelectTrigger className="w-32 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Онлайн</SelectItem>
                    <SelectItem value="offline">Оффлайн</SelectItem>
                    <SelectItem value="break">Перерыв</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Simple notification icon */}
            <Button variant="ghost" size="icon">
              <Bell className="h-4 w-4" />
            </Button>


            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" alt={user?.name || user?.login} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {getUserInitials(user?.name || user?.login || 'U')}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.name || user?.login}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {variant === 'admin' ? 'Администратор' : 'Оператор'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href={`${basePath}/profile`} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Профиль</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="#" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Настройки</span>
                  </a>
                </DropdownMenuItem>
                {variant === 'operator' && (
                  <DropdownMenuItem asChild>
                    <a href="/salary" className="cursor-pointer">
                      <Wallet className="mr-2 h-4 w-4" />
                      <span>Зарплата</span>
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Выйти</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container px-4 py-4">
            <div className="grid gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Button
                    key={item.name}
                    variant={active ? "secondary" : "ghost"}
                    className="justify-start h-12"
                    asChild
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <a href={item.href}>
                      <Icon className="mr-2 h-5 w-5" />
                      {item.name}
                    </a>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
