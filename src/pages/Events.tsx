import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import LeftSidebar from "@/components/LeftSidebar";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  MapPin,
  Plus,
  Users,
  CheckCircle2,
  Star,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Profile {
  id: string;
  username: string;
  display_name: string;
  location: string | null;
}

interface Event {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  location: string;
  event_date: string;
  end_date: string | null;
  category: string;
  created_at: string;
  attendee_count?: number;
  user_status?: string | null;
}

const eventCategories = [
  { value: "cultura", label: "🎭 Cultura", color: "bg-primary/10 text-primary" },
  { value: "forro", label: "🎵 Forró", color: "bg-secondary/10 text-secondary" },
  { value: "gastronomia", label: "🍽️ Gastronomia", color: "bg-massa/10 text-massa" },
  { value: "artesanato", label: "✂️ Artesanato", color: "bg-cabra-bom/10 text-cabra-bom" },
  { value: "religioso", label: "⛪ Religioso", color: "bg-accent/10 text-accent" },
  { value: "outro", label: "📌 Outro", color: "bg-muted text-muted-foreground" },
];

const Events = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState("todos");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [category, setCategory] = useState("cultura");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      setUser(user);

      const { data: profileData } = await supabase
        .from("profiles").select("*").eq("id", user.id).single();
      if (profileData) setProfile(profileData);

      await loadEvents(user.id);
    };
    init();
  }, [navigate]);

  const loadEvents = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });

      if (error) throw error;

      const enriched = await Promise.all(
        (data || []).map(async (event) => {
          const { count } = await supabase
            .from("event_attendees")
            .select("*", { count: "exact", head: true })
            .eq("event_id", event.id)
            .eq("status", "going");

          const { data: userAttendee } = await supabase
            .from("event_attendees")
            .select("status")
            .eq("event_id", event.id)
            .eq("user_id", userId)
            .maybeSingle();

          return {
            ...event,
            attendee_count: count || 0,
            user_status: userAttendee ? userAttendee.status : null,
          };
        })
      );

      setEvents(enriched);
    } catch (error: any) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user || !title || !location || !eventDate) return;
    setCreating(true);
    try {
      const { error } = await supabase.from("events").insert({
        creator_id: user.id,
        title,
        description: description || null,
        location,
        event_date: new Date(eventDate).toISOString(),
        category,
      });

      if (error) throw error;

      toast({ title: "Evento criado! 🎉", description: "Seu evento cultural foi publicado!" });
      setShowCreate(false);
      setTitle(""); setDescription(""); setLocation(""); setEventDate("");
      await loadEvents(user.id);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleRSVP = async (eventId: string, status: string) => {
    if (!user) return;
    try {
      const { data: existing } = await supabase
        .from("event_attendees")
        .select("id")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("event_attendees")
          .update({ status })
          .eq("id", existing.id);
      } else {
        await supabase.from("event_attendees").insert({
          event_id: eventId,
          user_id: user.id,
          status,
        });
      }

      const labels: Record<string, string> = {
        going: "Presença confirmada! ✅",
        interested: "Marcado como interessado ⭐",
        not_going: "Participação removida",
      };

      toast({ title: labels[status] || "Atualizado" });
      await loadEvents(user.id);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleCheckIn = async (eventId: string) => {
    if (!user) return;
    try {
      await supabase
        .from("event_attendees")
        .update({ checked_in: true, checked_in_at: new Date().toISOString() })
        .eq("event_id", eventId)
        .eq("user_id", user.id);

      toast({ title: "Check-in realizado! 📍", description: "Oxente, você chegou!" });
      await loadEvents(user.id);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const filteredEvents = filter === "todos"
    ? events
    : filter === "meus"
    ? events.filter(e => e.user_status === "going" || e.creator_id === user?.id)
    : events.filter(e => e.category === filter);

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 lg:pb-0">
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6 max-w-[1600px] mx-auto">
          <LeftSidebar
            profile={{
              username: profile.username,
              display_name: profile.display_name,
              location: profile.location || undefined,
            }}
            activeRoute="/eventos"
            onNavigate={(route) => navigate(route)}
          />

          <main className="flex-1 max-w-3xl mx-auto lg:mx-0 w-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  🎭 Eventos Culturais
                </h1>
                <p className="text-muted-foreground mt-1">
                  Descubra o que rola no Nordeste
                </p>
              </div>

              <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogTrigger asChild>
                  <Button className="shadow-soft hover-lift">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Evento
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Criar Evento Cultural</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Nome do evento"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                    <Textarea
                      placeholder="Descrição do evento..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="Local"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {eventCategories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      type="datetime-local"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                    />
                    <Button
                      onClick={handleCreate}
                      disabled={creating || !title || !location || !eventDate}
                      className="w-full"
                    >
                      {creating ? "Criando..." : "Publicar Evento 🎉"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex gap-2 mb-6 flex-wrap">
              {[
                { value: "todos", label: "Todos" },
                { value: "meus", label: "Meus Eventos" },
                ...eventCategories,
              ].map((f) => (
                <Button
                  key={f.value}
                  variant={filter === f.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(f.value)}
                  className="hover-lift"
                >
                  {f.label}
                </Button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Carregando eventos...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <Card className="rounded-2xl shadow-card p-16 text-center">
                <div className="text-6xl mb-4">🎭</div>
                <p className="text-xl font-semibold mb-2">Nenhum evento encontrado</p>
                <p className="text-muted-foreground mb-4">
                  Que tal criar o primeiro evento cultural?
                </p>
                <Button onClick={() => setShowCreate(true)}>Criar Evento</Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredEvents.map((event) => {
                  const catInfo = eventCategories.find(c => c.value === event.category);
                  const eventDateObj = new Date(event.event_date);
                  const isPast = eventDateObj < new Date();

                  return (
                    <Card key={event.id} className="rounded-2xl shadow-card border border-border overflow-hidden hover:shadow-hover transition-all">
                      <CardContent className="p-5">
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center justify-center bg-primary/10 rounded-xl px-4 py-3 min-w-[70px]">
                            <span className="text-xs font-semibold text-primary uppercase">
                              {format(eventDateObj, "MMM", { locale: ptBR })}
                            </span>
                            <span className="text-2xl font-bold text-foreground">
                              {format(eventDateObj, "dd")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(eventDateObj, "HH:mm")}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-bold text-lg text-foreground">{event.title}</h3>
                                {catInfo && (
                                  <Badge variant="secondary" className={`${catInfo.color} mt-1`}>
                                    {catInfo.label}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {event.description && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {event.description}
                              </p>
                            )}

                            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                <span>{event.location}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                <span>{event.attendee_count} confirmados</span>
                              </div>
                            </div>

                            {!isPast && (
                              <div className="flex gap-2 mt-4">
                                <Button
                                  size="sm"
                                  variant={event.user_status === "going" ? "default" : "outline"}
                                  onClick={() => handleRSVP(event.id, "going")}
                                  className="hover-lift"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Vou
                                </Button>
                                <Button
                                  size="sm"
                                  variant={event.user_status === "interested" ? "secondary" : "outline"}
                                  onClick={() => handleRSVP(event.id, "interested")}
                                  className="hover-lift"
                                >
                                  <Star className="h-4 w-4 mr-1" />
                                  Interesse
                                </Button>
                                {event.user_status === "going" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCheckIn(event.id)}
                                    className="hover-lift ml-auto"
                                  >
                                    <MapPin className="h-4 w-4 mr-1" />
                                    Check-in
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      <BottomNav
        activeRoute="/eventos"
        onNavigate={(route) => navigate(route)}
      />
    </div>
  );
};

export default Events;
