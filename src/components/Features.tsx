import { Heart, MessageCircle, Users, Store, Hash, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Users,
    title: "Conexões Autênticas",
    description: "Conecte-se com pessoas que compartilham o orgulho nordestino e a cultura da nossa terra."
  },
  {
    icon: Hash,
    title: "Tendências Regionais",
    description: "Acompanhe o que está bombando: #forró #cuscuz #oxente #literaturaDecordel e muito mais."
  },
  {
    icon: Store,
    title: "Feira Nordestina",
    description: "Espaço especial para artistas, artesãos e empreendedores divulgarem seus produtos."
  },
  {
    icon: Heart,
    title: "Cultura Viva",
    description: "Compartilhe música, arte, receitas e tradições que fazem do Nordeste único."
  },
  {
    icon: MessageCircle,
    title: "Conversas de Comadre",
    description: "Chat direto para manter aquela prosa boa com quem você gosta."
  },
  {
    icon: Sparkles,
    title: "Destaque para Criadores",
    description: "Sistema especial para valorizar quem produz conteúdo de qualidade sobre nossa região."
  }
];

const Features = () => {
  return (
    <section className="py-24 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Por que a Portella?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Uma rede social que entende e celebra a nossa cultura. 
            Aqui você encontra seu povo, sua voz e sua identidade.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="group hover:shadow-lg transition-all duration-300 border-border hover:border-primary/50 bg-card"
            >
              <CardContent className="p-6">
                <div className="mb-4 inline-block p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Bottom */}
        <div className="mt-16 text-center">
          <p className="text-2xl font-medium text-foreground mb-2">
            Arretado demais, né?
          </p>
          <p className="text-muted-foreground">
            Junte-se a comunidade que cresce a cada dia.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Features;
