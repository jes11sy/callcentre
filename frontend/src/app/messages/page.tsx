'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  RefreshCw,
  Send,
  FileText,
  User,
  MapPin,
  Calendar,
  ExternalLink,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  Mic,
  Phone,
  Link as LinkIcon,
  Trash2,
  Settings,
  MoreVertical,
  Users,
  MessageCircle
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { authApi } from '@/lib/auth';
import { LoadingState, LoadingSpinner } from '@/components/ui/loading';
import { ErrorBoundary, ErrorMessage, EmptyState } from '@/components/ui/error-boundary';
import { notifications } from '@/components/ui/notifications';
import { cn } from '@/lib/utils';
import { CreateOrderFromChatModal } from '@/components/messages/CreateOrderFromChatModal';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';

// Types
interface AvitoAccount {
  id: number;
  name: string;
  connectionStatus: string;
}

interface AvitoChat {
  id: string;
  created: number;
  updated: number;
  itemInfo?: {
    id: number;
    title: string;
    price?: string;
    url: string;
    image?: string;
    status: number;
    city?: string;
  };
  lastMessage?: {
    id: string;
    authorId: number;
    text: string;
    created: number;
    direction: 'in' | 'out';
    type: string;
    isRead?: boolean; // API doesn't provide this in chat list
  };
  users: Array<{
    id: number;
    name: string;
    avatar?: string;
    profileUrl?: string;
  }>;
  avitoAccountName: string;
  city: string;
  rk: string;
  unreadCount?: number;
  hasNewMessage?: boolean;
}

interface AvitoMessage {
  id: string;
  authorId: number;
  content: any;
  text: string;
  created: number;
  createdFormatted: string;
  direction: 'in' | 'out';
  type: string;
  isRead: boolean;
  imageUrl?: string;
  voiceUrl?: string;
}

interface LinkedOrder {
  id: number;
  rk: string;
  city: string;
  avitoName?: string;
  avitoChatId?: string;
  phone: string;
  typeOrder: 'first_time' | 'repeat' | 'warranty';
  clientName: string;
  address: string;
  dateMeeting: string;
  typeEquipment: 'kp' | 'bt' | 'mnch';
  problem: string;
  callRecord?: string;
  statusOrder: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  result?: number;
  expenditure?: number;
  clean?: number;
  bsoDoc?: string;
  expenditureDoc?: string;
  masterId?: number;
  operatorNameId: number;
  createDate: string;
  closingData?: string;
  createdAt: string;
  updatedAt: string;
  operator: {
    id: number;
    name: string;
    login: string;
  };
  avito?: {
    id: number;
    name: string;
  };
}

// Form schemas
const sendMessageSchema = z.object({
  message: z.string().min(1, 'Сообщение не может быть пустым')
});

type SendMessageFormData = z.infer<typeof sendMessageSchema>;

