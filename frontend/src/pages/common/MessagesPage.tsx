import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { messageService } from '../../services';
import { Send, User, MessageSquare, Clock } from 'lucide-react';

interface Message {
  id: number | string;
  senderId: number | string;
  senderName: string;
  recipientId: number | string;
  recipientName: string;
  content: string;
  sentAt: string;
  readStatus: boolean;
}

interface ConversationSummary {
  partnerId: number | string;
  partnerName: string;
  partnerRole?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialRecipientId = searchParams.get('recipientId') ? searchParams.get('recipientId') : null;

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<number | string | null>(initialRecipientId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fallbackConversations = React.useMemo<ConversationSummary[]>(() => [
    {
      partnerId: 2,
      partnerName: 'Vikram Mehta (Himalayan Trails)',
      partnerRole: 'EXPERT',
      lastMessage: 'I have updated the day 3 itinerary to include the private river camp!',
      lastMessageTime: '10:45 AM',
      unreadCount: 1,
    },
    {
      partnerId: 3,
      partnerName: 'Ananya Sharma (Kerala Bliss)',
      partnerRole: 'EXPERT',
      lastMessage: 'The luxury houseboat booking is confirmed with premium lake-view deck.',
      lastMessageTime: 'Yesterday',
      unreadCount: 0,
    },
  ], []);

  const fallbackMessages = React.useMemo<Record<string | number, Message[]>>(() => ({
    2: [
      { id: 1, senderId: 2, senderName: 'Vikram Mehta', recipientId: user?.userId || 1, recipientName: user?.name || 'You', content: 'Hello! I noticed your request for the Manali trip. Would you prefer river rafting included?', sentAt: '10:30 AM', readStatus: true },
      { id: 2, senderId: user?.userId || 1, senderName: user?.name || 'You', recipientId: 2, recipientName: 'Vikram Mehta', content: 'Yes please! We would love that, along with a camp stay.', sentAt: '10:38 AM', readStatus: true },
      { id: 3, senderId: 2, senderName: 'Vikram Mehta', recipientId: user?.userId || 1, recipientName: user?.name || 'You', content: 'I have updated the day 3 itinerary to include the private river camp!', sentAt: '10:45 AM', readStatus: false },
    ],
    3: [
      { id: 4, senderId: 3, senderName: 'Ananya Sharma', recipientId: user?.userId || 1, recipientName: user?.name || 'You', content: 'Hi there! We have reserved the Alleppey deluxe suite for your dates.', sentAt: 'Yesterday 3:15 PM', readStatus: true },
      { id: 5, senderId: 3, senderName: 'Ananya Sharma', recipientId: user?.userId || 1, recipientName: user?.name || 'You', content: 'The luxury houseboat booking is confirmed with premium lake-view deck.', sentAt: 'Yesterday 4:00 PM', readStatus: true },
    ]
  }), [user?.name, user?.userId]);

  const fetchConversations = React.useCallback(async () => {
    setLoadingConv(true);
    try {
      const res = await messageService.getConversations();
      const list = res.data?.data;
      if (list && list.length > 0) {
        setConversations(list);
        if (!activePartnerId) {
          setActivePartnerId(list[0].partnerId);
        }
      } else {
        setConversations(fallbackConversations);
        if (!activePartnerId) {
          setActivePartnerId(fallbackConversations[0].partnerId);
        }
      }
    } catch {
      setConversations(fallbackConversations);
      if (!activePartnerId) {
        setActivePartnerId(fallbackConversations[0].partnerId);
      }
    }
    setLoadingConv(false);
  }, [activePartnerId, fallbackConversations]);

  const fetchMessages = React.useCallback(async (partnerId: number | string) => {
    try {
      const res = await messageService.getConversation(partnerId);
      const data = res.data?.data;
      if (data && data.length > 0) {
        setMessages(data);
      } else {
        setMessages(fallbackMessages[partnerId] || []);
      }
    } catch {
      setMessages(fallbackMessages[partnerId] || []);
    }
  }, [fallbackMessages]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (activePartnerId) {
      fetchMessages(activePartnerId);
    }
  }, [activePartnerId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activePartnerId) return;

    const outgoingContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    const tempMsg: Message = {
      id: Date.now(),
      senderId: user?.userId || 1,
      senderName: user?.name || 'You',
      recipientId: activePartnerId,
      recipientName: 'Partner',
      content: outgoingContent,
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      readStatus: false,
    };

    setMessages(prev => [...prev, tempMsg]);

    try {
      await messageService.send({
        recipientId: activePartnerId,
        content: outgoingContent,
      });
    } catch {
      // Message kept in local UI state
    }
    setSending(false);
  };

  const activeConv = conversations.find(c => c.partnerId === activePartnerId) || {
    partnerId: activePartnerId || 0,
    partnerName: 'Travel Partner',
  };

  return (
    <div className="card h-[calc(100vh-140px)] flex overflow-hidden shadow-md">
      {/* Sidebar List */}
      <div className="w-full md:w-80 lg:w-96 border-r border-border flex flex-col bg-surface">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-bold text-navy flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-orange" /> Messages
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border/60">
          {loadingConv ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-text-light text-sm">
              No conversations yet.
            </div>
          ) : (
            conversations.map(c => {
              const isActive = c.partnerId === activePartnerId;
              return (
                <button
                  key={c.partnerId}
                  onClick={() => setActivePartnerId(c.partnerId)}
                  className={`w-full text-left p-4 flex items-start gap-3 transition-colors ${
                    isActive ? 'bg-orange/10 border-l-4 border-orange' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-navy to-navy-light text-white font-bold flex items-center justify-center text-sm flex-shrink-0">
                    {c.partnerName?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-navy truncate">{c.partnerName}</h4>
                      <span className="text-[10px] text-text-light">{c.lastMessageTime}</span>
                    </div>
                    <p className="text-xs text-text-light truncate mt-1">{c.lastMessage}</p>
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="w-5 h-5 bg-orange text-white rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {c.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="hidden md:flex flex-1 flex-col bg-bg">
        {activePartnerId ? (
          <>
            {/* Top Chat Header */}
            <div className="px-6 py-4 bg-white border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange to-orange-dark text-white font-bold flex items-center justify-center text-sm">
                  {activeConv.partnerName?.charAt(0) || 'P'}
                </div>
                <div>
                  <h3 className="font-bold text-navy text-sm">{activeConv.partnerName}</h3>
                  <p className="text-xs text-success flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-success" /> Active Now
                  </p>
                </div>
              </div>
            </div>

            {/* Message Bubble Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-16 text-text-light text-sm">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-text-lighter" />
                  No messages yet. Send a note to begin discussing your travel plans!
                </div>
              ) : (
                messages.map(m => {
                  const isMe = m.senderId === user?.userId || m.senderName === user?.name || m.senderName === 'You';
                  return (
                    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                          isMe
                            ? 'bg-orange text-white rounded-br-none'
                            : 'bg-white text-text border border-border rounded-bl-none'
                        }`}
                      >
                        {!isMe && (
                          <p className="text-[10px] font-bold text-navy/70 mb-1">{m.senderName}</p>
                        )}
                        <p className="text-sm leading-relaxed">{m.content}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/80' : 'text-text-light'}`}>
                          {m.sentAt}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-white border-t border-border">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  className="input flex-1"
                  placeholder="Type your message here..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="btn-primary px-5"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-text-light">
            <User className="w-12 h-12 text-text-lighter mb-2" />
            <p className="text-sm">Select a conversation from the list to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
