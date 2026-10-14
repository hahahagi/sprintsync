"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff } from "lucide-react";

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
  const [isListening, setIsListening] = useState(false);
  const [lang, setLang] = useState<"id-ID" | "en-US">("id-ID");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef("");

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const toggleListening = async () => {
    if (disabled) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Browser kamu belum mendukung Speech Recognition. Gunakan Google Chrome atau Microsoft Edge."
      );
      return;
    }

    // 1. Minta izin akses mikrofon secara eksplisit
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Matikan audio stream dummy setelah izin didapat
      stream.getTracks().forEach((track) => track.stop());
    } catch (err) {
      console.error("Mic permission error:", err);
      alert(
        "Akses mikrofon belum diizinkan. Klik ikon gembok/pengaturan di sebelah URL browser (localhost:3000) dan ubah izin Mikrofon menjadi 'Allow'."
      );
      return;
    }

    baseTextRef.current = transcript ? transcript.trim() + "\n" : "";

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let speechText = "";
      for (let i = 0; i < event.results.length; i++) {
        speechText += event.results[i][0].transcript + " ";
      }
      onChange((baseTextRef.current + speechText).slice(0, maxLength));
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.warn("Speech Recognition notice:", event.error);
      // JANGAN matikan mic jika hanya hening sesaat (no-speech)
      if (event.error === "no-speech") {
        return;
      }
      if (event.error === "not-allowed") {
        alert("Akses mikrofon ditolak oleh browser.");
      } else if (event.error === "network") {
        alert("Gagal menghubungi layanan speech browser (network error). Cek koneksi internet.");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">
          Meeting Transcript
        </label>
        <div className="flex items-center gap-2">
          {/* Toggle Bahasa ID / EN */}
          <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setLang("id-ID")}
              disabled={isListening}
              className={`rounded px-1.5 py-0.5 font-medium transition-colors ${
                lang === "id-ID"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              🇮🇩 ID
            </button>
            <button
              type="button"
              onClick={() => setLang("en-US")}
              disabled={isListening}
              className={`rounded px-1.5 py-0.5 font-medium transition-colors ${
                lang === "en-US"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              🇺🇸 EN
            </button>
          </div>

          {/* Tombol Microphone */}
          <button
            type="button"
            onClick={toggleListening}
            disabled={disabled}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
              isListening
                ? "border-red-300 bg-red-50 text-red-600 shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-600 disabled:opacity-50"
            }`}
          >
            {isListening ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                </span>
                <span>Listening ({lang === "id-ID" ? "ID" : "EN"})...</span>
                <MicOff className="h-3.5 w-3.5 text-red-500" />
              </>
            ) : (
              <>
                <Mic className="h-3.5 w-3.5 text-slate-500" />
                <span>Record Standup</span>
              </>
            )}
          </button>

          {/* Character counter */}
          <span className="text-xs text-slate-400">
            {transcript.length}/{maxLength}
          </span>
        </div>
      </div>

      <textarea
        value={transcript}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        disabled={disabled}
        placeholder={
          isListening
            ? `Sedang mendengarkan dalam bahasa ${lang === "id-ID" ? "Indonesia" : "Inggris"}... Silakan bicara...`
            : "Paste your meeting transcript here, or select language & click 'Record Standup'…"
        }
        className={`h-64 w-full resize-none rounded-xl border bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:opacity-50 transition-all ${
          isListening
            ? "border-red-300 ring-2 ring-red-100 bg-red-50/20"
            : "border-slate-200 focus:border-blue-300 focus:ring-blue-100"
        }`}
      />
    </div>
  );
}