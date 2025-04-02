import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Image as ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Image from "next/image";

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  currentImageUrl?: string;
  onRemoveImage?: () => void;
}

export function ImageUpload({
  onImageSelect,
  currentImageUrl,
  onRemoveImage,
}: ImageUploadProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px is a common breakpoint for mobile
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelect(file);
      setIsDialogOpen(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera on mobile devices
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert(
        "Could not access camera. Please make sure you have granted camera permissions."
      );
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const takePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], "camera-photo.jpg", {
                type: "image/jpeg",
              });
              onImageSelect(file);
              stopCamera();
              setIsDialogOpen(false);
            }
          },
          "image/jpeg",
          0.8
        );
      }
    }
  };

  return (
    <div className="space-y-4">
      {currentImageUrl ? (
        <div className="relative w-32 h-32">
          <Image
            src={currentImageUrl}
            alt="Selected image"
            fill
            className="object-cover rounded-md"
            sizes="128px"
          />
          {onRemoveImage && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={onRemoveImage}
            >
              <span className="sr-only">Remove image</span>×
            </Button>
          )}
        </div>
      ) : (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              {isMobile ? "Click to Add Image" : "Choose Image"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Image</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!isMobile && (
                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4"
                  onClick={startCamera}
                >
                  <Camera className="h-8 w-8" />
                  <span>Take Photo</span>
                </Button>
              )}
              <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-8 w-8" />
                <span>{isMobile ? "Select Method " : "Choose from Library"}</span>
              </Button>
            </div>

            {cameraStream && (
              <div className="relative mt-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg"
                />
                <Button
                  className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
                  onClick={takePicture}
                >
                  Take Photo
                </Button>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
