import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Image as ImageIcon, Video, X } from "lucide-react";

interface CreatePostProps {
  userId: string;
  onPostCreated: () => void;
}

const CreatePost = ({ userId, onPostCreated }: CreatePostProps) => {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.toLowerCase()) : [];
  };

  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast({
        title: "Formato não suportado",
        description: "Por favor, selecione uma imagem ou vídeo.",
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && !mediaFile) {
      toast({
        title: "Ops!",
        description: "Adicione texto ou mídia ao seu post.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const hashtags = extractHashtags(content);
      let imageUrl = null;
      let videoUrl = null;

      // Upload de mídia se houver
      if (mediaFile) {
        const fileExt = mediaFile.name.split(".").pop();
        const filePath = `${userId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("posts")
          .upload(filePath, mediaFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("posts").getPublicUrl(filePath);

        if (mediaType === "image") {
          imageUrl = data.publicUrl;
        } else {
          videoUrl = data.publicUrl;
        }
      }

      const { error } = await supabase
        .from("posts")
        .insert({
          user_id: userId,
          content: content.trim(),
          hashtags,
          image_url: imageUrl,
          video_url: videoUrl,
        });

      if (error) throw error;

      toast({
        title: "Post criado!",
        description: "Seu post foi compartilhado com sucesso.",
      });

      setContent("");
      removeMedia();
      onPostCreated();
    } catch (error: any) {
      toast({
        title: "Erro ao criar post",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="O que você quer compartilhar hoje? Use #hashtags para marcar temas..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            maxLength={5000}
            className="resize-none"
          />

          {/* Preview da mídia */}
          {mediaPreview && (
            <div className="relative rounded-lg overflow-hidden">
              {mediaType === "image" ? (
                <img src={mediaPreview} alt="Preview" className="w-full max-h-96 object-cover" />
              ) : (
                <video src={mediaPreview} controls className="w-full max-h-96" />
              )}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={removeMedia}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || !!mediaFile}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Foto
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || !!mediaFile}
              >
                <Video className="h-4 w-4 mr-2" />
                Vídeo
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {content.length}/5000
              </span>
              <Button type="submit" disabled={loading || (!content.trim() && !mediaFile)}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Publicar
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreatePost;