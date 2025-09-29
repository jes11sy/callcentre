'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn, Loader2, Phone, Users, MessageSquare, ShoppingCart, User, Lock, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import { authApi, LoginCredentials } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';

const loginSchema = z.object({
  login: z.string().min(1, 'Логин обязателен').min(3, 'Минимум 3 символа'),
  password: z.string().min(1, 'Пароль обязателен').min(3, 'Минимум 3 символа'),
  role: z.enum(['admin', 'operator'], {
    required_error: 'Выберите роль',
  }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { login: loginUser } = useAuthStore();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      login: '',
      password: '',
      role: 'operator',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Force role to operator for this login form
      const loginData = { ...data, role: 'operator' as const };
      const response = await authApi.login(loginData);
      
      // Save tokens and user data
      authApi.saveTokens(response.data.accessToken, response.data.refreshToken);
      authApi.saveUser(response.data.user);
      loginUser(response.data.user);

          // Redirect to telephony page (main page for operators)
          router.push('/telephony');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.error?.message || 
        'Ошибка входа. Проверьте логин и пароль.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 to-green-900 text-gray-100 flex flex-col items-center justify-center p-4">
      {/* Logo Section */}
      <div className="flex flex-col items-center mb-8">
        <div className="text-gray-400 text-xl font-medium">
          Система управления колл-центром
        </div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-gray-900/80 backdrop-blur-md rounded-2xl p-10 shadow-2xl border border-white/5">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Вход для операторов</h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="login"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300 text-base font-medium">Логин</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                      <Input
                        placeholder="Введите ваш логин"
                        {...field}
                        disabled={isLoading}
                        className="h-12 pl-10 bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500 focus:border-green-500 focus:ring-green-500/20"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300 text-base font-medium">Пароль</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Введите ваш пароль"
                        {...field}
                        disabled={isLoading}
                        className="h-12 pl-10 pr-12 bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500 focus:border-green-500 focus:ring-green-500/20"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-12 px-3 text-gray-500 hover:text-gray-300 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-700 text-gray-100 font-medium rounded-lg transition-all duration-300 hover:-translate-y-0.5 shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Вход в систему...
                </>
              ) : (
                <>
                  Войти в систему
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        </Form>
      </div>


      {/* Footer */}
      <div className="mt-12 text-center text-gray-500 text-sm">
        © 2025 Новые Схемы. Все права защищены.
      </div>
    </div>
  );
}