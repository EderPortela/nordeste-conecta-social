import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Clock, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FriendshipButtonProps {
  currentUserId: string;
  targetUserId: string;
  targetUsername: string;
  size?: "default" | "sm" | "icon";
}

type FriendshipStatus = "none" | "pending_sent" | "pending_received" | "accepted";

const FriendshipButton = ({
  currentUserId,
  targetUserId,
  targetUsername,
  size = "default",
}: FriendshipButtonProps) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<FriendshipStatus>("none");
  const [loading, setLoading] = useState(false);
  const [friendshipId, setFriendshipId] = useState<string | null>(null);

  useEffect(() => {
    checkFriendship();
  }, [currentUserId, targetUserId]);

  const checkFriendship = async () => {
    const { data } = await supabase
      .from("friendships" as any)
      .select("*")
      .or(
        `and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId})`
      );

    if (data && (data as any[]).length > 0) {
      const friendship = (data as any[])[0];
      setFriendshipId(friendship.id);

      if (friendship.status === "accepted") {
        setStatus("accepted");
      } else if (friendship.status === "pending") {
        setStatus(
          friendship.requester_id === currentUserId
            ? "pending_sent"
            : "pending_received"
        );
      }
    } else {
      setStatus("none");
      setFriendshipId(null);
    }
  };

  const sendRequest = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from("friendships" as any).insert({
        requester_id: currentUserId,
        addressee_id: targetUserId,
      } as any);

      if (error) throw error;

      // Notify
      await supabase.from("notifications" as any).insert({
        user_id: targetUserId,
        actor_id: currentUserId,
        type: "friend_request",
        title: "enviou uma solicitação de amizade",
      } as any);

      setStatus("pending_sent");
      toast({
        title: "Solicitação enviada! 🤝",
        description: `Aguardando @${targetUsername} aceitar`,
      });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async () => {
    if (!friendshipId) return;
    setLoading(true);
    try {
      await supabase
        .from("friendships" as any)
        .update({ status: "accepted" } as any)
        .eq("id", friendshipId);

      const { data: friendship } = await supabase
        .from("friendships" as any)
        .select("requester_id")
        .eq("id", friendshipId)
        .single();

      if (friendship) {
        await supabase.from("notifications" as any).insert({
          user_id: (friendship as any).requester_id,
          actor_id: currentUserId,
          type: "friend_accepted",
          title: "aceitou sua solicitação de amizade",
        } as any);
      }

      setStatus("accepted");
      toast({
        title: "Amizade aceita! 🎉",
        description: `Você e @${targetUsername} agora são amigos!`,
      });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const removeFriendship = async () => {
    if (!friendshipId) return;
    setLoading(true);
    try {
      await supabase.from("friendships" as any).delete().eq("id", friendshipId);
      setStatus("none");
      setFriendshipId(null);
      toast({ title: "Amizade removida" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (currentUserId === targetUserId) return null;

  const config = {
    none: {
      icon: UserPlus,
      label: "Amigo",
      variant: "outline" as const,
      action: sendRequest,
    },
    pending_sent: {
      icon: Clock,
      label: "Pendente",
      variant: "outline" as const,
      action: removeFriendship,
    },
    pending_received: {
      icon: UserCheck,
      label: "Aceitar",
      variant: "default" as const,
      action: acceptRequest,
    },
    accepted: {
      icon: UserCheck,
      label: "Amigos",
      variant: "secondary" as const,
      action: removeFriendship,
    },
  };

  const { icon: Icon, label, variant, action } = config[status];

  return (
    <Button
      variant={variant}
      size={size}
      onClick={action}
      disabled={loading}
      className="hover-lift"
    >
      <Icon className="h-4 w-4 mr-1" />
      {loading ? "..." : label}
    </Button>
  );
};

export default FriendshipButton;
