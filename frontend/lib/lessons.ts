export type LessonType = "vowel" | "fricative"
export type GraphMode = "pitch" | "f1f2"

export interface LessonTarget {
  phoneme: string
  word: string
}

export interface Lesson {
  id: string
  text: string
  type: LessonType
  graphMode: GraphMode
  videoUrl: string
  targets: LessonTarget[]
}

const VIDEO_BASE_URL =
  process.env.NEXT_PUBLIC_VIDEO_BASE_URL ?? "https://toniweb.b-cdn.net"

export const DEFAULT_LESSONS: Lesson[] = [
  {
    id: "04",
    text: "Read it now.",
    type: "vowel",
    graphMode: "f1f2",
    videoUrl: `${VIDEO_BASE_URL}/04.mp4`,
    targets: [{ phoneme: "iː", word: "read" }],
  },
  {
    id: "06",
    text: "Red is nice.",
    type: "vowel",
    graphMode: "f1f2",
    videoUrl: `${VIDEO_BASE_URL}/06.mp4`,
    targets: [{ phoneme: "ɪ", word: "is" }],
  },
  {
    id: "07",
    text: "This road is really quiet today.",
    type: "vowel",
    graphMode: "f1f2",
    videoUrl: `${VIDEO_BASE_URL}/07.mp4`,
    targets: [
      { phoneme: "iː", word: "really" },
      { phoneme: "ɪ", word: "is" },
    ],
  },
  {
    id: "14",
    text: "Bring it here.",
    type: "vowel",
    graphMode: "f1f2",
    videoUrl: `${VIDEO_BASE_URL}/14.mp4`,
    targets: [
      { phoneme: "ɪ", word: "bring" },
      { phoneme: "ɪ", word: "it" },
    ],
  },
  {
    id: "15",
    text: "Look at me.",
    type: "vowel",
    graphMode: "f1f2",
    videoUrl: `${VIDEO_BASE_URL}/15.mp4`,
    targets: [{ phoneme: "ʊ", word: "look" }],
  },
  {
    id: "16",
    text: "Leave it there.",
    type: "vowel",
    graphMode: "f1f2",
    videoUrl: `${VIDEO_BASE_URL}/16.mp4`,
    targets: [
      { phoneme: "iː", word: "leave" },
      { phoneme: "ɪ", word: "it" },
    ],
  },
  {
    id: "17",
    text: "Light the lamp.",
    type: "vowel",
    graphMode: "f1f2",
    videoUrl: `${VIDEO_BASE_URL}/17.mp4`,
    targets: [
      { phoneme: "æ", word: "lamp" },
      { phoneme: "ə", word: "the" },
    ],
  },
  {
    id: "21",
    text: "The black cat sat on the bag.",
    type: "vowel",
    graphMode: "f1f2",
    videoUrl: `${VIDEO_BASE_URL}/21.mp4`,
    targets: [
      { phoneme: "æ", word: "black" },
      { phoneme: "æ", word: "cat" },
      { phoneme: "æ", word: "sat" },
    ],
  },
  {
    id: "22",
    text: "Sam had a bad plan.",
    type: "vowel",
    graphMode: "f1f2",
    videoUrl: `${VIDEO_BASE_URL}/22.mp4`,
    targets: [
      { phoneme: "æ", word: "Sam" },
      { phoneme: "æ", word: "had" },
      { phoneme: "æ", word: "bad" },
      { phoneme: "æ", word: "plan" },
    ],
  },
  {
    id: "23",
    text: "The sun comes up suddenly.",
    type: "vowel",
    graphMode: "f1f2",
    videoUrl: `${VIDEO_BASE_URL}/23.mp4`,
    targets: [{ phoneme: "ə", word: "suddenly" }],
  },
  {
    id: "24",
    text: "Just trust us.",
    type: "vowel",
    graphMode: "f1f2",
    videoUrl: `${VIDEO_BASE_URL}/24.mp4`,
    targets: [{ phoneme: "ə", word: "us" }],
  },
  {
    id: "33",
    text: "Turn the first curve slowly.",
    type: "vowel",
    graphMode: "f1f2",
    videoUrl: `${VIDEO_BASE_URL}/33.mp4`,
    targets: [{ phoneme: "ə", word: "the" }],
  },
  {
    id: "55",
    text: "Help him hang the hat.",
    type: "vowel",
    graphMode: "f1f2",
    videoUrl: `${VIDEO_BASE_URL}/55.mp4`,
    targets: [
      { phoneme: "æ", word: "hang" },
      { phoneme: "æ", word: "hat" },
    ],
  },
  {
    id: "63",
    text: "The bag is big.",
    type: "vowel",
    graphMode: "f1f2",
    videoUrl: `${VIDEO_BASE_URL}/63.mp4`,
    targets: [
      { phoneme: "æ", word: "bag" },
      { phoneme: "ɪ", word: "big" },
      { phoneme: "ɪ", word: "is" },
    ],
  },
  {
    id: "fr_01",
    text: "Throw three strong sticks.",
    type: "fricative",
    graphMode: "pitch",
    videoUrl: `${VIDEO_BASE_URL}/65.mp4`,
    targets: [{ phoneme: "θ", word: "throw" }],
  },
  {
    id: "fr_02",
    text: "The vision was sharp.",
    type: "fricative",
    graphMode: "pitch",
    videoUrl: `${VIDEO_BASE_URL}/47.mp4`,
    targets: [{ phoneme: "ʒ", word: "vision" }],
  },
  {
    id: "fr_03",
    text: "Sam had a bad plan.",
    type: "fricative",
    graphMode: "pitch",
    videoUrl: `${VIDEO_BASE_URL}/22.mp4`,
    targets: [{ phoneme: "h", word: "had" }],
  },
]

export const LESSONS_STORAGE_KEY = "toniweb_lessons"

export function loadLessons(): Lesson[] {
  if (typeof window === "undefined") return DEFAULT_LESSONS

  const raw = localStorage.getItem(LESSONS_STORAGE_KEY)
  if (!raw) return DEFAULT_LESSONS

  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
    }
    return DEFAULT_LESSONS
  } catch {
    return DEFAULT_LESSONS
  }
}

export function saveLessons(lessons: Lesson[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(LESSONS_STORAGE_KEY, JSON.stringify(lessons))
  window.dispatchEvent(new Event("toniweb-lessons-updated"))
}