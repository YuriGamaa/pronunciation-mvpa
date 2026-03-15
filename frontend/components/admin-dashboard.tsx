"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Plus, Activity, Scissors, Save } from "lucide-react"
import {
  DEFAULT_LESSONS,
  LESSONS_STORAGE_KEY,
  Lesson,
  LessonType,
  GraphMode,
  saveLessons,
} from "@/lib/lessons"

function buildVideoUrl(fileName: string) {
  const base =
    process.env.NEXT_PUBLIC_VIDEO_BASE_URL ?? "https://toniweb.b-cdn.net"
  return `${base}/${fileName.replace(/^\/+/, "")}`
}

export default function AdminDashboard() {
  const [text, setText] = useState("")
  const [phonemes, setPhonemes] = useState("")
  const [words, setWords] = useState("")
  const [videoFile, setVideoFile] = useState("")
  const [type, setType] = useState<LessonType>("vowel")
  const [graphMode, setGraphMode] = useState<GraphMode>("f1f2")
  const [message, setMessage] = useState("")

  const lessonsCount = useMemo(() => {
    if (typeof window === "undefined") return DEFAULT_LESSONS.length

    const raw = localStorage.getItem(LESSONS_STORAGE_KEY)
    if (!raw) return DEFAULT_LESSONS.length

    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.length : DEFAULT_LESSONS.length
    } catch {
      return DEFAULT_LESSONS.length
    }
  }, [message])

  const handleSaveLesson = () => {
    const phonemeList = phonemes
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)

    const wordList = words
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean)

    if (!text.trim() || !videoFile.trim()) {
      setMessage("Preencha a frase e o vídeo.")
      return
    }

    if (phonemeList.length === 0 || wordList.length === 0) {
      setMessage("Preencha fonemas e palavras.")
      return
    }

    const targets = phonemeList.map((phoneme, index) => ({
      phoneme,
      word: wordList[index] ?? wordList[wordList.length - 1] ?? "",
    }))

    const newLesson: Lesson = {
      id: String(Date.now()),
      text: text.trim(),
      type,
      graphMode,
      videoUrl: buildVideoUrl(videoFile.trim()),
      targets,
    }

    const raw = localStorage.getItem(LESSONS_STORAGE_KEY)
    let currentLessons = DEFAULT_LESSONS

    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          currentLessons = parsed
        }
      } catch {}
    }

    saveLessons([...currentLessons, newLesson])

    setText("")
    setPhonemes("")
    setWords("")
    setVideoFile("")
    setType("vowel")
    setGraphMode("f1f2")
    setMessage("Lição salva localmente com sucesso.")
  }

  const resetLessons = () => {
    saveLessons(DEFAULT_LESSONS)
    setMessage("Lições restauradas para a base padrão.")
  }

  return (
    <div className="p-6 space-y-6 bg-white h-full border-r">
      <header>
        <h1 className="text-xl font-bold italic text-blue-600 uppercase tracking-tighter">
          ToniWeb Admin
        </h1>
        <p className="text-[10px] uppercase font-bold text-slate-400">
          Painel Pedagógico
        </p>
      </header>

      <Card className="border-2 shadow-none">
        <CardHeader className="bg-slate-50 border-b p-3">
          <CardTitle className="text-[10px] font-black uppercase">
            Editor de Conteúdo
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase">
              Frase do Exercício
            </Label>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ex: The bag is big."
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase">
              Vídeo
            </Label>
            <Input
              value={videoFile}
              onChange={(e) => setVideoFile(e.target.value)}
              placeholder="Ex: 63.mp4"
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase">
              Fonemas-alvo
            </Label>
            <Input
              value={phonemes}
              onChange={(e) => setPhonemes(e.target.value)}
              placeholder="Ex: æ, ɪ"
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase">
              Palavras-alvo
            </Label>
            <Input
              value={words}
              onChange={(e) => setWords(e.target.value)}
              placeholder="Ex: bag, big, is"
              className="h-9 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase">
                Tipo de Análise
              </Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as LessonType)}
                className="w-full h-9 px-3 rounded-md border text-xs"
              >
                <option value="vowel">Vogal</option>
                <option value="fricative">Fricativa</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase">
                Gráfico
              </Label>
              <select
                value={graphMode}
                onChange={(e) => setGraphMode(e.target.value as GraphMode)}
                className="w-full h-9 px-3 rounded-md border text-xs"
              >
                <option value="f1f2">F1 x F2</option>
                <option value="pitch">Pitch</option>
              </select>
            </div>
          </div>

          <Button
            onClick={handleSaveLesson}
            className="w-full bg-blue-600 font-bold uppercase text-[10px]"
          >
            <Plus className="mr-2 h-4 w-4" /> Salvar Lição
          </Button>

          <Button
            onClick={resetLessons}
            variant="outline"
            className="w-full font-bold uppercase text-[10px]"
          >
            <Save className="mr-2 h-4 w-4" /> Restaurar Base Padrão
          </Button>

          <div className="text-[11px] rounded-lg bg-slate-50 border p-3 text-slate-600">
            Total de lições locais: <strong>{lessonsCount}</strong>
          </div>

          {message && (
            <div className="text-[11px] rounded-lg bg-blue-50 border border-blue-200 p-3 text-blue-700">
              {message}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-2 shadow-none bg-slate-50">
        <CardHeader className="bg-slate-900 text-white p-3">
          <CardTitle className="text-[10px] font-black uppercase flex items-center gap-2">
            <Scissors className="h-3 w-3" /> Calibração (Mini-Praat)
          </CardTitle>
        </CardHeader>

        <CardContent className="p-10 text-center">
          <Activity className="h-8 w-8 mx-auto text-slate-300 mb-2 animate-pulse" />
          <p className="text-[10px] text-slate-400 uppercase font-bold">
            Aguardando áudio nativo...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}