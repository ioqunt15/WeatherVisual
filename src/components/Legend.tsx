import React, { useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import { scenarios } from '../data/scenarios'
import { createLegendTicks } from '../utils/helpers'

export const Legend: React.FC = () => {
  const overlayVisibility = useAppStore((state) => state.overlayVisibility)
  const isMobile = useAppStore((state) => state.isMobile)
  const scenarioId = useAppStore((state) => state.scenarioId)
  const timeline = useAppStore((state) => state.timeline)
  const frameIndex = useAppStore((state) => state.frameIndex)

  const scenario = useMemo(
    () => scenarios.find((item) => item.id === scenarioId) ?? scenarios[0],
    [scenarioId],
  )

  const activeFrameIndex = Math.min(frameIndex, Math.max(timeline.length - 1, 0))
  const activeFrame = timeline[activeFrameIndex]
  const activeScenario = useMemo(
    () => ({
      ...scenario,
      updatedAt: activeFrame?.updatedAt ?? scenario.updatedAt,
      source: activeFrame?.source ?? scenario.source,
      points: activeFrame?.points ?? scenario.points,
    }),
    [activeFrame, scenario],
  )

  const legendTicks = useMemo(() => createLegendTicks(activeScenario), [activeScenario])

  if (!overlayVisibility.legend) return null

  return (
    <div className={`legend ${isMobile ? 'mobile-vertical' : ''}`} aria-label="범례">
      {isMobile ? (
        // 모바일 세로 범례: [단위(상단) + 본문(하단: 램프(좌) + 레이블(우))] 구조
        <>
          {activeScenario.unit && (
            <div className="legend-mobile-unit">{activeScenario.unit}</div>
          )}
          <div className="legend-mobile-body">
            <div
              className="legend-ramp"
              style={{ gridTemplateRows: `repeat(${activeScenario.palette.length}, minmax(0, 1fr))` }}
            >
              {activeScenario.palette.map(([stop, color]) => (
                <i key={stop} style={{ backgroundColor: color }} />
              ))}
            </div>
            <div className="legend-labels">
              {legendTicks.map((tick, index) => {
                const labelText = tick.label.endsWith(activeScenario.unit)
                  ? tick.label.slice(0, -activeScenario.unit.length)
                  : tick.label
                return (
                  <span
                    key={`${tick.position}-${tick.label}`}
                    style={{
                      bottom: `${tick.position}%`,
                      transform:
                        index === 0
                          ? 'translateY(50%)'
                          : index === legendTicks.length - 1
                            ? 'translateY(-50%)'
                            : 'translateY(-50%)',
                    }}
                  >
                    {labelText}
                  </span>
                )
              })}
            </div>
          </div>
        </>
      ) : (
        // 데스크톱 가로 범례
        <>
          <div className="legend-labels">
            {legendTicks.map((tick, index) => (
              <span
                key={`${tick.position}-${tick.label}`}
                style={{
                  left: `${tick.position}%`,
                  transform:
                    index === 0
                      ? 'translateX(0)'
                      : index === legendTicks.length - 1
                        ? 'translateX(-100%)'
                        : 'translateX(-50%)',
                }}
              >
                {tick.label}
              </span>
            ))}
          </div>
          <div
            className="legend-ramp"
            style={{ gridTemplateColumns: `repeat(${activeScenario.palette.length}, minmax(0, 1fr))` }}
          >
            {activeScenario.palette.map(([stop, color]) => (
              <i key={stop} style={{ backgroundColor: color }} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
