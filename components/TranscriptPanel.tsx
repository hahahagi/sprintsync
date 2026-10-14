"use client";

import { useState, useRef, useEffect } from "react";

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: { error: string }) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent {
  results: {
    length: number;
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface CustomWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
}

interface TranscriptPanelProps {
  transcript: string;
  onChange: (value: string) => void;
  disabled: boolean;
  maxLength?: number;
}

export function TranscriptPanel({
  transcript,
  onChange,
  disabled,
  maxLength = 6000,
}: TranscriptPanelProps) {
  const [language, setLanguage] = useState<"id" | "en">("id");
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const baseTextRef = useRef("");

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = async () => {
    if (disabled) return;

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const customWin = window as unknown as CustomWindow;
    const SpeechRecognitionClass =
      customWin.SpeechRecognition || customWin.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert(
        "Browser ini belum mendukung Web Speech API. Silakan gunakan Google Chrome atau Microsoft Edge."
      );
      return;
    }

    // 1. Minta izin akses mikrofon secara eksplisit
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch (err) {
      console.error("Mic permission error:", err);
      alert(
        "Akses mikrofon belum diizinkan. Klik ikon gembok/pengaturan di sebelah URL browser dan izinkan Mikrofon."
      );
      return;
    }

    baseTextRef.current = transcript ? transcript.trim() + "\n" : "";

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = language === "id" ? "id-ID" : "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let speechText = "";
        for (let i = 0; i < event.results.length; i++) {
          speechText += event.results[i][0].transcript + " ";
        }
        onChange((baseTextRef.current + speechText).slice(0, maxLength));
      };

      recognition.onerror = (event: { error: string }) => {
        console.warn("Speech Recognition notice:", event.error);
        if (event.error === "no-speech") {
          return; // Jangan matikan mic jika hening sesaat
        }
        if (event.error === "not-allowed") {
          alert("Akses mikrofon ditolak oleh browser.");
        } else if (event.error === "network") {
          alert(
            "Gagal menghubungi layanan speech browser (network error). Cek koneksi internet atau gunakan Chrome/Edge."
          );
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch (e) {
      console.error(e);
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Meeting Transcript
        </label>

        <div className="flex items-center gap-3">
          {/* Toggle Bahasa M3 */}
          <div className="inline-flex items-center rounded-full border border-[#c4c6d0] bg-[#f0f4f9] p-0.5">
            <button
              type="button"
              onClick={() => setLanguage("id")}
              disabled={isRecording}
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                language === "id"
                  ? "bg-white text-[#0b57d0] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ID
            </button>
            <button
              type="button"
              onClick={() => setLanguage("en")}
              disabled={isRecording}
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                language === "en"
                  ? "bg-white text-[#0b57d0] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              EN
            </button>
          </div>

          {/* Record Standup M3 */}
          <button
            type="button"
            onClick={toggleRecording}
            disabled={disabled}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-semibold transition-all ${
              isRecording
                ? "border-red-400 bg-red-50 text-red-700 animate-pulse"
                : "border-[#c4c6d0] bg-white text-slate-700 hover:bg-[#f0f4f9] disabled:opacity-50"
            }`}
          >
            <span
              className={`material-symbols-outlined !text-[18px] ${
                isRecording ? "text-red-600" : "text-slate-600"
              }`}
            >
              {isRecording ? "mic" : "mic_none"}
            </span>
            <span>{isRecording ? "Recording..." : "Record Standup"}</span>
          </button>

          <span className="text-xs font-mono text-slate-500">
            {transcript.length}/{maxLength}
          </span>
        </div>
      </div>

      <textarea
        value={transcript}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        disabled={disabled}
        placeholder={
          isRecording
            ? `Sedang mendengarkan dalam bahasa ${language === "id" ? "Indonesia" : "Inggris"}... Silakan bicara...`
            : "Paste your meeting transcript here, or select language & click 'Record Standup'..."
        }
        className={`h-64 w-full resize-none rounded-2xl border bg-white p-4 text-sm leading-relaxed text-[#1f1f1f] placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:opacity-50 transition-all ${
          isRecording
            ? "border-red-300 ring-2 ring-red-100 bg-red-50/10"
            : "border-[#c4c6d0] focus:border-[#0b57d0] focus:ring-[#d3e3fd]"
        }`}
      />
    </div>
  );
}