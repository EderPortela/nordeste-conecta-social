import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Video, Image as ImageIcon, X, Upload, Camera, SwitchCamera, StopCircle } from "lucide-react";
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

type Mode = "upload" | "camera";

const CreateReel = ({ userId, open, onOpenChange, onReelCreated }: CreateReelProps) => {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera state
  const [mode, setMode] = useState<Mode>("upload");
  const [isRecording, setIsRecording] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup camera on close
  useEffect(() => {
    if (!open) {
      stopCamera();
      setMode("upload");
    }
  }, [open]);

  const startCamera = useCallback(async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play();
      }
      setCameraReady(true);
    } catch (err: any) {
      toast({
        title: "Câmera indisponível",
        description: "Permita o acesso à câmera nas configurações do navegador.",
        variant: "destructive",
      });
      setMode("upload");
    }
  }, [facingMode, toast]);

  const stopCamera = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraReady(false);
    setIsRecording(false);
    setRecordingTime(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (mode === "camera" && open) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode, open, facingMode]);

  const flipCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const file = new File([blob], `reel-${Date.now()}.webm`, { type: "video/webm" });
      setMediaFile(file);
      setMediaType("video");
      setMediaPreview(URL.createObjectURL(blob));
      stopCamera();
      setMode("upload"); // switch to preview mode
    };
    recorder.start(100);
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      toast({ title: "Formato não suportado", description: "Selecione uma imagem ou vídeo.", variant: "destructive" });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "O tamanho máximo é 50MB.", variant: "destructive" });
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
    stopCamera();
    setMode("upload");
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const handleSubmit = async () => {
    if (!mediaFile) {
      toast({ title: "Mídia obrigatória", description: "Adicione um vídeo ou imagem para criar um Reel.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const hashtags = content.match(/#(\w+)/g)?.map((t) => t.toLowerCase()) || [];
      const fileExt = mediaFile.name.split(".").pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("posts").upload(filePath, mediaFile);
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
      toast({ title: "Erro ao criar reel", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!loading) { onOpenChange(v); if (!v) resetForm(); } }}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-700 text-white max-h-[95dvh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-white text-center">Novo Reel</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode tabs */}
          {!mediaPreview && (
            <div className="flex gap-2 justify-center">
              <Button
                variant={mode === "upload" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("upload")}
                className={mode !== "upload" ? "border-zinc-600 text-zinc-300 hover:bg-zinc-800" : ""}
              >
                <Upload className="h-4 w-4 mr-1" /> Galeria
              </Button>
              <Button
                variant={mode === "camera" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("camera")}
                className={mode !== "camera" ? "border-zinc-600 text-zinc-300 hover:bg-zinc-800" : ""}
              >
                <Camera className="h-4 w-4 mr-1" /> Câmera
              </Button>
            </div>
          )}

          {/* Upload area */}
          {mode === "upload" && !mediaPreview && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-600 rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/60 transition-colors min-h-[240px] active:scale-[0.98]"
            >
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                <Upload className="h-7 w-7 text-primary" />
              </div>
              <p className="text-zinc-300 font-medium text-sm">Toque para selecionar</p>
              <p className="text-zinc-500 text-xs text-center">Vídeo ou imagem (máx. 50MB)</p>
              <div className="flex gap-2 mt-1">
                <span className="flex items-center gap-1 text-xs text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full">
                  <Video className="h-3 w-3" /> Vídeo
                </span>
                <span className="flex items-center gap-1 text-xs text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full">
                  <ImageIcon className="h-3 w-3" /> Foto
                </span>
              </div>
            </div>
          )}

          {/* Camera view */}
          {mode === "camera" && !mediaPreview && (
            <div className="relative rounded-xl overflow-hidden bg-black min-h-[300px] flex items-center justify-center">
              <video
                ref={videoPreviewRef}
                className="w-full h-[300px] object-cover"
                autoPlay
                playsInline
                muted
              />
              {/* Recording timer */}
              {isRecording && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                  <span className="h-2 w-2 bg-white rounded-full" />
                  {formatTime(recordingTime)}
                </div>
              )}
              {/* Camera controls */}
              <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-6">
                <Button variant="ghost" size="icon" onClick={flipCamera} disabled={isRecording} className="text-white bg-black/40 rounded-full h-10 w-10">
                  <SwitchCamera className="h-5 w-5" />
                </Button>
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    disabled={!cameraReady}
                    className="h-16 w-16 rounded-full border-4 border-white flex items-center justify-center bg-red-500 hover:bg-red-600 transition-colors active:scale-95 disabled:opacity-50"
                  >
                    <div className="h-6 w-6 rounded-full bg-white" />
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="h-16 w-16 rounded-full border-4 border-white flex items-center justify-center bg-red-600 hover:bg-red-700 transition-colors active:scale-95"
                  >
                    <StopCircle className="h-7 w-7 text-white" />
                  </button>
                )}
                <div className="h-10 w-10" /> {/* spacer */}
              </div>
            </div>
          )}

          {/* Media preview */}
          {mediaPreview && (
            <div className="relative rounded-xl overflow-hidden bg-black">
              {mediaType === "video" ? (
                <video src={mediaPreview} controls className="w-full max-h-[300px] object-contain mx-auto" playsInline />
              ) : (
                <img src={mediaPreview} alt="Preview" className="w-full max-h-[300px] object-contain mx-auto" />
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
            capture="environment"
            onChange={handleMediaSelect}
            className="hidden"
          />

          {/* Caption */}
          <Textarea
            placeholder="Escreva uma legenda... Use #hashtags"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
            maxLength={2000}
            className="resize-none bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 text-sm"
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
