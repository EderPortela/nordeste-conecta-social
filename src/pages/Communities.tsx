import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  created_at: string;
  creator_id: string;
  member_count: number;
  is_member: boolean;
}

const Communities = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCommunity, setNewCommunity] = useState({
    name: "",
    description: "",
    category: "cultura"
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setCurrentUser(session.user);
      loadCommunities(session.user.id);
    });
  }, [navigate]);

  const loadCommunities = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("communities_with_stats")
        .select("*")
        .order("member_count", { ascending: false });

      if (error) throw error;

      // Check membership for each community
      const communitiesWithMembership = await Promise.all(
        (data || []).map(async (community) => {
          const { data: memberData } = await supabase
            .from("community_members")
            .select("id")
            .eq("community_id", community.id)
            .eq("user_id", userId)
            .single();

          return {
            ...community,
            is_member: !!memberData
          };
        })
      );

      setCommunities(communitiesWithMembership);
    } catch (error: any) {
      console.error("Error loading communities:", error);
    }
  };

  const createCommunity = async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from("communities")
        .insert({
          ...newCommunity,
          creator_id: currentUser.id
        })
        .select()
        .single();

      if (error) throw error;

      // Automatically join the created community
      await supabase
        .from("community_members")
        .insert({
          community_id: data.id,
          user_id: currentUser.id
        });

      toast({
        title: "Comunidade criada!",
        description: "Sua nova comunidade está pronta.",
      });

      setShowCreateDialog(false);
      setNewCommunity({ name: "", description: "", category: "cultura" });
      loadCommunities(currentUser.id);
    } catch (error: any) {
      toast({
        title: "Erro ao criar comunidade",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleMembership = async (communityId: string, isMember: boolean) => {
    if (!currentUser) return;

    try {
      if (isMember) {
        await supabase
          .from("community_members")
          .delete()
          .eq("community_id", communityId)
          .eq("user_id", currentUser.id);

        toast({
          title: "Você saiu da comunidade",
        });
      } else {
        await supabase
          .from("community_members")
          .insert({
            community_id: communityId,
            user_id: currentUser.id
          });

        toast({
          title: "Você entrou na comunidade!",
          description: "+10 XP",
        });
      }

      loadCommunities(currentUser.id);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    community.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-3">
            <LeftSidebar />
          </div>

          <div className="col-span-12 lg:col-span-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Vilarejos e Comunidades</h1>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Vilarejo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Nova Comunidade</DialogTitle>
                      <DialogDescription>
                        Crie um espaço para reunir pessoas com interesses em comum
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Nome da comunidade"
                        value={newCommunity.name}
                        onChange={(e) => setNewCommunity({...newCommunity, name: e.target.value})}
                      />
                      <Textarea
                        placeholder="Descrição"
                        value={newCommunity.description}
                        onChange={(e) => setNewCommunity({...newCommunity, description: e.target.value})}
                      />
                      <Input
                        placeholder="Categoria"
                        value={newCommunity.category}
                        onChange={(e) => setNewCommunity({...newCommunity, category: e.target.value})}
                      />
                      <Button onClick={createCommunity} className="w-full">
                        Criar Comunidade
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar comunidades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-4">
                {filteredCommunities.map(community => (
                  <Card key={community.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{community.name}</CardTitle>
                          <CardDescription className="mt-2">
                            {community.description}
                          </CardDescription>
                        </div>
                        <Badge>{community.category}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {community.member_count} membros
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant={community.is_member ? "outline" : "default"}
                            onClick={() => toggleMembership(community.id, community.is_member)}
                          >
                            {community.is_member ? "Sair" : "Entrar na Vila"}
                          </Button>
                          {community.is_member && (
                            <Button onClick={() => navigate(`/comunidades/${community.id}`)}>
                              Ver Feed
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-3">
            <RightSidebar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Communities;
