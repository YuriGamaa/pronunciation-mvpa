# Pronunciation MVP (Toniweb) — FastAPI + Next.js

MVP para prática de pronúncia com **gravação no navegador** e **análise acústica** no backend.

- **Frontend:** Next.js (App Router) + Tailwind + Recharts
- **Backend:** FastAPI + Praat/Parselmouth + FFmpeg (via `imageio-ffmpeg`)

## Arquitetura

1. O usuário grava áudio no browser (Web API `MediaRecorder`).
2. O frontend envia o áudio para `POST /analyze` (multipart/form-data).
3. O backend converte para WAV PCM (compatível com Praat) e calcula:
   - **Vogais:** comparação de pitch (F0) vs amostra nativa (quando existe)
   - **Fricativas:** centro de gravidade do espectro (estimativa simples)

## Rodando localmente

### 1) Backend (FastAPI)

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
# opcional: ajustar CORS via .env (exemplo em .env.example)
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Swagger:
- http://127.0.0.1:8000/docs

### 2) Frontend (Next.js)

```bash
cd frontend

# escolha um gerenciador:
npm install
# ou: pnpm install

# crie o .env.local com base no exemplo
# (no Windows: copy .env.example .env.local)
# (macOS/Linux: cp .env.example .env.local)

npm run dev
# ou: pnpm dev
```

App:
- http://localhost:3000

## Configuração via variáveis de ambiente

### Frontend
- `NEXT_PUBLIC_API_BASE_URL` (ex.: `http://127.0.0.1:8000`)

### Backend
- `CORS_ORIGINS` (lista separada por vírgula)
- `PORT` (opcional, se você for criar comando de start)

## Pastas importantes

- `frontend/` — UI e gravação de áudio
- `backend/` — API e processamento acústico
- `backend/native_samples/` — amostras nativas (.wav) usadas como referência (se aplicável)
- `backend-toniweb/` — versão simplificada/legada do backend (opcional)

## Publicando no GitHub (repositório público)

**Antes de subir, confirme que não há dados sensíveis** (chaves, tokens, áudios pessoais, etc.).

1. Limpeza (não versionar dependências/ambientes):
   - `backend/.venv/` ✅ ignorado no `.gitignore`
   - `frontend/node_modules/` ✅ ignorado
   - `frontend/.next/` ✅ ignorado

2. Comandos típicos:

```bash
git init
git add .
git commit -m "Initial commit"

# Crie o repositório no GitHub (público) e depois:
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git push -u origin main
```

## Licença

Escolha uma licença antes de tornar público (ex.: MIT). Veja `LICENSE` quando adicionar.
