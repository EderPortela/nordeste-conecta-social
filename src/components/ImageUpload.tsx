import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ImageUploadProps {
  userId: string;
  currentImageUrl?: string | null;
  bucket: "avatars" | "covers";
  onUploadComplete: (url: string) => void;
  type: "avatar" | "cover";
}

const ImageUpload = ({ userId, currentImageUrl, bucket, onUploadComplete, type }: ImageUploadProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/${Math.random()}.${fileExt}`;

      // Delete old image if exists
      if (currentImageUrl) {
        const oldPath = currentImageUrl.split("/").pop();
        if (oldPath) {
          await supabase.storage.from(bucket).remove([`${userId}/${oldPath}`]);
        }
      }

      // Upload new image
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      setPreviewUrl(publicUrl);
      onUploadComplete(publicUrl);

      toast({
        title: "Upload concluído! 🎉",
        description: type === "avatar" ? "Avatar atualizado com sucesso." : "Capa atualizada com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setPreviewUrl(null);
    onUploadComplete("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (type === "avatar") {
    return (
      <div className="flex flex-col items-center gap-4">
        <Avatar className="h-32 w-32 border-4 border-primary/20">
          {previewUrl ? (
            <AvatarImage src={previewUrl} alt="Avatar" />
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-4xl">
              ?
            </AvatarFallback>
          )}
        </Avatar>
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Carregar foto
              </>
            )}
          </Button>
          
          {previewUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeImage}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={uploadImage}
          className="hidden"
        />
      </div>
    );
  }

  // Cover image upload
  return (
    <div className="space-y-3">
      <div className="relative h-48 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 border-2 border-dashed border-border">
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="Cover"
              className="w-full h-full object-cover"
            />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 rounded-full shadow-lg"
              onClick={removeImage}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nenhuma foto de capa</p>
            </div>
          </div>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full"
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando capa...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            {previewUrl ? "Alterar foto de capa" : "Carregar foto de capa"}
          </>
        )}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={uploadImage}
        className="hidden"
      />
    </div>
  );
};

export default ImageUpload;
