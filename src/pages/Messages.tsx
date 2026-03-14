import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import LeftSidebar from "@/components/LeftSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Send,
  MessageCircle,
  Plus,
  Phone,
  Video,
  MoreVertical,
  Image,
  Smile,
  Paperclip,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  location: string | null;
}

interface ConversationData {
  id: string;
  otherUser: Profile;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  image_url: string | null;
  read: boolean;
  created_at: string;
}

const Messages = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewConv, setShowNewConv] = useState(false);
  const [searchUsers, setSearchUsers] = useState<Profile[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      setUser(user);

      const { data: profileData } = await supabase
        .from("profiles").select("*").eq("id", user.id).single();
      if (profileData) setProfile(profileData);

      await loadConversations(user.id);
      setLoading(false);
    };
    init();
  }, [navigate]);

  // Realtime messages
  useEffect(() => {
    if (!selectedConv) return;

    const channel = supabase
      .channel(`messages-${selectedConv.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConv.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]);
          scrollToBottom();

          // Mark as read
          if (newMsg.sender_id !== user?.id) {
            supabase
              .from("messages")
              .update({ read: true })
              .eq("id", newMsg.id)
              .then();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedConv, user]);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const loadConversations = async (userId: string) => {
    try {
      const { data: participations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", userId);

      if (!participations || participations.length === 0) {
        setConversations([]);
        return;
      }

      const convIds = participations.map(p => p.conversation_id);
      const convs: ConversationData[] = [];

      for (const convId of convIds) {
        const { data: otherParticipant } = await supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", convId)
          .neq("user_id", userId)
          .single();

        if (!otherParticipant) continue;

        const { data: otherProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", otherParticipant.user_id)
          .single();

        if (!otherProfile) continue;

        const { data: lastMsg } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", convId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", convId)
          .eq("read", false)
          .neq("sender_id", userId);

        convs.push({
          id: convId,
          otherUser: otherProfile,
          lastMessage: lastMsg ? lastMsg.content : "Início da conversa",
          lastMessageAt: lastMsg ? lastMsg.created_at : new Date().toISOString(),
          unreadCount: count || 0,
        });
      }

      convs.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      setConversations(convs);
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      return;
    }

    setMessages(data || []);
    scrollToBottom();

    if (user) {
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id)
        .eq("read", false);
    }
  };

  const selectConversation = (conv: ConversationData) => {
    setSelectedConv(conv);
    loadMessages(conv.id);
  };

  const handleSend = async () => {
    if (!messageInput.trim() || !selectedConv || !user) return;

    const content = messageInput.trim();
    setMessageInput("");

    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: selectedConv.id,
        sender_id: user.id,
        content,
      });

      if (error) throw error;

      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", selectedConv.id);

      await supabase.from("notifications").insert({
        user_id: selectedConv.otherUser.id,
        actor_id: user.id,
        type: "message",
        title: "enviou uma mensagem",
        body: content.substring(0, 100),
        reference_id: selectedConv.id,
        reference_type: "conversation",
      });
    } catch (error: any) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
    }
  };

  const searchForUsers = async (query: string) => {
    setUserSearch(query);
    if (query.length < 2) { setSearchUsers([]); return; }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", user?.id || "")
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(10);

    setSearchUsers(data || []);
  };

  const startConversation = async (otherUser: Profile) => {
    if (!user) return;

    const existing = conversations.find(c => c.otherUser.id === otherUser.id);
    if (existing) {
      setSelectedConv(existing);
      loadMessages(existing.id);
      setShowNewConv(false);
      return;
    }

    try {
      const { data: conv, error: convError } = await supabase
        .from("conversations")
        .insert({})
        .select()
        .single();

      if (convError) throw convError;

      const convId = conv.id;

      await supabase.from("conversation_participants").insert([
        { conversation_id: convId, user_id: user.id },
        { conversation_id: convId, user_id: otherUser.id },
      ]);

      const newConv: ConversationData = {
        id: convId,
        otherUser,
        lastMessage: "Início da conversa",
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
      };

      setConversations(prev => [newConv, ...prev]);
      setSelectedConv(newConv);
      setShowNewConv(false);
      setMessages([]);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const filteredConvs = conversations.filter(c =>
    c.otherUser.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.otherUser.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6 max-w-[1600px] mx-auto">
          <LeftSidebar
            profile={{
              username: profile.username,
              display_name: profile.display_name,
              location: profile.location || undefined,
            }}
            activeRoute="/mensagens"
            onNavigate={(route) => navigate(route)}
          />

          <div className="flex-1 min-w-0">
            <Card className="h-[calc(100vh-8rem)] flex overflow-hidden rounded-2xl shadow-card">
              {/* Conversations List */}
              <div className="w-80 border-r border-border flex flex-col">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold">Mensagens</h2>
                    <Button size="icon" variant="ghost" onClick={() => setShowNewConv(true)}>
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar conversas..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <div className="px-2 py-2">
                    {filteredConvs.length === 0 ? (
                      <div className="p-8 text-center">
                        <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                          Nenhuma conversa ainda
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={() => setShowNewConv(true)}
                        >
                          Iniciar conversa
                        </Button>
                      </div>
                    ) : (
                      filteredConvs.map((conv) => (
                        <button
                          key={conv.id}
                          className={`w-full p-3 rounded-xl flex items-start gap-3 transition-colors text-left ${
                            selectedConv?.id === conv.id
                              ? "bg-primary/10"
                              : "hover:bg-muted/50"
                          }`}
                          onClick={() => selectConversation(conv)}
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={conv.otherUser.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                              {conv.otherUser.display_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-sm truncate">
                                {conv.otherUser.display_name}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(conv.lastMessageAt), {
                                  addSuffix: false,
                                  locale: ptBR,
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.lastMessage}
                            </p>
                          </div>
                          {conv.unreadCount > 0 && (
                            <Badge className="bg-primary text-primary-foreground shrink-0">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Chat Area */}
              {selectedConv ? (
                <div className="flex-1 flex flex-col">
                  {/* Chat Header */}
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedConv.otherUser.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                          {selectedConv.otherUser.display_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{selectedConv.otherUser.display_name}</p>
                        <p className="text-xs text-muted-foreground">
                          @{selectedConv.otherUser.username}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost"><Phone className="h-5 w-5" /></Button>
                      <Button size="icon" variant="ghost"><Video className="h-5 w-5" /></Button>
                      <Button size="icon" variant="ghost"><MoreVertical className="h-5 w-5" /></Button>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {messages.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground text-sm">
                            Comece a conversa! Mande um "Eita!" 😄
                          </p>
                        </div>
                      )}
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_id === user.id ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-2xl ${
                              msg.sender_id === user.id
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted rounded-bl-md"
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className={`text-xs mt-1 ${
                              msg.sender_id === user.id
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}>
                              {formatTime(new Date(msg.created_at))}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost"><Paperclip className="h-5 w-5" /></Button>
                      <Button size="icon" variant="ghost"><Image className="h-5 w-5" /></Button>
                      <Input
                        placeholder="Digite sua mensagem..."
                        className="flex-1"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                      />
                      <Button size="icon" variant="ghost"><Smile className="h-5 w-5" /></Button>
                      <Button size="icon" onClick={handleSend} disabled={!messageInput.trim()}>
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Suas mensagens</h3>
                    <p className="text-muted-foreground mb-4">
                      Selecione uma conversa ou inicie uma nova
                    </p>
                    <Button onClick={() => setShowNewConv(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Conversa
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* New Conversation Dialog */}
      <Dialog open={showNewConv} onOpenChange={setShowNewConv}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Conversa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pessoas..."
                className="pl-9"
                value={userSearch}
                onChange={(e) => searchForUsers(e.target.value)}
              />
            </div>
            <ScrollArea className="max-h-64">
              {searchUsers.map((u) => (
                <button
                  key={u.id}
                  className="w-full p-3 rounded-xl flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                  onClick={() => startConversation(u)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={u.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                      {u.display_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{u.display_name}</p>
                    <p className="text-xs text-muted-foreground">@{u.username}</p>
                  </div>
                </button>
              ))}
              {userSearch.length >= 2 && searchUsers.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Nenhum usuário encontrado
                </p>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export default Messages;
