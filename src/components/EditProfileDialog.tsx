import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import ImageUpload from "./ImageUpload";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    id: string;
    username: string;
    display_name: string;
    bio: string | null;
    location: string | null;
    avatar_url: string | null;
    cover_url?: string | null;
  };
  onSuccess: () => void;
}

const EditProfileDialog = ({ open, onOpenChange, profile, onSuccess }: EditProfileDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: profile.display_name,
    bio: profile.bio || "",
    location: profile.location || "",
    avatar_url: profile.avatar_url || "",
    cover_url: profile.cover_url || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: formData.display_name.trim(),
          bio: formData.bio.trim() || null,
          location: formData.location.trim() || null,
          avatar_url: formData.avatar_url || null,
          cover_url: formData.cover_url || null,
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado! 🎉",
        description: "Suas informações foram salvas com sucesso.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Atualize suas informações do Portella
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="images">Fotos</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">Nome de exibição *</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Seu nome"
                  required
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Conte um pouco sobre você..."
                  rows={4}
                  maxLength={200}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.bio.length}/200
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Localização</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ex: Recife, PE"
                  maxLength={100}
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                <p className="font-semibold mb-1">📌 Dica:</p>
                <p>Seu username (@{profile.username}) não pode ser alterado.</p>
              </div>
            </TabsContent>

            <TabsContent value="images" className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label>Foto de Perfil</Label>
                <ImageUpload
                  userId={profile.id}
                  currentImageUrl={formData.avatar_url}
                  bucket="avatars"
                  type="avatar"
                  onUploadComplete={(url) => setFormData({ ...formData, avatar_url: url })}
                />
              </div>

              <div className="space-y-2">
                <Label>Foto de Capa</Label>
                <ImageUpload
                  userId={profile.id}
                  currentImageUrl={formData.cover_url}
                  bucket="covers"
                  type="cover"
                  onUploadComplete={(url) => setFormData({ ...formData, cover_url: url })}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar alterações"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
