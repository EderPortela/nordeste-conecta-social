import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import LeftSidebar from "@/components/LeftSidebar";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
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
  Paperclip
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  location: string | null;
}

interface Conversation {
  id: string;
  profile: Profile;
  lastMessage: string;
  timestamp: string;
  unread: number;
}

// Mock conversations for UI demonstration
const mockConversations: Conversation[] = [
  {
    id: "1",
    profile: {
      id: "1",
      username: "maria_forrozeira",
      display_name: "Maria Forrozeira",
      avatar_url: null,
      location: "Recife, PE"
    },
    lastMessage: "Oxente! Viu o forró ontem?",
    timestamp: "2 min",
    unread: 3
  },
  {
    id: "2",
    profile: {
      id: "2",
      username: "joao_sertanejo",
      display_name: "João Sertanejo",
      avatar_url: null,
      location: "Caruaru, PE"
    },
    lastMessage: "Arretado demais o seu cordel!",
    timestamp: "1h",
    unread: 0
  },
  {
    id: "3",
    profile: {
      id: "3",
      username: "ana_rendeira",
      display_name: "Ana Rendeira",
      avatar_url: null,
      location: "Juazeiro, BA"
    },
    lastMessage: "Vou mandar as fotos do artesanato",
    timestamp: "3h",
    unread: 1
  }
];

const mockMessages = [
  { id: "1", sender: "other", content: "Eita, cabra bom! Tudo bem?", timestamp: "10:30" },
  { id: "2", sender: "me", content: "Tudo massa! E tu?", timestamp: "10:32" },
  { id: "3", sender: "other", content: "Arretado! Viu o forró ontem na praça?", timestamp: "10:33" },
  { id: "4", sender: "me", content: "Vi sim! Tava muito animado, visse?", timestamp: "10:35" },
  { id: "5", sender: "other", content: "Demais! Semana que vem tem de novo, bora?", timestamp: "10:36" },
  { id: "6", sender: "other", content: "Oxente! Viu o forró ontem?", timestamp: "10:38" },
];

const Messages = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(mockConversations[0]);
  const [messageInput, setMessageInput] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
      
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    
    toast({
      title: "Mensagem enviada!",
      description: "Sistema de mensagens em desenvolvimento.",
    });
    setMessageInput("");
  };

  const filteredConversations = mockConversations.filter(conv =>
    conv.profile.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.profile.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
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

          {/* Main Content - Messages */}
          <div className="flex-1 min-w-0">
            <Card className="h-[calc(100vh-8rem)] flex overflow-hidden">
              {/* Conversations List */}
              <div className="w-80 border-r border-border flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Mensagens</CardTitle>
                    <Button size="icon" variant="ghost">
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
                </CardHeader>
                
                <ScrollArea className="flex-1">
                  <div className="px-2 pb-2">
                    {filteredConversations.map((conv) => (
                      <button
                        key={conv.id}
                        className={`w-full p-3 rounded-xl flex items-start gap-3 transition-colors text-left ${
                          selectedConversation?.id === conv.id 
                            ? "bg-primary/10" 
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => setSelectedConversation(conv)}
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={conv.profile.avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                            {conv.profile.display_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-sm truncate">
                              {conv.profile.display_name}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {conv.timestamp}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.lastMessage}
                          </p>
                        </div>
                        {conv.unread > 0 && (
                          <Badge className="bg-primary text-primary-foreground">
                            {conv.unread}
                          </Badge>
                        )}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Chat Area */}
              {selectedConversation ? (
                <div className="flex-1 flex flex-col">
                  {/* Chat Header */}
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedConversation.profile.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                          {selectedConversation.profile.display_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{selectedConversation.profile.display_name}</p>
                        <p className="text-xs text-muted-foreground">
                          @{selectedConversation.profile.username} • {selectedConversation.profile.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost">
                        <Phone className="h-5 w-5" />
                      </Button>
                      <Button size="icon" variant="ghost">
                        <Video className="h-5 w-5" />
                      </Button>
                      <Button size="icon" variant="ghost">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {mockMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-2xl ${
                              msg.sender === "me"
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted rounded-bl-md"
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className={`text-xs mt-1 ${
                              msg.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}>
                              {msg.timestamp}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost">
                        <Paperclip className="h-5 w-5" />
                      </Button>
                      <Button size="icon" variant="ghost">
                        <Image className="h-5 w-5" />
                      </Button>
                      <Input
                        placeholder="Digite sua mensagem..."
                        className="flex-1"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      />
                      <Button size="icon" variant="ghost">
                        <Smile className="h-5 w-5" />
                      </Button>
                      <Button size="icon" onClick={handleSendMessage}>
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
                    <p className="text-muted-foreground">
                      Selecione uma conversa para começar
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
