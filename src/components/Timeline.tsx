import React, { useEffect, useMemo, useRef } from 'react'
import { RotateCw, Play, Pause } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { scenarios } from '../data/scenarios'
import { translations } from '../data/translations'
import { formatTimebarLabel, translateLiveText } from '../utils/helpers'
import { rgbaToCss, valueToSteppedColor } from '../utils/color'

export const Timeline: React.FC = () => {
  const timeline = useAppStore((state) => state.timeline)
  const selectedStationId = useAppStore((state) => state.selectedStationId)
  const frameIndex = useAppStore((state) => state.frameIndex)
  const scenarioId = useAppStore((state) => state.scenarioId)
  const isTimelinePlaying = useAppStore((state) => state.isTimelinePlaying)
  const showTimebarMetaPopup = useAppStore((state) => state.showTimebarMetaPopup)
  const isMobile = useAppStore((state) => state.isMobile)
  const showControls = useAppStore((state) => state.showControls)
  const isTimebarExpanded = useAppStore((state) => state.isTimebarExpanded)
  const lang = useAppStore((state) => state.lang)

  const setIsTimelinePlaying = useAppStore((state) => state.setIsTimelinePlaying)
  const setFrameIndex = useAppStore((state) => state.setFrameIndex)
  const setColumnReveal = useAppStore((state) => state.setColumnReveal)
  const setRefreshNonce = useAppStore((state) => state.setRefreshNonce)
  const refreshNonce = useAppStore((state) => state.refreshNonce)
  const setDataStatus = useAppStore((state) => state.setDataStatus)
  const setShowTimebarMetaPopup = useAppStore((state) => state.setShowTimebarMetaPopup)

  const metaPopupTimeoutRef = useRef<number | null>(null)

  // 1. Timeline play interval hook
  useEffect(() => {
    if (!isTimelinePlaying || timeline.length <= 1) {
      return
    }

    const isObs = ['temperature', 'humidity', 'wind', 'gust', 'pressure', 'rain', 'solar', 'sst', 'wave'].includes(scenarioId)

    const timer = window.setInterval(() => {
      setFrameIndex((value) => {
        if (isObs) {
          return (value - 1 + timeline.length) % timeline.length
        } else {
          return (value + 1) % timeline.length
        }
      })
    }, 1500)

    return () => window.clearInterval(timer)
  }, [isTimelinePlaying, timeline.length, setFrameIndex, scenarioId])

  // Cleanup meta popup timeout
  useEffect(() => {
    return () => {
      if (metaPopupTimeoutRef.current) {
        window.clearTimeout(metaPopupTimeoutRef.current)
      }
    }
  }, [])

  const handleMetaClick = () => {
    if (window.innerWidth > 768) return

    if (metaPopupTimeoutRef.current) {
      window.clearTimeout(metaPopupTimeoutRef.current)
      metaPopupTimeoutRef.current = null
    }

    if (showTimebarMetaPopup) {
      setShowTimebarMetaPopup(false)
    } else {
      setShowTimebarMetaPopup(true)
      metaPopupTimeoutRef.current = window.setTimeout(() => {
        setShowTimebarMetaPopup(false)
        metaPopupTimeoutRef.current = null
      }, 3000)
    }
  }

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

  const selectedTrendData = useMemo(() => {
    return timeline.map((frame, idx) => {
      const point = frame.points.find((p) => p.id === selectedStationId)
      return {
        value: point?.value ?? 0,
        label: frame.label,
        index: idx,
      }
    })
  }, [timeline, selectedStationId])

  const totalSteps = timeline.length > 1 ? timeline.length - 1 : 1
  const maxInTrend = Math.max(...selectedTrendData.map((d) => d.value), 0)
  const chartMin = activeScenario.minValue
  const chartMax = maxInTrend > chartMin
    ? Math.min(activeScenario.maxValue, Math.max(maxInTrend * 1.15, chartMin + 1.0))
    : activeScenario.maxValue
  const valRange = chartMax - chartMin
  const selectedStation = activeScenario.points.find((p) => p.id === selectedStationId) || activeScenario.points[0]
  const activePct = 2 + (activeFrameIndex / totalSteps) * 96
  const activeValColor = rgbaToCss(valueToSteppedColor(selectedStation?.value ?? activeScenario.minValue, activeScenario.palette, 255))

  if (!showControls || !useAppStore.getState().overlayVisibility.timeline || timeline.length < 1) {
    return null
  }

  const linePath = selectedTrendData
    .map((item, idx) => {
      const x = 2 + (idx / totalSteps) * 96
      const y = 80 - (valRange > 0 ? (item.value - chartMin) / valRange : 0.5) * 65
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')
  const areaPath = linePath ? `${linePath} L 98 100 L 2 100 Z` : ''

  return (
    <div className={`timebar-panel ${isTimebarExpanded ? '' : 'collapsed'}`} aria-label="기상 정보 시간 선택">
      {isMobile && (
        <button
          type="button"
          className="timebar-mobile-refresh"
          onClick={() => {
            setIsTimelinePlaying(false)
            const isObs = ['temperature', 'humidity', 'wind', 'gust', 'pressure', 'rain', 'solar', 'sst', 'wave'].includes(scenarioId)
            setFrameIndex(isObs ? timeline.length - 1 : 0)
            setColumnReveal(1)
            setDataStatus({ key: 'status_checking' })
            setRefreshNonce(refreshNonce + 1)
          }}
          title={translations[lang]['refresh'] || 'Refresh'}
        >
          <RotateCw size={13} />
        </button>
      )}
      
      <div className="timebar-chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 10px', marginBottom: '0px' }}>
        <span className="selected-station-badge" style={{ 
          fontSize: '10px', 
          fontWeight: 900, 
          color: '#ffffff', 
          backgroundColor: activeValColor, 
          padding: '1px 6px', 
          borderRadius: '3px',
          border: `1px solid ${activeValColor}`,
          boxShadow: '0 0 8px rgba(0,0,0,0.5)',
          textShadow: '0 1px 2px rgba(0,0,0,0.8)'
        }}>
          {selectedStation?.names?.[lang] || selectedStation?.name || (lang === 'vi' ? 'Trạm' : lang === 'en' ? 'Station' : '지점')} {translations[lang]['trendTitle'] || '실시간 추이'}
        </span>
      </div>
      
      {/* Responsive trend chart wrapper containing background & border */}
      <div className="trend-chart-wrapper">
        {/* SVG rendered with preserveAspectRatio="none" to stretch perfectly to 100% width */}
        <svg className="trend-chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={activeValColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {areaPath && <path d={areaPath} fill="url(#chart-area-grad)" />}
          {linePath && <path d={linePath} fill="none" stroke={activeValColor} strokeWidth="2" />}
        </svg>
        
        {/* Active vertical dashed line */}
        <div style={{
          position: 'absolute',
          left: `${activePct}%`,
          top: 0,
          bottom: 0,
          width: 0,
          borderLeft: '1px dashed rgba(255, 255, 255, 0.35)',
          pointerEvents: 'none',
          zIndex: 1
        }} />
        
        {/* HTML overlay for dots and value labels to prevent text distortion */}
        {selectedTrendData.map((item, idx) => {
          const pctX = 2 + (idx / totalSteps) * 96
          const pctY = 80 - (valRange > 0 ? (item.value - chartMin) / valRange : 0.5) * 65
          const isActive = idx === activeFrameIndex
          
          return (
            <div key={idx} style={{
              position: 'absolute',
              left: `${pctX}%`,
              top: `${pctY}%`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              {/* Value text placed above the dot */}
              <span style={{
                position: 'absolute',
                bottom: '7px',
                fontSize: '10px',
                fontWeight: '800',
                color: '#ffffff',
                textShadow: '0 1px 2px #0a121e, -1px -1px 0 #0a121e, 1px -1px 0 #0a121e, -1px 1px 0 #0a121e, 1px 1px 0 #0a121e',
                whiteSpace: 'nowrap'
              }}>
                {item.value}
              </span>
              
              {/* Dot */}
              <div style={{
                width: isActive ? '7px' : '4px',
                height: isActive ? '7px' : '4px',
                borderRadius: '50%',
                backgroundColor: isActive ? '#ffffff' : rgbaToCss(valueToSteppedColor(item.value, activeScenario.palette, 255)),
                border: '1.5px solid #111820',
                boxShadow: isActive ? '0 0 6px #ffffff' : 'none'
              }} />
            </div>
          )
        })}
      </div>
      
      {/* Timeline horizontal axis time labels row - aligned outside the chart box */}
      <div className="timebar-axis-row">
        {selectedTrendData.map((item, idx) => {
          const timePart = item.label.match(/\d{2}:\d{2}/)?.[0] || (item.label.includes('누적') ? (lang === 'ko' ? '누적' : lang === 'vi' ? 'Lũy kế' : 'Accum') : translateLiveText(item.label, lang))
          return (
            <span key={idx} style={{ left: `${2 + (idx / totalSteps) * 96}%` }}>
              {timePart}
            </span>
          )
        })}
      </div>
      
      <div className="timebar-controls-row">
        <button
          type="button"
          className="timeline-play"
          disabled={timeline.length <= 1}
          onClick={() => setIsTimelinePlaying(!isTimelinePlaying)}
          title={isTimelinePlaying ? (translations[lang]['timelinePause'] || '타임라인 정지') : (translations[lang]['timelinePlay'] || '타임라인 재생')}
        >
          {isTimelinePlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
        </button>
        {(() => {
          const { local, utc } = formatTimebarLabel(activeFrame?.updatedAt ?? activeScenario.updatedAt)
          return (
            <div className="timeline-meta" onClick={handleMetaClick} style={{ cursor: isMobile ? 'pointer' : 'default' }}>
              <strong>{translateLiveText(activeFrame?.label ?? '샘플', lang)}</strong>
              <span>{local} {utc && `| ${utc}`}</span>
              {isMobile && showTimebarMetaPopup && (
                <div className="timeline-meta-popup">
                  <span>{local} {utc && `| ${utc}`}</span>
                </div>
              )}
            </div>
          )
        })()}
        <input
          type="range"
          min={0}
          max={Math.max(timeline.length - 1, 0)}
          value={activeFrameIndex}
          disabled={timeline.length <= 1}
          onChange={(event) => {
            setFrameIndex(Number(event.target.value))
            setColumnReveal(1)
            setIsTimelinePlaying(false)
          }}
          style={{
            background: `linear-gradient(to right, #1a75ff 0%, #1a75ff ${activePct}%, #1b2d42 ${activePct}%, #1b2d42 100%)`
          }}
        />
      </div>
    </div>
  )
}
