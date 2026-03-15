import os
import json
import shutil
import numpy as np
import parselmouth
import subprocess
import imageio_ffmpeg as ffmpeg_exe

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pathlib import Path

app = FastAPI()

origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

NATIVE_AUDIO_PATH = Path("native_samples")
NATIVE_AUDIO_PATH.mkdir(exist_ok=True)

REFERENCE_VOWELS = {
    "iː": {"f1": 300, "f2": 2400},
    "ɪ": {"f1": 430, "f2": 2000},
    "æ": {"f1": 700, "f2": 1700},
    "ʊ": {"f1": 440, "f2": 1200},
    "ʌ": {"f1": 640, "f2": 1300},
    "ə": {"f1": 500, "f2": 1500},
}

FRICATIVE_REFS = {
    "s": 6000,
    "z": 5500,
    "sh": 4000,
    "zh": 4000,
    "f": 2000,
    "v": 2000,
    "th": 2500,
    "dh": 2500,
    "h": 1000,
    "θ": 2500,
    "ð": 2500,
    "ʒ": 4000,
}


@app.get("/")
def read_root():
    return {"status": "online", "system": "Pronunciation MVP Backend"}


def save_upload_file(upload_file: UploadFile, destination: Path) -> Path:
    try:
        with destination.open("wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
        return destination
    finally:
        upload_file.file.close()


def convert_to_pcm_wav(input_path: Path, output_path: Path):
    ffmpeg_path = ffmpeg_exe.get_ffmpeg_exe()
    command = [
        ffmpeg_path,
        "-y",
        "-i",
        str(input_path),
        "-vn",
        "-acodec",
        "pcm_s16le",
        "-ar",
        "44100",
        "-ac",
        "1",
        str(output_path),
    ]
    subprocess.run(
        command,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=True
    )


def safe_json_list(value: str | None):
    if not value:
        return []
    try:
        parsed = json.loads(value)
        if isinstance(parsed, list):
            return [str(v) for v in parsed]
    except Exception:
        pass
    return []


def extract_pitch_graph(sound: parselmouth.Sound):
    pitch = sound.to_pitch()
    times = pitch.xs()
    values = pitch.selected_array["frequency"]
    return [
        {"time": float(t), "pitch": float(v) if v > 0 else None}
        for t, v in zip(times, values)
    ]


def extract_formant_curve(sound: parselmouth.Sound, step: float = 0.02):
    """
    Extrai uma trajetória F1/F2 ao longo do tempo.
    Retorna vários pontos para formar curva, em vez de um único ponto.
    """
    try:
        formant = sound.to_formant_burg()
        duration = sound.get_total_duration()

        if duration <= 0:
            return []

        points = []
        time_value = 0.02

        while time_value < duration:
            f1 = formant.get_value_at_time(1, time_value)
            f2 = formant.get_value_at_time(2, time_value)

            if (
                f1 is not None and f2 is not None
                and not np.isnan(f1) and not np.isnan(f2)
                and 200 <= f1 <= 1200
                and 500 <= f2 <= 3500
            ):
                points.append({
                    "time": round(float(time_value), 3),
                    "f1": float(f1),
                    "f2": float(f2),
                })

            time_value += step

        return points
    except Exception as e:
        print(f"Erro extract_formant_curve: {e}")
        return []


def extract_stable_formants(sound: parselmouth.Sound):
    """
    Mantemos um ponto médio para score,
    mas o gráfico agora usará curvas.
    """
    curve = extract_formant_curve(sound)
    if not curve:
        return None

    mid = curve[len(curve) // 2]
    return {"f1": mid["f1"], "f2": mid["f2"]}


def score_from_formants(student_f1, student_f2, ref_f1, ref_f2):
    distance = np.sqrt((student_f1 - ref_f1) ** 2 + (student_f2 - ref_f2) ** 2)
    score = max(0, 100 - (distance / 15))
    return round(float(score), 1)


def analyze_vowel_pitch(sound_student, sound_native):
    try:
        pitch_student = sound_student.to_pitch()
        pitch_native = sound_native.to_pitch()

        vals_student = pitch_student.selected_array["frequency"]
        vals_student = vals_student[vals_student != 0]

        vals_native = pitch_native.selected_array["frequency"]
        vals_native = vals_native[vals_native != 0]

        if len(vals_student) == 0:
            return 0.0, "Não detectamos sua voz. Fale mais alto.", {}

        graph_data_student = extract_pitch_graph(sound_student)
        graph_data_native = extract_pitch_graph(sound_native)

        range_s = np.max(vals_student) - np.min(vals_student) if len(vals_student) else 0
        range_n = np.max(vals_native) - np.min(vals_native) if len(vals_native) else 0
        score = max(0, 100 - (abs(range_s - range_n) * 0.5))
        score = round(float(score), 1)

        return score, "Entonação processada com sucesso!", {
            "student_pitch": graph_data_student,
            "native_pitch": graph_data_native
        }
    except Exception as e:
        print(f"Erro analyze_vowel_pitch: {e}")
        return 0, "Erro na análise de pitch.", {}


def analyze_vowel_f1f2(sound_student, sound_native, phonemes, words):
    """
    Agora retorna:
    - curva da nativa
    - curva do usuário
    - pontos de referência
    - pontos do aluno
    """
    try:
        student_curve = extract_formant_curve(sound_student)
        native_curve = extract_formant_curve(sound_native)

        student_formants = extract_stable_formants(sound_student)
        if not student_formants:
            return 0, "Não foi possível extrair F1/F2 do áudio.", {
                "student_points": [],
                "reference_points": [],
                "student_curve": [],
                "native_curve": [],
            }

        student_points = []
        reference_points = []
        scores = []

        for idx, phoneme in enumerate(phonemes):
            word = words[idx] if idx < len(words) else f"alvo_{idx+1}"
            ref = REFERENCE_VOWELS.get(phoneme, {"f1": 500, "f2": 1500})

            ref_point = {
                "label": f"{word} ({phoneme})",
                "word": word,
                "phoneme": phoneme,
                "f1": float(ref["f1"]),
                "f2": float(ref["f2"]),
            }

            student_point = {
                "label": f"{word} ({phoneme})",
                "word": word,
                "phoneme": phoneme,
                "f1": float(student_formants["f1"]),
                "f2": float(student_formants["f2"]),
            }

            reference_points.append(ref_point)
            student_points.append(student_point)

            point_score = score_from_formants(
                student_point["f1"],
                student_point["f2"],
                ref_point["f1"],
                ref_point["f2"],
            )
            scores.append(point_score)

        final_score = round(float(np.mean(scores)), 1) if scores else 0

        if final_score >= 85:
            feedback = "Excelente proximidade acústica no espaço vocálico F1xF2."
        elif final_score >= 70:
            feedback = "Boa produção geral. Ainda há pequeno desvio em alguns alvos."
        else:
            feedback = "A produção ainda está distante do alvo acústico. Tente novamente."

        return final_score, feedback, {
            "student_points": student_points,
            "reference_points": reference_points,
            "student_curve": student_curve,
            "native_curve": native_curve,
        }

    except Exception as e:
        print(f"Erro analyze_vowel_f1f2: {e}")
        return 0, "Erro na análise F1xF2.", {
            "student_points": [],
            "reference_points": [],
            "student_curve": [],
            "native_curve": [],
        }


def analyze_fricative_spectrum(sound_student, target_phoneme):
    try:
        spectrum = sound_student.to_spectrum()
        cog = spectrum.get_centre_of_gravity(power=2.0)

        target = FRICATIVE_REFS.get(target_phoneme, 3000)
        score = max(0, 100 - (abs(cog - target) / 20))
        score = round(float(score), 1)

        band = "green" if score > 75 else "yellow" if score > 50 else "red"

        return score, f"Freq: {int(cog)}Hz | Alvo: {target}Hz", {
            "cog": float(cog),
            "band_color": band,
            "student_pitch": extract_pitch_graph(sound_student),
            "native_pitch": [],
        }
    except Exception as e:
        print(f"Erro analyze_fricative_spectrum: {e}")
        return 0, "Erro na análise fricativa.", {"band_color": "red"}


@app.post("/analyze")
async def analyze_audio(
    file: UploadFile = File(...),
    target_text: str = Form(...),
    target_type: str = Form(...),
    target_phoneme: str | None = Form(None),
    graph_mode: str | None = Form(None),
    target_phonemes: str | None = Form(None),
    target_words: str | None = Form(None),
):
    raw_path = UPLOAD_DIR / f"raw_{file.filename}"
    clean_path = UPLOAD_DIR / f"clean_{file.filename}.wav"

    save_upload_file(file, raw_path)

    try:
        convert_to_pcm_wav(raw_path, clean_path)
        snd_student = parselmouth.Sound(str(clean_path))

        phonemes = safe_json_list(target_phonemes)
        words = safe_json_list(target_words)

        if not phonemes and target_phoneme:
            phonemes = [target_phoneme]

        first_phoneme = phonemes[0] if phonemes else (target_phoneme or "")

        native_file = NATIVE_AUDIO_PATH / f"{first_phoneme}.wav"
        if native_file.exists():
            snd_native = parselmouth.Sound(str(native_file))
        else:
            snd_native = snd_student

        if target_type == "fricative":
            score, fb, det = analyze_fricative_spectrum(snd_student, first_phoneme)
            return JSONResponse({
                "type": "fricative",
                "score": score,
                "feedback": fb,
                "details": det
            })

        if graph_mode == "pitch":
            score, fb, det = analyze_vowel_pitch(snd_student, snd_native)
            return JSONResponse({
                "type": "vowel",
                "score": score,
                "feedback": fb,
                "details": det
            })

        score, fb, det = analyze_vowel_f1f2(snd_student, snd_native, phonemes, words)
        return JSONResponse({
            "type": "vowel",
            "score": score,
            "feedback": fb,
            "details": det
        })

    except Exception as e:
        print(f"ERRO BACKEND: {e}")
        return JSONResponse({
            "type": target_type,
            "score": 0,
            "feedback": "Erro técnico no áudio. Verifique o terminal.",
            "details": {"band_color": "red"}
        })
    finally:
        if raw_path.exists():
            os.remove(raw_path)
        if clean_path.exists():
            os.remove(clean_path)