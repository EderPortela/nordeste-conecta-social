import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Info,
  Heart,
  Image,
  Smile,
  ChevronLeft,
  Circle,
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
  const [likedMessages, setLikedMessages] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      setUser(user);
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (profileData) setProfile(profileData);
      await loadConversations(user.id);
      setLoading(false);
    };
    init();
  }, [navigate]);

  useEffect(() => {
    if (!selectedConv) return;
    const channel = supabase
      .channel(`messages-${selectedConv.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `conversation_id=eq.${selectedConv.id}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages(prev => [...prev, newMsg]);
        scrollToBottom();
        if (newMsg.sender_id !== user?.id) {
          supabase.from("messages").update({ read: true }).eq("id", newMsg.id).then();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedConv, user]);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const loadConversations = async (userId: string) => {
    try {
      const { data: participations } = await supabase
        .from("conversation_participants").select("conversation_id").eq("user_id", userId);
      if (!participations?.length) { setConversations([]); return; }

      const convs: ConversationData[] = [];
      for (const { conversation_id: convId } of participations) {
        const { data: otherP } = await supabase
          .from("conversation_participants").select("user_id")
          .eq("conversation_id", convId).neq("user_id", userId).single();
        if (!otherP) continue;
        const { data: otherProfile } = await supabase
          .from("profiles").select("*").eq("id", otherP.user_id).single();
        if (!otherProfile) continue;
        const { data: lastMsg } = await supabase
          .from("messages").select("*").eq("conversation_id", convId)
          .order("created_at", { ascending: false }).limit(1).single();
        const { count } = await supabase
          .from("messages").select("*", { count: "exact", head: true })
          .eq("conversation_id", convId).eq("read", false).neq("sender_id", userId);
        convs.push({
          id: convId, otherUser: otherProfile,
          lastMessage: lastMsg?.content || "Início da conversa",
          lastMessageAt: lastMsg?.created_at || new Date().toISOString(),
          unreadCount: count || 0,
        });
      }
      convs.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      setConversations(convs);
    } catch (error) { console.error(error); }
  };

  const loadMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from("messages").select("*").eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    setMessages(data || []);
    scrollToBottom();
    if (user) {
      await supabase.from("messages").update({ read: true })
        .eq("conversation_id", conversationId).neq("sender_id", user.id).eq("read", false);
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
      await supabase.from("messages").insert({ conversation_id: selectedConv.id, sender_id: user.id, content });
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", selectedConv.id);
      await supabase.from("notifications").insert({
        user_id: selectedConv.otherUser.id, actor_id: user.id, type: "message",
        title: "enviou uma mensagem", body: content.substring(0, 100),
        reference_id: selectedConv.id, reference_type: "conversation",
      });
    } catch (error: any) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
    }
  };

  const searchForUsers = async (query: string) => {
    setUserSearch(query);
    if (query.length < 2) { setSearchUsers([]); return; }
    const { data } = await supabase.from("profiles").select("*").neq("id", user?.id || "")
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`).limit(10);
    setSearchUsers(data || []);
  };

  const startConversation = async (otherUser: Profile) => {
    if (!user) return;
    const existing = conversations.find(c => c.otherUser.id === otherUser.id);
    if (existing) { selectConversation(existing); setShowNewConv(false); return; }
    try {
      const { data: conv, error } = await supabase.from("conversations").insert({}).select().single();
      if (error) throw error;
      await supabase.from("conversation_participants").insert([
        { conversation_id: conv.id, user_id: user.id },
        { conversation_id: conv.id, user_id: otherUser.id },
      ]);
      const newConv: ConversationData = {
        id: conv.id, otherUser, lastMessage: "Início da conversa",
        lastMessageAt: new Date().toISOString(), unreadCount: 0,
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

  const toggleLikeMessage = (msgId: string) => {
    setLikedMessages(prev => {
      const next = new Set(prev);
      next.has(msgId) ? next.delete(msgId) : next.add(msgId);
      return next;
    });
  };

  // Group messages by date
  const groupedMessages = messages.reduce<{ date: string; msgs: Message[] }[]>((groups, msg) => {
    const date = new Date(msg.created_at).toLocaleDateString("pt-BR");
    const last = groups[groups.length - 1];
    if (last?.date === date) {
      last.msgs.push(msg);
    } else {
      groups.push({ date, msgs: [msg] });
    }
    return groups;
  }, []);

  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Mobile: show either list or chat
  const showChatMobile = selectedConv !== null;

  return (
    <div className="min-h-screen bg-background pb-16 lg:pb-0">
      <div className="h-[100dvh] flex">
        {/* Conversation List - hidden on mobile when chat is open */}
        <div className={`${showChatMobile ? "hidden lg:flex" : "flex"} w-full lg:w-96 flex-col border-r border-border bg-card`}>
          {/* Header */}
          <div className="px-5 py-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button onClick={() => navigate("/feed")}>
                  <ChevronLeft className="h-6 w-6 text-foreground lg:hidden" />
                </button>
                <h1 className="text-xl font-bold">{profile.username}</h1>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setShowNewConv(true)} className="rounded-full">
                <Plus className="h-6 w-6" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar"
                className="pl-10 rounded-xl bg-muted border-0 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Conversations */}
          <ScrollArea className="flex-1">
            <div className="py-2">
              {filteredConvs.length === 0 ? (
                <div className="p-10 text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">Nenhuma conversa</p>
                  <Button variant="link" className="text-primary" onClick={() => setShowNewConv(true)}>
                    Enviar mensagem
                  </Button>
                </div>
              ) : (
                filteredConvs.map((conv) => (
                  <button
                    key={conv.id}
                    className={`w-full px-5 py-3 flex items-center gap-3 transition-colors text-left ${
                      selectedConv?.id === conv.id ? "bg-muted/50" : "hover:bg-muted/30"
                    }`}
                    onClick={() => selectConversation(conv)}
                  >
                    <div className="relative">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={conv.otherUser.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-lg">
                          {conv.otherUser.display_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {/* Online indicator */}
                      <Circle className="absolute bottom-0 right-0 h-4 w-4 text-accent fill-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${conv.unreadCount > 0 ? "font-bold" : "font-medium"}`}>
                        {conv.otherUser.display_name}
                      </p>
                      <p className={`text-sm truncate ${conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {conv.lastMessage} · {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false, locale: ptBR })}
                      </p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className={`${showChatMobile ? "flex" : "hidden lg:flex"} flex-1 flex-col bg-background`}>
          {selectedConv ? (
            <>
              {/* Chat Header - Instagram style */}
              <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-card">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedConv(null)} className="lg:hidden">
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedConv.otherUser.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-xs">
                      {selectedConv.otherUser.display_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm leading-tight">{selectedConv.otherUser.display_name}</p>
                    <p className="text-xs text-muted-foreground">Ativo(a) agora</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="rounded-full h-9 w-9">
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="rounded-full h-9 w-9">
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="rounded-full h-9 w-9">
                    <Info className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 px-4">
                <div className="py-4 space-y-1 max-w-2xl mx-auto">
                  {/* Profile intro */}
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center py-8">
                      <Avatar className="h-20 w-20 mb-3">
                        <AvatarImage src={selectedConv.otherUser.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-2xl">
                          {selectedConv.otherUser.display_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-bold text-lg">{selectedConv.otherUser.display_name}</p>
                      <p className="text-sm text-muted-foreground">@{selectedConv.otherUser.username} · Portella</p>
                      <Button variant="outline" size="sm" className="mt-3 rounded-xl"
                        onClick={() => navigate(`/perfil/${selectedConv.otherUser.username}`)}>
                        Ver perfil
                      </Button>
                    </div>
                  )}

                  {groupedMessages.map((group) => (
                    <div key={group.date}>
                      <div className="flex items-center justify-center my-4">
                        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                          {group.date}
                        </span>
                      </div>
                      {group.msgs.map((msg) => {
                        const isMine = msg.sender_id === user.id;
                        return (
                          <div key={msg.id} className={`flex mb-1 group ${isMine ? "justify-end" : "justify-start"}`}>
                            {!isMine && (
                              <Avatar className="h-7 w-7 mr-2 mt-auto mb-1 shrink-0">
                                <AvatarImage src={selectedConv.otherUser.avatar_url || undefined} />
                                <AvatarFallback className="bg-muted text-xs">
                                  {selectedConv.otherUser.display_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className="relative max-w-[65%]">
                              <div className={`px-4 py-2.5 text-sm leading-relaxed ${
                                isMine
                                  ? "bg-primary text-primary-foreground rounded-3xl rounded-br-md"
                                  : "bg-muted rounded-3xl rounded-bl-md"
                              }`}>
                                {msg.content}
                              </div>
                              {/* Like button on hover */}
                              <button
                                onClick={() => toggleLikeMessage(msg.id)}
                                className={`absolute -bottom-2 ${isMine ? "left-0" : "right-0"} opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border rounded-full p-0.5 shadow-sm`}
                              >
                                <Heart className={`h-3 w-3 ${likedMessages.has(msg.id) ? "text-secondary fill-secondary" : "text-muted-foreground"}`} />
                              </button>
                              {likedMessages.has(msg.id) && (
                                <span className={`absolute -bottom-2 ${isMine ? "left-0" : "right-0"} bg-card border border-border rounded-full p-0.5 shadow-sm`}>
                                  <Heart className="h-3 w-3 text-secondary fill-secondary" />
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input - Instagram style */}
              <div className="px-4 py-3 border-t border-border bg-card">
                <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-1.5">
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full shrink-0">
                    <Smile className="h-5 w-5 text-muted-foreground" />
                  </Button>
                  <Input
                    placeholder="Mensagem..."
                    className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 h-8 px-0 text-sm"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  />
                  {messageInput.trim() ? (
                    <Button size="sm" variant="ghost" onClick={handleSend} className="text-primary font-semibold hover:text-primary/80 px-2">
                      Enviar
                    </Button>
                  ) : (
                    <>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full shrink-0">
                        <Image className="h-5 w-5 text-muted-foreground" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full shrink-0">
                        <Heart className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="h-24 w-24 rounded-full border-2 border-foreground mx-auto mb-4 flex items-center justify-center">
                  <Send className="h-10 w-10 text-foreground" />
                </div>
                <h3 className="text-xl font-light mb-1">Suas mensagens</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Envie fotos e mensagens privadas para um amigo ou grupo.
                </p>
                <Button onClick={() => setShowNewConv(true)} className="rounded-xl">
                  Enviar mensagem
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Dialog */}
      <Dialog open={showNewConv} onOpenChange={setShowNewConv}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova mensagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <span className="text-sm font-semibold">Para:</span>
              <Input
                placeholder="Pesquisar..."
                className="border-0 shadow-none focus-visible:ring-0 h-8 px-0"
                value={userSearch}
                onChange={(e) => searchForUsers(e.target.value)}
              />
            </div>
            <ScrollArea className="max-h-64">
              {searchUsers.map((u) => (
                <button
                  key={u.id}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                  onClick={() => startConversation(u)}
                >
                  <Avatar className="h-11 w-11">
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
                <p className="text-center text-sm text-muted-foreground py-4">Nenhum resultado</p>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav activeRoute="/mensagens" onNavigate={(route) => navigate(route)} />
    </div>
  );
};

export default Messages;
