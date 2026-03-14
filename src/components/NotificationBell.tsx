import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Heart, MessageCircle, UserPlus, Share2, Calendar, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  title: string;
  body: string | null;
  reference_id: string | null;
  reference_type: string | null;
  read: boolean;
  created_at: string;
  actor_profile?: {
    display_name: string;
    username: string;
    avatar_url: string | null;
  };
}

interface NotificationBellProps {
  userId: string;
}

const typeIcons: Record<string, typeof Heart> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  friend_request: UserPlus,
  friend_accepted: Check,
  share: Share2,
  event: Calendar,
};

const typeColors: Record<string, string> = {
  like: "text-secondary",
  comment: "text-primary",
  follow: "text-accent",
  friend_request: "text-massa",
  friend_accepted: "text-cabra-bom",
  share: "text-primary",
  event: "text-secondary",
};

const NotificationBell = ({ userId }: NotificationBellProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadNotifications();

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadNotifications = async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error loading notifications:", error);
      return;
    }

    const notifs = data || [];

    // Load actor profiles
    const actorIds = [...new Set(notifs.filter(n => n.actor_id).map(n => n.actor_id!))];
    let profiles: Record<string, { display_name: string; username: string; avatar_url: string | null }> = {};

    if (actorIds.length > 0) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .in("id", actorIds);

      if (profileData) {
        profiles = Object.fromEntries(profileData.map(p => [p.id, p]));
      }
    }

    const enriched: Notification[] = notifs.map(n => ({
      ...n,
      actor_profile: n.actor_id ? profiles[n.actor_id] : undefined,
    }));

    setNotifications(enriched);
    setUnreadCount(enriched.filter(n => !n.read).length);
  };

  const markAllRead = async () => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const markOneRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover-lift">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-secondary text-secondary-foreground animate-pulse-heart">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-bold text-lg">Notificações</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs">
              Marcar todas como lidas
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhuma notificação ainda, visse?
              </p>
            </div>
          ) : (
            <div>
              {notifications.map((notif) => {
                const Icon = typeIcons[notif.type] || Bell;
                const color = typeColors[notif.type] || "text-muted-foreground";

                return (
                  <button
                    key={notif.id}
                    className={`w-full p-3 flex items-start gap-3 text-left transition-colors hover:bg-muted/50 ${
                      !notif.read ? "bg-primary/5" : ""
                    }`}
                    onClick={() => markOneRead(notif.id)}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        {notif.actor_profile?.avatar_url ? (
                          <AvatarImage src={notif.actor_profile.avatar_url} />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-sm">
                            {notif.actor_profile?.display_name?.charAt(0) || "?"}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 bg-card rounded-full p-0.5 ${color}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-semibold">
                          {notif.actor_profile?.display_name || "Alguém"}
                        </span>{" "}
                        {notif.title}
                      </p>
                      {notif.body && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {notif.body}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notif.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