export default function MessagesPage() {
  const router = useRouter();
  const socket = useSocket();
  
  // State
  const [avitoAccounts, setAvitoAccounts] = useState<AvitoAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [chats, setChats] = useState<AvitoChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<AvitoChat | null>(null);
  const [messages, setMessages] = useState<AvitoMessage[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUnread, setFilterUnread] = useState(false);
  
  // Loading states
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  
  // Auto-refresh states
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [chatsRefreshInterval, setChatsRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  
        // Removed lastSeenMessageIds - now using Avito's is_read from loaded messages
  
  // Dialog states (removed showMessageDialog as we now use inline chat)
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [showLinkedOrdersModal, setShowLinkedOrdersModal] = useState(false);
  const [selectedChatForOrder, setSelectedChatForOrder] = useState<AvitoChat | null>(null);
  const [linkedOrders, setLinkedOrders] = useState<LinkedOrder[]>([]);
  const [linkedOrdersLoading, setLinkedOrdersLoading] = useState(false);
  
  // Function to scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      // Find the messages container first
      const messagesContainer = document.querySelector('.flex-1.p-6.bg-gradient-to-b.from-slate-50.to-gray-100');
      if (messagesContainer) {
        // Look for scrollable viewport inside messages container
        const scrollViewport = messagesContainer.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollViewport) {
          scrollViewport.scrollTop = scrollViewport.scrollHeight;
          console.log('✅ Scrolled messages area');
          return;
        }
      }
      
      // Fallback: try to find any scrollable element in the messages area
      const messagesArea = document.querySelector('[data-radix-scroll-area-viewport]');
      if (messagesArea) {
        messagesArea.scrollTop = messagesArea.scrollHeight;
        console.log('✅ Scrolled fallback area');
      }
    }, 300);
  };
  
  // Auto-scroll only when sending message
  const [shouldScroll, setShouldScroll] = useState(false);
  
  useEffect(() => {
    if (shouldScroll && messages.length > 0) {
      scrollToBottom();
      setShouldScroll(false);
    }
  }, [messages, shouldScroll]);

  // Form
  const { register: registerMessage, handleSubmit: handleSubmitMessage, reset: resetMessage, formState: { errors: messageErrors } } = useForm<SendMessageFormData>({
    resolver: zodResolver(sendMessageSchema)
  });

  // Load Avito accounts
  const loadAvitoAccounts = async () => {
    try {
      setAccountsLoading(true);
      const response = await authApi.get('/avito-messenger/accounts');
      
      if (response.data.success) {
        setAvitoAccounts(response.data.data);
        if (response.data.data.length > 0 && !selectedAccount) {
          // If multiple accounts, default to "All accounts", otherwise select the single account
          if (response.data.data.length > 1) {
            setSelectedAccount('__ALL__');
          } else {
            setSelectedAccount(response.data.data[0].name);
          }
        }
      } else {
        throw new Error(response.data.message || 'Ошибка при получении аккаунтов');
      }
    } catch (err: any) {
      console.error('Error loading Avito accounts:', err);
      notifications.error('Ошибка при загрузке аккаунтов Авито: ' + (err.response?.data?.message || err.message));
    } finally {
      setAccountsLoading(false);
    }
  };

  // Load chats from all accounts
  const loadChatsFromAllAccounts = async (silent = false) => {
    // Предотвращаем параллельные загрузки
    if (isLoadingChats) {
      console.log('⏸️ Skipping loadChatsFromAllAccounts - already loading');
      return;
    }
    
    try {
      setIsLoadingChats(true);
      if (!silent) {
        setChatsLoading(true);
      }
      
      // Load chats from all accounts in parallel
      const chatPromises = avitoAccounts.map(async (account) => {
        try {
          const params = new URLSearchParams({
            avitoAccountName: account.name,
            limit: '50',
            offset: '0',
            unread_only: filterUnread ? 'true' : 'false'
          });

          const response = await authApi.get(`/avito-messenger/chats?${params.toString()}`);
          
          if (response.data.success) {
            // Add account name to each chat for identification
            return response.data.data.chats.map((chat: AvitoChat) => ({
              ...chat,
              avitoAccountName: account.name
            }));
          }
          return [];
        } catch (error) {
          console.error(`Error loading chats for account ${account.name}:`, error);
          return [];
        }
      });

      const accountChats = await Promise.all(chatPromises);
      
      // Flatten and remove duplicates
      const allChats = accountChats.flat();
      
      console.log('🔍 All chats before dedup:', allChats.length);
      console.log('🔍 Sample chat data:', allChats[0]);
      
      // Дедупликация по уникальному ключу (chat.id + avitoAccountName)
      const uniqueChatsMap = new Map<string, AvitoChat>();
      const duplicates: string[] = [];
      
      allChats.forEach((chat: AvitoChat) => {
        const uniqueKey = `${chat.id}_${chat.avitoAccountName}`;
        if (uniqueChatsMap.has(uniqueKey)) {
          duplicates.push(`Дубль: ${chat.users[0]?.name} (${chat.avitoAccountName}) - ID: ${chat.id}`);
        } else {
          uniqueChatsMap.set(uniqueKey, chat);
        }
      });
      
      if (duplicates.length > 0) {
        console.error('🔴 НАЙДЕНЫ ДУБЛИ:', duplicates);
      }
      
      // Convert back to array and sort by last message time
      const uniqueChats = Array.from(uniqueChatsMap.values())
        .sort((a, b) => {
          const timeA = (a as any).last_message?.created || a.lastMessage?.created || a.updated;
          const timeB = (b as any).last_message?.created || b.lastMessage?.created || b.updated;
          return timeB - timeA; // Newest first
        });

      // Set chats with existing hasNewMessage status
      const updatedChats = uniqueChats.map((chat: AvitoChat) => {
        const existingChat = chats.find(c => c.id === chat.id && c.avitoAccountName === chat.avitoAccountName);
        return {
          ...chat,
          hasNewMessage: existingChat?.hasNewMessage || false
        };
      });
      
      setChats(updatedChats);
      console.log(`📝 Loaded ${updatedChats.length} unique chats from all accounts (before dedup: ${allChats.length})`);
      
    } catch (err: any) {
      console.error('Error loading chats from all accounts:', err);
      if (!silent) {
        notifications.error('Ошибка при загрузке чатов');
      }
    } finally {
      setIsLoadingChats(false);
      if (!silent) {
        setChatsLoading(false);
      }
    }
  };

  // Load chats for selected account
  const loadChats = async (silent = false) => {
    if (!selectedAccount) return;
    
    // If "All accounts" is selected, use special function
    if (selectedAccount === '__ALL__') {
      return loadChatsFromAllAccounts(silent);
    }
    
    // Предотвращаем параллельные загрузки
    if (isLoadingChats) {
      console.log('⏸️ Skipping loadChats - already loading');
      return;
    }
    
    try {
      setIsLoadingChats(true);
      if (!silent) {
        setChatsLoading(true);
      }
      
      const params = new URLSearchParams({
        avitoAccountName: selectedAccount,
        limit: '50',
        offset: '0',
        unread_only: filterUnread ? 'true' : 'false'
      });

      const response = await authApi.get(`/avito-messenger/chats?${params.toString()}`);
      
      if (response.data.success) {
        const newChats = response.data.data.chats;
        
        console.log('📝 Processing chats:', newChats.length);
        console.log('📝 First chat sample:', newChats[0]);

        // Set chats first
        const updatedChats = newChats.map((chat: AvitoChat) => {
          const existingChat = chats.find(c => c.id === chat.id);
          return {
            ...chat,
            hasNewMessage: existingChat?.hasNewMessage || false
          };
        });
        
        setChats(updatedChats);

        if (selectedAccount) {
          console.log(`🚀 Checking unread chats for account: ${selectedAccount} (silent: ${silent})`);
          checkUnreadChats();
        }
      } else {
        throw new Error(response.data.message || 'Ошибка при получении чатов');
      }
    } catch (err: any) {
      console.error('Error loading chats:', err);
      if (!silent) {
        notifications.error('Ошибка при загрузке чатов');
      }
    } finally {
      setIsLoadingChats(false);
      if (!silent) {
        setChatsLoading(false);
      }
    }
  };

  // Mark chat as read (remove new message indicator)
  const markChatAsRead = (chatId: string) => {
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === chatId 
          ? { ...chat, hasNewMessage: false }
          : chat
      )
    );
  };

  // Mark messages as read on Avito
  const markMessagesAsReadOnAvito = async (chat: AvitoChat) => {
    try {
      await authApi.post(`/avito-messenger/chats/${chat.id}/read`, {
        avitoAccountName: chat.avitoAccountName
      });
      console.log(`✅ Messages marked as read for chat ${chat.id} on Avito`);
    } catch (error) {
      console.error('❌ Error marking messages as read on Avito:', error);
      // Не показываем ошибку пользователю, это фоновая операция
    }
  };

  // Removed checkChatReadStatus - using Avito API unread_only parameter instead

  // Check unread chats using Avito API unread_only parameter
  const checkUnreadChats = async () => {
    if (!selectedAccount) {
      console.log('❌ No selected account for checking unread');
      return;
    }

    try {
      console.log(`🔍 Getting unread chats from Avito API...`);

      const params = new URLSearchParams({
        avitoAccountName: selectedAccount,
        unread_only: 'true', // ВОТ ОНО! Авито API параметр
        limit: '50',
        offset: '0'
      });

      const response = await authApi.get(`/avito-messenger/chats?${params.toString()}`);
      
      if (response.data.success) {
        const unreadChats = response.data.data.chats;
        console.log(`🔔 Found ${unreadChats.length} unread chats from Avito API`);
        
        // Mark these chats as having new messages
        if (unreadChats.length > 0) {
          const unreadChatIds = unreadChats.map((chat: AvitoChat) => chat.id);
          
          setChats(prevChats => 
            prevChats.map(chat => ({
              ...chat,
              hasNewMessage: unreadChatIds.includes(chat.id)
            }))
          );
          
          console.log(`✅ Marked ${unreadChatIds.length} chats as unread:`, unreadChatIds);
        }
      } else {
        console.log(`❌ Failed to get unread chats:`, response.data.message);
      }
    } catch (error) {
      console.error('❌ Error getting unread chats:', error);
    }
  };

  // Auto-refresh messages for selected chat
  const startAutoRefresh = (chat: AvitoChat) => {
    // Clear existing interval
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
    }

    // Start new interval - refresh every 30 seconds
    const interval = setInterval(() => {
      loadMessages(chat, true); // true = silent refresh
    }, 30000);

    setAutoRefreshInterval(interval);
  };

  const stopAutoRefresh = () => {
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
      setAutoRefreshInterval(null);
    }
  };

  // Auto-refresh chats list
  const startChatsAutoRefresh = () => {
    // Clear existing interval
    if (chatsRefreshInterval) {
      clearInterval(chatsRefreshInterval);
    }

    // Start new interval - refresh every 30 seconds
    const interval = setInterval(() => {
      if (selectedAccount) {
        loadChats(true); // true = silent refresh
      }
    }, 30000);

    setChatsRefreshInterval(interval);
  };

  const stopChatsAutoRefresh = () => {
    if (chatsRefreshInterval) {
      clearInterval(chatsRefreshInterval);
      setChatsRefreshInterval(null);
    }
  };

  // Load voice file URLs for voice messages
  const loadVoiceUrls = async (messages: AvitoMessage[], chat: AvitoChat) => {
    const voiceMessages = messages.filter(msg => msg.type === 'voice' && msg.content?.voice?.voice_id);
    if (voiceMessages.length === 0) return messages;

    try {
      const voiceIds = voiceMessages.map(msg => msg.content.voice.voice_id);
      const response = await authApi.post(
        `/avito-messenger/voice-files?avitoAccountName=${chat.avitoAccountName}`,
        { voiceIds }
      );

      if (response.data.success) {
        const voiceUrls = response.data.data;
        return messages.map(msg => {
          if (msg.type === 'voice' && msg.content?.voice?.voice_id) {
            return {
              ...msg,
              voiceUrl: voiceUrls[msg.content.voice.voice_id]
            };
          }
          return msg;
        });
      }
    } catch (error) {
      console.error('Error loading voice URLs:', error);
    }
    return messages;
  };

  // Load messages for selected chat
  const loadMessages = async (chat: AvitoChat, silent = false) => {
    try {
      if (!silent) {
        setMessagesLoading(true);
      }
      
      const params = new URLSearchParams({
        avitoAccountName: chat.avitoAccountName,
        limit: '50',
        offset: '0'
      });

      const response = await authApi.get(`/avito-messenger/chats/${chat.id}/messages?${params.toString()}&_t=${Date.now()}`);
      
      console.log('🔍 Full response:', response);
      console.log('🔍 Response data:', response.data);
      
      if (response.data.success) {
      console.log('🔍 Raw response data:', response.data);
      console.log('🔍 Data object:', response.data.data);
      console.log('🔍 Messages array:', response.data.data?.messages);
      let messages = response.data.data?.messages || [];
      console.log('📨 Messages loaded:', messages.length, messages);
        
        if (messages.length > 0) {
          const reversedMessages = messages.reverse(); // Reverse to show oldest first
          
          // Load voice URLs for voice messages
          const messagesWithVoice = await loadVoiceUrls(reversedMessages, chat);
          setMessages(messagesWithVoice);
          console.log('✅ Messages set to state:', messagesWithVoice.length);
          
          // Auto-scroll to show last message ONLY when opening chat (not on silent refresh)
          if (!silent) {
            setShouldScroll(true);
          }
        } else {
          setMessages([]);
          console.log('❌ No messages found');
        }
        
        // Removed checkChatReadStatus call
      } else {
        throw new Error(response.data.message || 'Ошибка при получении сообщений');
      }
    } catch (err: any) {
      console.error('Error loading messages:', err);
      if (!silent) {
        notifications.error('Ошибка при загрузке сообщений');
      }
    } finally {
      if (!silent) {
        setMessagesLoading(false);
      }
    }
  };

  // Function to load linked orders for a chat
  const loadLinkedOrders = async (chatId: string) => {
    try {
      setLinkedOrdersLoading(true);
      
      const response = await authApi.get(`/orders?avitoChatId=${chatId}`);
      
      if (response.data.success) {
        const orders = response.data.data?.orders || [];
        setLinkedOrders(orders);
        console.log('📋 Linked orders loaded:', orders.length, orders);
      } else {
        throw new Error(response.data.message || 'Ошибка при получении привязанных заказов');
      }
    } catch (err: any) {
      console.error('Error loading linked orders:', err);
      notifications.error('Ошибка при загрузке привязанных заказов');
      setLinkedOrders([]);
    } finally {
      setLinkedOrdersLoading(false);
    }
  };

  // Send message
  const onSendMessage = async (data: SendMessageFormData) => {
    if (!selectedChat) return;

    try {
      setSendingMessage(true);
      
      const response = await authApi.post(`/avito-messenger/chats/${selectedChat.id}/messages`, {
        avitoAccountName: selectedChat.avitoAccountName,
        message: data.message,
        type: 'text'
      });

      if (response.data.success) {
        // Add sent message to messages list
        const sentMessage: AvitoMessage = response.data.data;
        setMessages(prev => [...prev, sentMessage]);
        resetMessage();
        notifications.success('Сообщение отправлено');
        
        // Trigger auto-scroll
        setShouldScroll(true);
        
        // Refresh chat list to update last message
        loadChats();
      } else {
        throw new Error(response.data.message || 'Ошибка при отправке сообщения');
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      notifications.error('Ошибка при отправке сообщения');
    } finally {
      setSendingMessage(false);
    }
  };

  // Utility functions
  const formatTimestamp = (timestamp: number | undefined) => {
    if (!timestamp) {
      return '';
    }
    try {
      // Проверяем, является ли timestamp уже в миллисекундах (больше 1e12)
      // или в секундах (меньше 1e12)
      const date = timestamp > 1e12 
        ? new Date(timestamp) 
        : new Date(timestamp * 1000);
      
      // Проверяем, что дата валидна
      if (isNaN(date.getTime())) {
        console.warn('Invalid timestamp:', timestamp);
        return '';
      }
      
      return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('Error formatting timestamp:', timestamp, e);
      return '';
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'text': return <MessageCircle className="h-4 w-4" />;
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'voice': return <Mic className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      case 'link': return <LinkIcon className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Filter chats based on search
  const filteredChats = chats.filter(chat => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      chat.users.some(user => user.name.toLowerCase().includes(searchLower)) ||
      chat.itemInfo?.title.toLowerCase().includes(searchLower) ||
      chat.city.toLowerCase().includes(searchLower) ||
      chat.avitoAccountName.toLowerCase().includes(searchLower)
    );
  });

  // Effects
  useEffect(() => {
    loadAvitoAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      setChats([]); // Очищаем чаты перед новой загрузкой
      loadChats();
      startChatsAutoRefresh();
    } else {
      stopChatsAutoRefresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount, filterUnread]);

  // Cleanup auto-refresh on component unmount or chat change
  useEffect(() => {
    return () => {
      stopAutoRefresh();
    };
  }, [selectedChat]);

  // Stop auto-refresh when component unmounts
  useEffect(() => {
    return () => {
      stopAutoRefresh();
      stopChatsAutoRefresh();
    };
  }, []);

  // Setup Socket.IO listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Handle new message from webhook
    socket.on('avito-new-message', (data: { chatId: string; message: any }) => {
      console.log('🔔 New message from webhook:', data);
      
      // If it's the currently open chat, add message to the list
      if (selectedChat && selectedChat.id === data.chatId) {
        setMessages(prev => [...prev, {
          id: data.message.id,
          authorId: data.message.authorId,
          content: data.message.content,
          text: data.message.content?.text || '',
          created: data.message.created,
          createdFormatted: formatTimestamp(data.message.created),
          direction: data.message.direction,
          type: data.message.type,
          isRead: false
        }]);
        
        // Auto-scroll to new message
        setShouldScroll(true);
      }
      
      // Mark chat as having new message
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === data.chatId 
            ? { ...chat, hasNewMessage: true }
            : chat
        )
      );
      
      // Show notification
      notifications.info('Новое сообщение в чате Авито');
    });

    // Handle chat update from webhook
    socket.on('avito-chat-updated', (data: { chatId: string }) => {
      console.log('🔔 Chat updated from webhook:', data);
      
      // Reload chats list
      if (selectedAccount) {
        loadChats(true);
      }
    });

    // Cleanup
    return () => {
      socket.off('avito-new-message');
      socket.off('avito-chat-updated');
    };
  }, [socket, selectedChat, selectedAccount]);

  return (
    <DashboardLayout>
      <div className="fixed inset-0 top-16 flex flex-col overflow-hidden bg-gray-50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-white to-blue-50 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-2 shadow-lg">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Центр сообщений Авито
                </h1>
              </div>
            </div>
            
            {avitoAccounts.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 shadow-sm border">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">
                    {avitoAccounts.length} {
                      avitoAccounts.length === 1 ? 'аккаунт' :
                      avitoAccounts.length >= 2 && avitoAccounts.length <= 4 ? 'аккаунта' :
                      'аккаунтов'
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 shadow-sm border">
                  <MessageCircle className="w-3 h-3 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {chats.length} чат{chats.length > 1 ? 'ов' : ''}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadChats}
              disabled={chatsLoading || !selectedAccount}
            >
              <RefreshCw className={cn("h-4 w-4", chatsLoading && "animate-spin")} />
              Обновить
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left Sidebar - Chat List */}
          <div className="w-[480px] border-r bg-gradient-to-b from-white to-gray-50 flex flex-col shadow-sm overflow-hidden min-h-0">
            {/* Account Selector & Filters */}
            <div className="p-4 space-y-4 border-b bg-white flex-shrink-0">
              {/* Account Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Аккаунт Авито
                </label>
                <Select
                  value={selectedAccount}
                  onValueChange={setSelectedAccount}
                  disabled={accountsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      accountsLoading 
                        ? "Загрузка аккаунтов..." 
                        : avitoAccounts.length === 0 
                          ? "Нет доступных аккаунтов" 
                          : "Выберите аккаунт"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {avitoAccounts.length === 0 && !accountsLoading ? (
                      <SelectItem value="no-accounts" disabled>
                        <div className="flex items-center gap-2 text-gray-500">
                          <AlertTriangle className="h-3 w-3" />
                          Нет аккаунтов Авито
                        </div>
                      </SelectItem>
                    ) : (
                      <>
                        {avitoAccounts.length > 1 && (
                          <SelectItem value="__ALL__">
                            <div className="flex items-center gap-2">
                              <Users className="h-3 w-3 text-blue-500" />
                              <span className="font-medium text-blue-600">Все аккаунты</span>
                            </div>
                          </SelectItem>
                        )}
                        {avitoAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.name}>
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                account.connectionStatus === 'connected' ? "bg-green-500" :
                                account.connectionStatus === 'disconnected' ? "bg-red-500" :
                                "bg-gray-400"
                              )} />
                              {account.name}
                            </div>
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                
                {/* Retry button if no accounts */}
                {avitoAccounts.length === 0 && !accountsLoading && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadAvitoAccounts}
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Обновить список аккаунтов
                  </Button>
                )}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Поиск по имени, объявлению, городу..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <Button
                  variant={filterUnread ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterUnread(!filterUnread)}
                  className="text-xs"
                >
                  <Filter className="h-3 w-3 mr-1" />
                  Только непрочитанные
                </Button>
              </div>
            </div>

            {/* Chat List */}
            <ScrollArea className="flex-1 min-h-0">
              {chatsLoading ? (
                <div className="p-4 space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-start gap-3 p-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                          <div className="h-3 bg-gray-200 rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 mb-4">
                    <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <MessageSquare className="h-8 w-8 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {selectedAccount ? 'Нет чатов' : 'Выберите аккаунт'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {!selectedAccount 
                        ? 'Выберите аккаунт Авито для просмотра чатов'
                        : selectedAccount === '__ALL__'
                          ? (searchTerm ? 'Попробуйте изменить поисковый запрос' : 'Чаты со всех аккаунтов появятся здесь автоматически')
                          : (searchTerm ? 'Попробуйте изменить поисковый запрос' : 'Новые чаты появятся здесь автоматически')
                      }
                    </p>
                  </div>
                  {selectedAccount && !searchTerm && (
                    <div className="space-y-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={loadChats}
                        disabled={chatsLoading}
                        className="w-full"
                      >
                        <RefreshCw className={cn("h-4 w-4 mr-2", chatsLoading && "animate-spin")} />
                        Обновить чаты
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {filteredChats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={async () => {
                        setSelectedChat(chat);
                        markChatAsRead(chat.id);
                        await loadMessages(chat);
                        startAutoRefresh(chat);
                        
                        // Mark messages as read on Avito
                        markMessagesAsReadOnAvito(chat);
                      }}
                      className={cn(
                        "group flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200",
                        "bg-white/50 hover:bg-white hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-0.5",
                        "border border-gray-100 hover:border-blue-200",
                        selectedChat?.id === chat.id && "bg-white shadow-lg shadow-blue-500/10 border-blue-200 -translate-y-0.5",
                        chat.hasNewMessage && "bg-blue-50/70 border-blue-300 shadow-md"
                      )}
                    >
                      {/* Avatar */}
                      <div className="relative">
                        <Avatar className="w-12 h-12 ring-2 ring-white shadow-md">
                          <AvatarImage src={chat.users[0]?.avatar} />
                          <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                            {getUserInitials(chat.users[0]?.name || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        {/* New message indicator */}
                        {chat.hasNewMessage && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-sm truncate">
                            {chat.users[0]?.name || 'Неизвестный пользователь'}
                          </h3>
                          <span className="text-xs text-gray-500 ml-2 font-medium whitespace-nowrap">
                            {(() => {
                              const timeText = formatTimestamp(chat.updated);
                              if (!timeText) {
                                console.warn('⚠️ Empty time for chat:', chat.id, 'updated:', chat.updated);
                              }
                              return timeText;
                            })()}
                          </span>
                        </div>

                        {/* Item Info */}
                        {chat.context?.value?.title && (
                          <div className="mb-2">
                            <div className="text-xs text-blue-600 font-medium mb-1 flex items-center gap-1">
                              <span>Мастер</span>
                              {selectedAccount === '__ALL__' && chat.avitoAccountName && (
                                <>
                                  <span>-</span>
                                  <Badge variant="outline" className="text-xs py-0 px-1.5 bg-blue-50">
                                    {chat.avitoAccountName}
                                  </Badge>
                                </>
                              )}
                            </div>
                            <div className="text-xs text-gray-600 truncate max-w-full mb-1">
                              {chat.context.value.title}
                            </div>
                            {chat.city && chat.city !== 'Не указан' && (
                              <div className="text-xs text-purple-600 flex items-center gap-1">
                                <span>📍</span>
                                <span>{chat.city}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Last Message */}
                        {chat.lastMessage && (
                          <div className="flex items-center gap-2">
                            {getMessageIcon(chat.lastMessage.type)}
                            <span className={cn(
                              "text-sm truncate flex-1",
                              chat.hasNewMessage 
                                ? "text-blue-700 font-medium" 
                                : "text-gray-600"
                            )}>
                              {chat.lastMessage.direction === 'out' && (
                                <span className="text-blue-600 mr-1">Вы:</span>
                              )}
                              {chat.lastMessage.text}
                            </span>
                            {chat.hasNewMessage && (
                              <Badge className="text-xs bg-red-500 text-white px-1.5 py-0.5 min-w-fit">
                                NEW
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right Content - Welcome or Chat */}
          <div className="flex-1 flex bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-hidden min-h-0">
            {!selectedChat ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center p-12 max-w-md">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-8 mb-6 shadow-2xl">
                  <div className="bg-white/20 backdrop-blur rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">
                    Центр сообщений
                  </h2>
                  <p className="text-blue-100 text-sm leading-relaxed">
                    Управляйте всеми чатами Авито в одном месте
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Выберите чат для начала
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Выберите чат из списка слева, чтобы начать общение с клиентами. 
                    Все сообщения синхронизируются в реальном времени.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-white rounded-xl p-4 shadow-sm border">
                      <div className="bg-green-100 rounded-lg w-10 h-10 flex items-center justify-center mb-3">
                        <Users className="h-5 w-5 text-green-600" />
                      </div>
                      <h4 className="font-medium text-gray-800 mb-1">Клиенты</h4>
                      <p className="text-xs text-gray-600">Общайтесь с покупателями</p>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 shadow-sm border">
                      <div className="bg-blue-100 rounded-lg w-10 h-10 flex items-center justify-center mb-3">
                        <MessageCircle className="h-5 w-5 text-blue-600" />
                      </div>
                      <h4 className="font-medium text-gray-800 mb-1">Сообщения</h4>
                      <p className="text-xs text-gray-600">Быстрые ответы</p>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col bg-white overflow-hidden min-h-0">
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b bg-white shadow-sm flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 ring-2 ring-blue-100">
                      <AvatarImage src={selectedChat.users[0]?.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold">
                        {getUserInitials(selectedChat.users[0]?.name || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        {selectedChat.users[0]?.name || 'Неизвестный пользователь'}
                      </h2>
                      <div className="flex flex-col gap-2 mt-1">
                        {/* Account and Location Badges */}
                        <div className="flex items-center gap-2">
                          <Badge className="text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-sm hover:shadow-md transition-all px-2 py-1">
                            <span className="mr-1">👤</span>
                            {selectedChat.avitoAccountName}
                          </Badge>
                          
                          {selectedChat.city && selectedChat.city !== 'Не указан' && (
                            <Badge className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-sm hover:shadow-md transition-all px-2 py-1">
                              <span className="mr-1">📍</span>
                              {selectedChat.city}
                            </Badge>
                          )}
                          
                          <Badge className="text-xs bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 shadow-sm hover:shadow-md transition-all px-2 py-1">
                            <span className="mr-1">💬</span>
                            ID: {selectedChat.id}
                          </Badge>
                        </div>
                        
                        {/* Item Title */}
                        {selectedChat.context?.value?.title && (
                          <div className="bg-gray-50 rounded-lg px-3 py-2 border-l-4 border-blue-400">
                            <p className="text-sm text-gray-700 font-medium leading-relaxed">
                              {selectedChat.context.value.title}
                            </p>
                            {selectedChat.context.value.url && (
                              <a 
                                href={selectedChat.context.value.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block"
                              >
                                Посмотреть объявление →
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => {
                        setSelectedChatForOrder(selectedChat);
                        setShowCreateOrderModal(true);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <span className="mr-1">📋</span>
                      Создать заказ
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedChatForOrder(selectedChat);
                        setShowLinkedOrdersModal(true);
                        if (selectedChat) {
                          loadLinkedOrders(selectedChat.id);
                        }
                      }}
                      className="border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      <span className="mr-1">🔗</span>
                      Привязанные заказы
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                    <ScrollArea className="flex-1 p-6 bg-gradient-to-b from-slate-50 to-gray-100 min-h-0">
                      {messagesLoading && messages.length === 0 ? (
                        <div className="space-y-4">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="animate-pulse">
                              <div className={cn(
                                "flex gap-2",
                                i % 2 === 0 ? "justify-start" : "justify-end"
                              )}>
                                <div className="w-2/3 space-y-2">
                                  <div className="h-4 bg-gray-200 rounded" />
                                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : messages.length > 0 ? (
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={cn(
                                "flex items-start gap-2 w-full",
                                message.direction === 'out' ? "flex-row-reverse" : "flex-row"
                              )}
                            >
                              {/* Avatar - только для входящих */}
                              {message.direction === 'in' && (
                                <Avatar className="w-8 h-8 flex-shrink-0">
                                  <AvatarImage src={selectedChat?.users[0]?.avatar} />
                                  <AvatarFallback className="text-xs bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                                    {getUserInitials(selectedChat?.users[0]?.name || 'U')}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              
                              {/* Message bubble */}
                              <div className={cn(
                                "flex flex-col max-w-[70%]",
                                message.direction === 'out' ? "items-end ml-12" : "items-start mr-12"
                              )}>
                                <div
                                  className={cn(
                                    "px-4 py-3 rounded-2xl shadow-sm relative",
                                    message.direction === 'out'
                                      ? "bg-blue-500 text-white rounded-br-md"
                                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
                                  )}
                                >
                                  {message.type === 'image' && message.imageUrl ? (
                                    <div className="space-y-2">
                                      <img 
                                        src={message.imageUrl} 
                                        alt="Изображение"
                                        className="max-w-xs max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => window.open(message.imageUrl, '_blank')}
                                      />
                                      <p className="text-xs opacity-75">{message.text}</p>
                                      <span className={cn(
                                        "text-xs mt-1 block text-right",
                                        message.direction === 'out' 
                                          ? "text-white/60" 
                                          : "text-gray-400"
                                      )}>
                                        {formatTimestamp(message.created)}
                                      </span>
                                    </div>
                                  ) : message.type === 'voice' ? (
                                    <div className="space-y-3 min-w-[280px]">
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className={cn(
                                          "rounded-full p-2",
                                          message.direction === 'out' 
                                            ? "bg-blue-600" 
                                            : "bg-gray-200"
                                        )}>
                                          <Mic className={cn(
                                            "h-4 w-4",
                                            message.direction === 'out' ? "text-white" : "text-gray-600"
                                          )} />
                                        </div>
                                        <span className="text-sm font-medium">Голосовое сообщение</span>
                                      </div>
                                      {message.voiceUrl ? (
                                        <audio 
                                          controls 
                                          className="w-full"
                                          preload="metadata"
                                          style={{ minWidth: '280px' }}
                                        >
                                          <source src={message.voiceUrl} type="audio/mp4" />
                                          Ваш браузер не поддерживает аудио элемент.
                                        </audio>
                                      ) : (
                                        <div className="flex items-center gap-2 py-2">
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                          <p className="text-xs opacity-75">Загрузка аудио...</p>
                                        </div>
                                      )}
                                      <span className={cn(
                                        "text-xs block text-right",
                                        message.direction === 'out' 
                                          ? "text-white/60" 
                                          : "text-gray-400"
                                      )}>
                                        {formatTimestamp(message.created)}
                                      </span>
                                    </div>
                                  ) : (
                                    <div>
                                      <p className="text-sm leading-relaxed break-words pr-16">
                                        {message.content?.text || message.text || '[Сообщение без текста]'}
                                      </p>
                                      <span className={cn(
                                        "text-xs mt-1 block text-right",
                                        message.direction === 'out' 
                                          ? "text-white/60" 
                                          : "text-gray-400"
                                      )}>
                                        {formatTimestamp(message.created)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>Нет сообщений в этом чате</p>
                        </div>
                      )}
                    </ScrollArea>

                  {/* Message Input */}
                  <div className="p-4 bg-white border-t border-gray-200 flex-shrink-0">
                    <form onSubmit={handleSubmitMessage(onSendMessage)} className="flex gap-3 items-end">
                      <div className="flex-1">
                        <Textarea
                          {...registerMessage('message')}
                          placeholder="Напишите сообщение..."
                          className="min-h-[48px] max-h-32 resize-none border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 bg-white rounded-xl shadow-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSubmitMessage(onSendMessage)();
                            }
                          }}
                        />
                        {messageErrors.message && (
                          <p className="text-sm text-red-500 mt-1">
                            {messageErrors.message.message}
                          </p>
                        )}
                      </div>
                      <Button 
                        type="submit" 
                        disabled={sendingMessage}
                        className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white w-12 h-12 rounded-xl shadow-sm transition-all flex items-center justify-center flex-shrink-0"
                      >
                        {sendingMessage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Order Modal */}
      <CreateOrderFromChatModal
        chat={selectedChatForOrder}
        open={showCreateOrderModal}
        onOpenChange={setShowCreateOrderModal}
        onOrderCreated={(order) => {
          notifications.success('Заказ успешно создан!');
          setShowCreateOrderModal(false);
        }}
      />

      {/* Linked Orders Modal */}
      <Dialog open={showLinkedOrdersModal} onOpenChange={setShowLinkedOrdersModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">🔗</span>
              Привязанные заказы
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              Заказы, созданные из этого чата Авито
              {selectedChatForOrder && (
                <Badge variant="outline" className="text-xs font-mono">
                  ID: {selectedChatForOrder.id}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            {linkedOrdersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Загрузка заказов...</span>
              </div>
            ) : linkedOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mb-4 text-gray-300" />
                <p className="text-lg font-medium">Нет привязанных заказов</p>
                <p className="text-sm">Для этого чата еще не создано ни одного заказа</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {linkedOrders.map((order) => (
                    <Card key={order.id} className="border border-gray-200 hover:border-blue-300 transition-colors">
                      <CardContent className="p-4">
                        {/* Header with ID and Status */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              #{order.id}
                            </Badge>
                            <Badge 
                              className={`text-xs font-medium ${
                                order.statusOrder === 'Ожидает' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                order.statusOrder === 'Принял' ? 'bg-sky-100 text-sky-800 border-sky-200' :
                                order.statusOrder === 'В пути' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                order.statusOrder === 'В работе' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                order.statusOrder === 'Готово' ? 'bg-green-100 text-green-800 border-green-200' :
                                order.statusOrder === 'Отказ' ? 'bg-red-100 text-red-800 border-red-200' :
                                order.statusOrder === 'Модерн' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                order.statusOrder === 'Незаказ' ? 'bg-gray-900 text-white border-gray-900' :
                                'bg-gray-100 text-gray-800 border-gray-200'
                              }`}
                            >
                              {order.statusOrder}
                            </Badge>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Close modal and navigate to orders page
                              setShowLinkedOrdersModal(false);
                              router.push(`/orders?orderId=${order.id}`);
                            }}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50 h-7 px-2 text-xs"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Открыть
                          </Button>
                        </div>

                        {/* Client Information */}
                        <div className="mb-3">
                          <h3 className="font-semibold text-base text-gray-900 mb-1">{order.clientName}</h3>
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {order.phone}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {order.city}
                            </span>
                          </div>
                        </div>

                        {/* Order Details Grid */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="bg-gray-50 rounded p-2">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Тип</p>
                            <p className="font-semibold text-gray-900 text-sm">
                              {order.typeEquipment === 'kp' ? 'КП' :
                               order.typeEquipment === 'bt' ? 'БТ' :
                               'МНЧ'}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded p-2">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Дата</p>
                            <p className="font-semibold text-gray-900 text-sm">
                              {new Date(order.dateMeeting).toLocaleDateString('ru-RU', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZone: 'UTC'
                              })}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded p-2">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Оператор</p>
                            <p className="font-semibold text-gray-900 text-sm">{order.operator.name}</p>
                          </div>
                        </div>

                        {/* Problem Description */}
                        <div className="bg-blue-50 rounded p-2 border-l-2 border-blue-400">
                          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Проблема</p>
                          <p className="text-xs text-gray-700">{order.problem}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}