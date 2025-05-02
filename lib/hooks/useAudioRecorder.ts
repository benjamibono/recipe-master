import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { generateTextFromAudio, RecipeAudioData } from "@/lib/audio-text";

export interface AudioRecorderState {
  isRecording: boolean;
  processing: boolean;
}

export function useAudioRecorder() {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    processing: false,
  });
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Find first supported MIME type
      let mimeType = "audio/webm";
      const types = ["audio/webm", "audio/mp4", "audio/ogg", "audio/wav"];
      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(1000); // Record in 1-second chunks
      setState((prev) => ({ ...prev, isRecording: true }));
    } catch (error) {
      handleRecordingError(error);
    }
  }, []);

  const stopRecording = useCallback(
    async (language: string = "auto"): Promise<RecipeAudioData | null> => {
      if (!mediaRecorderRef.current || !state.isRecording) {
        return null;
      }

      setState((prev) => ({ ...prev, processing: true }));

      return new Promise((resolve) => {
        mediaRecorderRef.current!.onstop = async () => {
          try {
            const audioBlob = new Blob(audioChunksRef.current, {
              type: mediaRecorderRef.current?.mimeType || "audio/webm",
            });

            const { recipeData } = await generateTextFromAudio(
              audioBlob,
              language
            );
            resolve(recipeData || null);
          } catch (error) {
            console.error("Error processing audio:", error);
            toast.error("Failed to process audio input");
            resolve(null);
          } finally {
            setState({ isRecording: false, processing: false });
          }
        };

        try {
          mediaRecorderRef.current!.stop();
          mediaRecorderRef.current!.stream.getTracks().forEach((track) => {
            track.stop();
          });
        } catch (error) {
          console.error("Error stopping recording:", error);
          setState({ isRecording: false, processing: false });
          resolve(null);
        }
      });
    },
    [state.isRecording]
  );

  const handleRecordingError = (error: unknown) => {
    console.error("Error accessing microphone:", error);

    if ((error as Error).name === "NotAllowedError") {
      toast.error(
        "Microphone permission denied. Please enable it in your browser settings."
      );
    } else if ((error as Error).name === "NotFoundError") {
      toast.error("No microphone found on your device.");
    } else {
      toast.error("Failed to access microphone");
    }

    setState({ isRecording: false, processing: false });
  };

  return {
    ...state,
    startRecording,
    stopRecording,
  };
}
