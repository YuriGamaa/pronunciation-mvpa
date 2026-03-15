"use client"

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

type FormantPoint = {
  f1: number
  f2: number
}

type F1F2ChartProps = {
  student?: FormantPoint[]
  native?: FormantPoint[]
}

export function F1F2Chart({
  student = [],
  native = [],
}: F1F2ChartProps) {
  const safeStudent = Array.isArray(student) ? student : []
  const safeNative = Array.isArray(native) ? native : []

  if (!safeStudent.length && !safeNative.length) {
    return (
      <div className="flex items-center justify-center h-full w-full text-xs text-slate-400">
        Sem dados de formantes
      </div>
    )
  }

  return (
    <div className="w-full h-full min-h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid />

          <XAxis
            type="number"
            dataKey="f2"
            name="F2"
            domain={[500, 3000]}
            tick={{ fontSize: 10 }}
            label={{ value: "F2", position: "bottom" }}
          />

          <YAxis
            type="number"
            dataKey="f1"
            name="F1"
            domain={[200, 1000]}
            reversed
            tick={{ fontSize: 10 }}
            label={{ value: "F1", angle: -90, position: "left" }}
          />

          <Tooltip
            formatter={(_value: unknown, _name: unknown, item: any) => {
              const payload = item?.payload
              if (!payload) return ["-", ""]
              return [
                `F1: ${Math.round(payload.f1)} | F2: ${Math.round(payload.f2)}`,
                "Formantes",
              ]
            }}
            labelFormatter={() => ""}
          />

          <Legend />

          <Scatter
            name="Nativo"
            data={safeNative}
            fill="#0ea5e9"
          />

          <Scatter
            name="Aluno"
            data={safeStudent}
            fill="#f97316"
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}