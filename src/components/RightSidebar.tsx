import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  UserPlus, 
  Calendar, 
  ShoppingBag, 
  Music, 
  MapPin,
  Newspaper,
  ExternalLink,
  Play
} from "lucide-react";

const suggestedProfiles = [
  { name: "Maria do Cordel", username: "mariacordel", bio: "Poeta e cordelista", location: "Caruaru, PE" },
  { name: "João Forrozeiro", username: "joaoforró", bio: "Sanfoneiro", location: "Campina Grande, PB" },
  { name: "Ana Artesã", username: "anaartesa", bio: "Artesanato em barro", location: "Juazeiro, CE" },
];

const culturalEvents = [
  { title: "Festival de Forró", location: "Caruaru, PE", date: "10-15 Jul" },
  { title: "Feira de Artesanato", location: "Aracaju, SE", date: "Este fim de semana" },
  { title: "Lançamento Cordel Digital", location: "Online", date: "Amanhã" },
];

const feiraProducts = [
  { name: "Chapéu de Couro", seller: "Arte do Sertão", price: "R$ 89,90" },
  { name: "Rapadura Artesanal", seller: "Doces da Vó", price: "R$ 12,50" },
  { name: "Arte em Barro", seller: "Mãos de Mestre", price: "R$ 45,00" },
];

const news = [
  { title: "Museu do Cangaço abre nova exposição", location: "Serra Talhada, PE" },
  { title: "Festival de Cinema Nordestino em agosto", location: "Fortaleza, CE" },
  { title: "São João 2025: Preparativos começam", location: "Várias cidades" },
];

const RightSidebar = () => {
  return (
    <aside className="hidden xl:block w-80 sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto pl-4">
      <div className="space-y-4">
        {/* Gente da Terra */}
        <div className="bg-card rounded-2xl shadow-card p-4 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-base">Gente da Terra</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Siga quem faz o Nordeste brilhar
          </p>
          <div className="space-y-3">
            {suggestedProfiles.map((user) => (
              <div key={user.username} className="flex items-start gap-3 pb-3 border-b border-border/50 last:border-0 last:pb-0">
                <Avatar className="h-10 w-10 border border-primary/20">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary text-xs font-bold">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.bio}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{user.location}</span>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="text-xs h-7">
                  Seguir
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Cultura em Destaque */}
        <div className="bg-card rounded-2xl shadow-card p-4 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-secondary" />
            <h3 className="font-bold text-base">Cultura em Destaque</h3>
          </div>
          <div className="space-y-3">
            {culturalEvents.map((event, idx) => (
              <div key={idx} className="p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
                <p className="font-semibold text-sm text-foreground mb-1">{event.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{event.location}</span>
                </div>
                <Badge variant="secondary" className="mt-2 text-xs">
                  {event.date}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Feira Nordestina */}
        <div className="bg-gradient-to-br from-accent/10 to-primary/10 rounded-2xl shadow-card p-4 border border-accent/20">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="h-5 w-5 text-accent" />
            <h3 className="font-bold text-base">Feira Nordestina</h3>
          </div>
          <div className="space-y-3 mb-4">
            {feiraProducts.map((product, idx) => (
              <div key={idx} className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.seller}</p>
                </div>
                <p className="font-bold text-sm text-accent">{product.price}</p>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full" size="sm">
            <ExternalLink className="mr-2 h-3 w-3" />
            Ver Feira Completa
          </Button>
        </div>

        {/* Som da Portella */}
        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl shadow-card p-4 border border-primary/20">
          <div className="flex items-center gap-2 mb-4">
            <Music className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-base">Som da Portella</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            As melhores do forró e da música nordestina
          </p>
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-3 p-2 bg-card/50 rounded-lg">
              <div className="h-8 w-8 bg-primary/20 rounded flex items-center justify-center">
                <Play className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold">Playlist Forró Raiz</p>
                <p className="text-xs text-muted-foreground">42 músicas</p>
              </div>
            </div>
          </div>
          <Button variant="outline" className="w-full" size="sm">
            Ver Playlists
          </Button>
        </div>

        {/* Notícias do Nordeste */}
        <div className="bg-card rounded-2xl shadow-card p-4 border border-border pb-4">
          <div className="flex items-center gap-2 mb-4">
            <Newspaper className="h-5 w-5 text-secondary" />
            <h3 className="font-bold text-base">Notícias do Nordeste</h3>
          </div>
          <div className="space-y-3">
            {news.map((item, idx) => (
              <button
                key={idx}
                className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <p className="text-sm font-medium mb-1">{item.title}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{item.location}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
