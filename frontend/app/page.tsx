"use client"

import { useState, useEffect } from "react"
import PronunciationPractice from "@/components/pronunciation-practice"
import AdminDashboard from "@/components/admin-dashboard"

type UserSession = {
  name: string
  isAdmin: boolean
} | null

export default function Home() {
  const [user, setUser] = useState<UserSession>(null)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    const savedName = localStorage.getItem("toniweb_user")
    const isAdmin = localStorage.getItem("toniweb_admin") === "true"

    if (savedName) {
      setUser({ name: savedName, isAdmin })
    }
  }, [])

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    const normalizedUsername = username.trim().toLowerCase()
    const normalizedPassword = password.trim()

    if (normalizedUsername === "admin" && normalizedPassword === "1234") {
      localStorage.setItem("toniweb_user", "Professor")
      localStorage.setItem("toniweb_admin", "true")
      setUser({ name: "Professor", isAdmin: true })
      setUsername("")
      setPassword("")
      return
    }

    if (normalizedUsername === "aluno" && normalizedPassword === "1234") {
      localStorage.setItem("toniweb_user", "Aluno")
      localStorage.setItem("toniweb_admin", "false")
      setUser({ name: "Aluno", isAdmin: false })
      setUsername("")
      setPassword("")
      return
    }

    setError("Usuário ou senha inválidos.")
  }

  const handleLogout = () => {
    localStorage.removeItem("toniweb_user")
    localStorage.removeItem("toniweb_admin")
    setUser(null)
    setUsername("")
    setPassword("")
    setError("")
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="bg-slate-800 p-8 rounded-xl border border-slate-700 w-full max-w-md shadow-2xl"
        >
          <h1 className="text-3xl font-black text-blue-500 mb-2 text-center italic tracking-tighter uppercase">
            TONIWEB
          </h1>

          <p className="text-slate-400 text-[10px] mb-6 text-center uppercase tracking-[0.2em] font-bold">
            Login simplificado
          </p>

          <div className="mb-4">
            <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">
              Usuário
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu usuário"
              className="w-full p-4 rounded bg-slate-700 text-white outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">
              Senha
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              className="w-full p-4 rounded bg-slate-700 text-white outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              required
            />
          </div>

          {error && (
            <div className="mb-4 rounded bg-red-500/10 border border-red-500/30 text-red-300 text-sm p-3">
              {error}
            </div>
          )}

          <button className="w-full bg-blue-600 hover:bg-blue-500 p-4 rounded font-black text-white uppercase tracking-widest transition-all">
            Entrar
          </button>

          <div className="mt-6 text-xs text-slate-400 bg-slate-900/50 border border-slate-700 rounded-lg p-4 space-y-1">
            <p>
              <span className="font-bold text-white">Admin:</span> admin / 1234
            </p>

            <p>
              <span className="font-bold text-white">Aluno:</span> aluno / 1234
            </p>
          </div>
        </form>
      </main>
    )
  }

  return (
    <div
      className={
        user.isAdmin
          ? "flex h-screen w-screen bg-slate-100 overflow-hidden"
          : "min-h-screen bg-white"
      }
    >
      {/* BOTÃO SAIR FIXO */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-lg"
        >
          Sair
        </button>
      </div>

      {user.isAdmin && (
        <aside className="w-[450px] h-full overflow-y-auto shadow-2xl z-10">
          <AdminDashboard />
        </aside>
      )}

      <main
        className={
          user.isAdmin
            ? "flex-1 h-full flex items-center justify-center bg-slate-200 p-8"
            : "w-full"
        }
      >
        <div
          className={
            user.isAdmin
              ? "w-[375px] h-[750px] bg-white rounded-[3rem] border-[12px] border-slate-900 shadow-2xl overflow-hidden relative"
              : "w-full relative"
          }
        >
          <PronunciationPractice isAdmin={user.isAdmin} />
        </div>
      </main>
    </div>
  )
}