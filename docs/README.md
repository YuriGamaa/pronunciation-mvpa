# Pronunciation MVP — Entonation Analysis

## O que este MVP faz
Este sistema permite comparar aspectos de entonação (pitch/F0) da fala de um estudante com uma fala nativa.

O MVP é capaz de:
- Extrair o pitch (F0) real da fala do aluno e da nativa
- Comparar alcance melódico de forma simples
- Exibir gráficos comparativos
- Gerar feedback pedagógico automático (heurístico)

## Tecnologias
- Frontend: Next.js + Recharts
- Backend: FastAPI + Parselmouth + FFmpeg
- Análise acústica real (não mock)

## Como rodar localmente

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # macOS/Linux

pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Acesse:
- Frontend: http://localhost:3000
- Backend (Swagger): http://127.0.0.1:8000/docs
