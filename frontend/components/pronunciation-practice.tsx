"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mic, Square, ChevronRight, ChevronLeft, Loader2 } from "lucide-react"
import { PitchIntensityChart } from "./pitch-intensity-chart"
import { F1F2Chart } from "./f1f2-chart"
import { ProgressBar } from "./progress-bar"
import { loadLessons } from "@/lib/lessons"
import type { Lesson } from "@/lib/lessons"

type PitchDataPoint = {
  time: number
  pitch: number | null
}

type FormantPoint = {
  f1: number
  f2: number
}

type F1F2Point = {
  label: string
  word?: string
  phoneme?: string
  f1: number
  f2: number
}

type AnalysisResult = {
  score: number
  feedback: string
  details?: {
    student_pitch?: PitchDataPoint[]
    native_pitch?: PitchDataPoint[]
    student_points?: F1F2Point[]
    reference_points?: F1F2Point[]
  }
}

type PronunciationPracticeProps = {
  isAdmin?: boolean
}

export default function PronunciationPractice({
  isAdmin = false,
}: PronunciationPracticeProps) {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    const refreshLessons = () => {
      const loaded = loadLessons()
      setLessons(loaded)

      setCurrentIndex((prev) => {
        if (loaded.length === 0) return 0
        return Math.min(prev, loaded.length - 1)
      })
    }

    refreshLessons()
    window.addEventListener("toniweb-lessons-updated", refreshLessons)
    window.addEventListener("storage", refreshLessons)

    return () => {
      window.removeEventListener("toniweb-lessons-updated", refreshLessons)
      window.removeEventListener("storage", refreshLessons)
    }
  }, [])

  const currentLesson = lessons[currentIndex]

  const nextLesson = () => {
    if (!lessons.length) return
    setCurrentIndex((prev) => (prev + 1) % lessons.length)
    setAnalysisResult(null)
  }

  const prevLesson = () => {
    if (!lessons.length) return
    setCurrentIndex((prev) => (prev - 1 + lessons.length) % lessons.length)
    setAnalysisResult(null)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      mediaRecorderRef.current = new MediaRecorder(stream)
      chunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/wav" })
        await sendToBackend(audioBlob)
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setAnalysisResult(null)
    } catch (err) {
      console.error("Erro mic:", err)
      alert("Por favor, permita o uso do microfone para praticar.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
    }
  }

  const sendToBackend = async (blob: Blob) => {
    if (!currentLesson) return

    setIsLoading(true)

    const formData = new FormData()
    formData.append("file", blob, "recording.wav")
    formData.append("target_text", currentLesson.text)
    formData.append("target_type", currentLesson.type)
    formData.append("graph_mode", currentLesson.graphMode)

    formData.append(
      "target_phonemes",
      JSON.stringify(currentLesson.targets.map((t) => t.phoneme))
    )

    formData.append(
      "target_words",
      JSON.stringify(currentLesson.targets.map((t) => t.word))
    )

    if (currentLesson.targets[0]?.phoneme) {
      formData.append("target_phoneme", currentLesson.targets[0].phoneme)
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000"}/analyze`,
        {
          method: "POST",
          body: formData,
        }
      )

      if (!response.ok) {
        throw new Error("Erro no servidor")
      }

      const data: AnalysisResult = await response.json()
      setAnalysisResult(data)
    } catch (error) {
      console.error("Erro no processamento acústico:", error)
      alert("Erro na conexão com o servidor de análise.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!currentLesson) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-500">
        Nenhuma lição carregada.
      </div>
    )
  }

  const studentFormants: FormantPoint[] =
    analysisResult?.details?.student_points?.map((p) => ({
      f1: p.f1,
      f2: p.f2,
    })) ?? []

  const nativeFormants: FormantPoint[] =
    analysisResult?.details?.reference_points?.map((p) => ({
      f1: p.f1,
      f2: p.f2,
    })) ?? []

  return (
    <div
      className={
        isAdmin
          ? "flex flex-col h-full bg-white max-w-md mx-auto relative overflow-hidden shadow-xl border-x"
          : "flex flex-col min-h-screen bg-white max-w-md mx-auto relative overflow-hidden shadow-xl border-x"
      }
    >
      <div className="w-full aspect-video bg-black sticky top-0 z-20 border-b">
        <video
          key={currentLesson.videoUrl}
          src={currentLesson.videoUrl}
          controls
          className="w-full h-full object-cover"
          playsInline
        />
      </div>

      <div className="flex-1 p-4 pb-32 space-y-6 overflow-y-auto">
        <div className="flex items-center justify-between bg-slate-100 p-2 rounded-xl border">
          <Button variant="ghost" size="icon" onClick={prevLesson}>
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="text-center px-2">
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
              Alvos:{" "}
              {currentLesson.targets
                .map((t) => `${t.word} (${t.phoneme})`)
                .join(" • ")}
            </p>

            <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">
              Gráfico: {currentLesson.graphMode === "f1f2" ? "F1 x F2" : "Pitch"}
            </p>
          </div>

          <Button variant="ghost" size="icon" onClick={nextLesson}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <Card className="p-4 border-2 shadow-sm overflow-hidden bg-slate-50/50">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="min-w-[500px] space-y-4">
              <div className="h-56 w-full flex items-center justify-center bg-white rounded-lg border border-dashed border-slate-200">
                {isLoading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-blue-500 h-8 w-8" />
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Analisando Praat...
                    </span>
                  </div>
                ) : analysisResult ? (
                  currentLesson.graphMode === "f1f2" ? (
                    <F1F2Chart student={studentFormants} native={nativeFormants} />
                  ) : (
                    <PitchIntensityChart
                      studentData={analysisResult.details?.student_pitch ?? []}
                      nativeData={analysisResult.details?.native_pitch ?? []}
                    />
                  )
                ) : (
                  <p className="text-xs text-slate-300 uppercase font-black tracking-widest italic">
                    Aguardando Voz
                  </p>
                )}
              </div>

              <div className="flex justify-between px-2 pt-2 border-t border-slate-200 gap-2 flex-wrap">
                {currentLesson.text.split(" ").map((word, i) => (
                  <span
                    key={`${word}-${i}`}
                    className="text-[10px] font-black text-slate-500 uppercase font-mono italic"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {analysisResult && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <ProgressBar score={analysisResult.score} />

            <div
              className={`p-4 rounded-xl text-center border-2 ${
                analysisResult.score >= 75
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              <p className="text-xs font-bold leading-relaxed">
                "{analysisResult.feedback}"
              </p>
            </div>

            {currentLesson.graphMode === "f1f2" &&
              analysisResult.details?.student_points &&
              analysisResult.details.student_points.length > 0 && (
                <div className="rounded-xl border bg-slate-50 p-3">
                  <p className="text-[10px] uppercase font-black text-slate-500 mb-2">
                    Pontos detectados
                  </p>

                  <div className="space-y-2">
                    {analysisResult.details.student_points.map((point, index) => (
                      <div
                        key={`${point.word ?? "word"}-${point.phoneme ?? "phoneme"}-${index}`}
                        className="text-[11px] text-slate-700"
                      >
                        <strong>{point.word}</strong> ({point.phoneme}) — F1:{" "}
                        {Math.round(point.f1)} | F2: {Math.round(point.f2)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 flex justify-center z-30 pointer-events-none bg-gradient-to-t from-white via-white/80 to-transparent">
        <Button
          size="lg"
          className={`h-20 w-20 rounded-full shadow-2xl pointer-events-auto border-4 border-white transition-transform active:scale-95 ${
            isRecording
              ? "bg-red-500 animate-pulse hover:bg-red-600"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? (
            <Square className="h-8 w-8 fill-current text-white" />
          ) : (
            <Mic className="h-10 w-10 text-white" />
          )}
        </Button>
      </div>
    </div>
  )
}