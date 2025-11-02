import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CallToAction = () => {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background com gradiente */}
      <div className="absolute inset-0 bg-[image:var(--gradient-caatinga)] opacity-95" />
      
      {/* Padrão decorativo */}
      <div className="absolute inset-0 opacity-10">
        <div className="h-full w-full" style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '30px 30px'
        }} />
      </div>

      <div className="container mx-auto max-w-4xl relative z-10">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Pronto pra fazer parte?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Crie sua conta agora e comece a se conectar com gente da sua terra. 
            É de graça e leva menos de um minuto, viu?
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              variant="hero"
              className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
            >
              Criar minha conta
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <p className="mt-8 text-white/70 text-sm">
            Já tem conta? <a href="/auth" className="underline hover:text-white transition-colors">Entre aqui</a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
