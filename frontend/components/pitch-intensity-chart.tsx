"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

type PitchDataPoint = {
  time: number
  pitch: number | null
}

type PitchIntensityChartProps = {
  studentData?: PitchDataPoint[]
  nativeData?: PitchDataPoint[]
}

export function PitchIntensityChart({
  studentData = [],
  nativeData = [],
}: PitchIntensityChartProps) {
  const safeNative = Array.isArray(nativeData) ? nativeData : []
  const safeStudent = Array.isArray(studentData) ? studentData : []

  if (safeNative.length === 0 && safeStudent.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">
        Sem dados de gráfico
      </div>
    )
  }

  return (
    <div className="w-full h-full min-h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />

          <XAxis
            dataKey="time"
            type="number"
            domain={["dataMin", "dataMax"]}
            label={{ value: "Tempo (s)", position: "insideBottom", offset: -5 }}
            hide
          />

          <YAxis
            domain={["auto", "auto"]}
            label={{ value: "Pitch (Hz)", angle: -90, position: "insideLeft" }}
            hide
          />

          <Tooltip
            labelFormatter={(val) => `Tempo: ${Number(val).toFixed(2)}s`}
            formatter={(value: number | string | null) => {
              if (value === null || value === undefined) {
                return ["-", "Pitch"]
              }

              const numericValue =
                typeof value === "number" ? value : Number(value)

              if (Number.isNaN(numericValue)) {
                return ["-", "Pitch"]
              }

              return [`${Math.round(numericValue)} Hz`, "Pitch"]
            }}
          />

          <Legend verticalAlign="top" height={36} />

          <Line
            data={safeNative}
            type="monotone"
            dataKey="pitch"
            name="Nativo"
            stroke="#0ea5e9"
            strokeWidth={3}
            dot={false}
            connectNulls
          />

          <Line
            data={safeStudent}
            type="monotone"
            dataKey="pitch"
            name="Você"
            stroke="#f97316"
            strokeWidth={3}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}