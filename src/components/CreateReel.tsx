import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Video, Image as ImageIcon, X, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CreateReelProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReelCreated: () => void;
}

const CreateReel = ({ userId, open, onOpenChange, onReelCreated }: CreateReelProps) => {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast({
        title: "Formato não suportado",
        description: "Selecione uma imagem ou vídeo.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo é 50MB.",
        variant: "destructive",
      });
      return;
    }

    setMediaFile(file);
    setMediaType(isImage ? "image" : "video");
    setMediaPreview(URL.createObjectURL(file));
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetForm = () => {
    setContent("");
    removeMedia();
  };

  const handleSubmit = async () => {
    if (!mediaFile) {
      toast({
        title: "Mídia obrigatória",
        description: "Adicione um vídeo ou imagem para criar um Reel.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const hashtags = content.match(/#(\w+)/g)?.map(t => t.toLowerCase()) || [];
      const fileExt = mediaFile.name.split(".").pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("posts")
        .upload(filePath, mediaFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("posts").getPublicUrl(filePath);

      const { error } = await supabase.from("posts").insert({
        user_id: userId,
        content: content.trim() || "🎬",
        hashtags,
        image_url: mediaType === "image" ? urlData.publicUrl : null,
        video_url: mediaType === "video" ? urlData.publicUrl : null,
      });
      if (error) throw error;

      toast({ title: "Reel publicado! 🎬", description: "Seu reel já está no ar." });
      resetForm();
      onOpenChange(false);
      onReelCreated();
    } catch (error: any) {
      toast({
        title: "Erro ao criar reel",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!loading) { onOpenChange(v); if (!v) resetForm(); } }}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-white text-center">Novo Reel</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload area */}
          {!mediaPreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-600 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/60 transition-colors min-h-[280px]"
            >
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <p className="text-zinc-300 font-medium">Toque para selecionar</p>
              <p className="text-zinc-500 text-sm text-center">Vídeo ou imagem (máx. 50MB)</p>
              <div className="flex gap-2 mt-2">
                <span className="flex items-center gap-1 text-xs text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full">
                  <Video className="h-3 w-3" /> Vídeo
                </span>
                <span className="flex items-center gap-1 text-xs text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full">
                  <ImageIcon className="h-3 w-3" /> Foto
                </span>
              </div>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-black">
              {mediaType === "video" ? (
                <video src={mediaPreview} controls className="w-full max-h-[350px] object-contain mx-auto" />
              ) : (
                <img src={mediaPreview} alt="Preview" className="w-full max-h-[350px] object-contain mx-auto" />
              )}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={removeMedia}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleMediaSelect}
            className="hidden"
          />

          {/* Caption */}
          <Textarea
            placeholder="Escreva uma legenda... Use #hashtags"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            maxLength={2000}
            className="resize-none bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
          />

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={loading || !mediaFile}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publicando...
              </>
            ) : (
              "Publicar Reel"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateReel;
