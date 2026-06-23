import React, { useMemo } from 'react'
import { RotateCw, BarChart3 } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { scenarios } from '../data/scenarios'
import type { DisasterScenario } from '../data/scenarios'
import { translations } from '../data/translations'
import { historicalTyphoons } from '../data/typhoons'
import { buildRegionalFeatures, getHistoricalTyphoonPathData } from '../utils/helpers'
import { rgbaToCss, valueToSteppedColor } from '../utils/color'

export const RankPanel: React.FC = () => {
  const overlayVisibility = useAppStore((state) => state.overlayVisibility)
  const shortcutChromeHidden = useAppStore((state) => state.shortcutChromeHidden)
  const scenarioId = useAppStore((state) => state.scenarioId)
  const timeline = useAppStore((state) => state.timeline)
  const frameIndex = useAppStore((state) => state.frameIndex)
  const lang = useAppStore((state) => state.lang)
  const mobileBoardOpen = useAppStore((state) => state.mobileBoardOpen)
  const selectedTyphoonId = useAppStore((state) => state.selectedTyphoonId)
  const selectedYear = useAppStore((state) => state.selectedYear)
  const overlayWind = useAppStore((state) => state.overlayWind)
  const selectedStationId = useAppStore((state) => state.selectedStationId)
  const vietnamGeoJson = useAppStore((state) => state.vietnamGeoJson)
  const regionLayer = useAppStore((state) => state.regionLayer)

  const setSelectedYear = useAppStore((state) => state.setSelectedYear)
  const setSelectedTyphoonId = useAppStore((state) => state.setSelectedTyphoonId)
  const setIsTimelinePlaying = useAppStore((state) => state.setIsTimelinePlaying)
  const setOverlayWind = useAppStore((state) => state.setOverlayWind)
  const setSelectedStationId = useAppStore((state) => state.setSelectedStationId)

  const scenario = useMemo(
    () => scenarios.find((item) => item.id === scenarioId) ?? scenarios[0],
    [scenarioId],
  )

  const activeFrameIndex = Math.min(frameIndex, Math.max(timeline.length - 1, 0))
  const activeFrame = timeline[activeFrameIndex]
  const activeScenario = useMemo(() => {
    if (scenario.id === 'typhoon' && selectedTyphoonId === 'live') {
      const gustScenario = scenarios.find((s) => s.id === 'gust') || scenario
      return {
        ...gustScenario,
        id: 'typhoon' as const,
        title: scenario.title,
        headline: scenario.headline,
        subtitle: scenario.subtitle,
        updatedAt: activeFrame?.updatedAt ?? scenario.updatedAt,
        source: activeFrame?.source ?? scenario.source,
        points: activeFrame?.points ?? scenario.points,
      } as DisasterScenario
    }
    return {
      ...scenario,
      updatedAt: activeFrame?.updatedAt ?? scenario.updatedAt,
      source: activeFrame?.source ?? scenario.source,
      points: activeFrame?.points ?? scenario.points,
    } as DisasterScenario
  }, [activeFrame, scenario, selectedTyphoonId])

  const regionalFeatures = useMemo(
    () => buildRegionalFeatures(vietnamGeoJson, activeScenario),
    [activeScenario, vietnamGeoJson],
  )

  const typhoonData = useMemo(() => {
    if (scenario.id === 'typhoon') {
      if (selectedTyphoonId === 'live') {
        return {
          lat: 0,
          lon: 0,
          wind: 0,
          pressure: 0,
          speedMovement: 0,
          dirMovement: { ko: '없음', vi: 'Không có', en: 'None' },
          windRadius: 0,
          pathData: {
            currentCenter: [0, 0] as [number, number],
            history: [] as [number, number][],
            forecast: [] as [number, number][],
            cones: [] as { center: [number, number]; radiusKm: number }[]
          }
        }
      }

      const typhoon = historicalTyphoons.find(t => t.id === selectedTyphoonId) || historicalTyphoons[0]
      const frameIdx = frameIndex < typhoon.points.length ? frameIndex : 0
      const currentPoint = typhoon.points[frameIdx]
      const pathData = getHistoricalTyphoonPathData(typhoon, frameIdx)
      
      return {
        lat: currentPoint.lat,
        lon: currentPoint.lon,
        wind: currentPoint.wind,
        pressure: currentPoint.pressure,
        windRadius: currentPoint.windRadius || 200,
        speedMovement: currentPoint.speedMovement || 15,
        dirMovement: currentPoint.dirMovement || { ko: '서북서', vi: 'Tây Tây Bắc', en: 'WNW' },
        pathData
      }
    }
    return null
  }, [scenario.id, selectedTyphoonId, frameIndex])

  const topPoints = useMemo(
    () => {
      const points =
        regionLayer === 'regions'
          ? regionalFeatures.map((feature) => ({
              id: feature.properties.id,
              name: feature.properties.label,
              names: {
                vi: translations['vi'][feature.properties.id] || feature.properties.label,
                en: translations['en'][feature.properties.id] || feature.properties.label,
                ko: translations['ko'][feature.properties.id] || feature.properties.label,
              },
              value: feature.properties.value,
            }))
          : activeScenario.points.filter((pt) => !(pt as any).isExtra)

      return [...points]
        .filter(() => true)
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
    },
    [activeScenario, regionLayer, regionalFeatures],
  )

  if (!overlayVisibility.rank || shortcutChromeHidden || timeline.length < 1) return null

  if (activeScenario.id === 'typhoon') {
    return (
      <aside className={`typhoon-board-panel ${mobileBoardOpen ? 'mobile-open' : ''}`} aria-label={lang === 'ko' ? '태풍 정보 보드' : lang === 'vi' ? 'Thông tin bão' : 'Typhoon Status Board'}>
        <div className="mobile-sheet-drag-handle" />
        <div className="panel-heading">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RotateCw size={15} className="spin-icon" style={{ animation: 'spin 4s linear infinite' }} />
            <span>
              {selectedTyphoonId === 'live'
                ? (lang === 'ko' ? '실시간 태풍 감시' : lang === 'vi' ? 'GIÁM SÁT BÃO LIVE' : 'LIVE TYPHOON MONITORING')
                : (lang === 'ko' ? '과거 태풍 분석' : lang === 'vi' ? 'PHÂN TÍCH BÃO LỊCH SỬ' : 'HISTORICAL TYPHOON ANALYSIS')}
            </span>
          </div>
        </div>
        <div className="typhoon-board-body">
          <div className="typhoon-search-board" style={{ borderBottom: '1px solid rgba(255, 23, 68, 0.25)', paddingBottom: '8px', marginBottom: '4px' }}>
            <div className="typhoon-select-row" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <div className="select-field" style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '9px', color: 'rgba(255,255,255,0.6)', marginBottom: '2px', fontWeight: 'bold' }}>
                  {lang === 'ko' ? '연도' : lang === 'vi' ? 'Năm' : 'Year'}
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    const year = Number(e.target.value)
                    setSelectedYear(year)
                    const ofYear = historicalTyphoons.filter(t => t.year === year)
                    if (ofYear.length > 0) {
                      setSelectedTyphoonId(ofYear[0].id)
                      setIsTimelinePlaying(false)
                    }
                  }}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    color: '#ffffff',
                    borderRadius: '3px',
                    fontSize: '11px',
                    padding: '3px',
                    cursor: 'pointer'
                  }}
                >
                  <option value={2024} style={{ background: '#0b131e', color: '#fff' }}>2024</option>
                  <option value={2022} style={{ background: '#0b131e', color: '#fff' }}>2022</option>
                  <option value={2020} style={{ background: '#0b131e', color: '#fff' }}>2020</option>
                </select>
              </div>

              <div className="select-field" style={{ flex: 2 }}>
                <label style={{ display: 'block', fontSize: '9px', color: 'rgba(255,255,255,0.6)', marginBottom: '2px', fontWeight: 'bold' }}>
                  {lang === 'ko' ? '과거 기록 검색' : lang === 'vi' ? 'Cơ sở dữ liệu bão' : 'Historical Archive'}
                </label>
                <select
                  value={selectedTyphoonId === 'live' ? '' : selectedTyphoonId}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedTyphoonId(e.target.value)
                      setIsTimelinePlaying(false)
                    }
                  }}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    color: '#ffffff',
                    borderRadius: '3px',
                    fontSize: '11px',
                    padding: '3px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="" disabled style={{ background: '#0b131e', color: '#888' }}>
                    {lang === 'ko' ? '-- 태풍 선택 --' : lang === 'vi' ? '-- Chọn cơn bão --' : '-- Select Typhoon --'}
                  </option>
                  {historicalTyphoons
                    .filter(t => t.year === selectedYear)
                    .map(t => (
                      <option key={t.id} value={t.id} style={{ background: '#0b131e', color: '#fff' }}>
                        {t.name[lang] || t.name.en}
                      </option>
                    ))
                  }
                </select>
              </div>
            </div>

            <div className="wind-overlay-row" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '4px 0 0' }}>
              <input
                type="checkbox"
                id="overlay-wind-checkbox"
                checked={overlayWind}
                onChange={(e) => setOverlayWind(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="overlay-wind-checkbox" style={{ fontSize: '11px', color: '#f7f9fc', cursor: 'pointer', fontWeight: 800 }}>
                {lang === 'ko' ? '바람장 레이어 중첩 표시' : lang === 'vi' ? 'Chồng lớp trường gió' : 'Overlay Wind Layer'}
              </label>
            </div>
          </div>

          {selectedTyphoonId === 'live' ? (
            <div className="typhoon-status-msg" style={{ 
              background: 'rgba(100, 255, 180, 0.04)', 
              border: '1px dashed rgba(100, 255, 180, 0.25)', 
              padding: '12px 10px', 
              borderRadius: '4px',
              textAlign: 'center',
              marginTop: '5px'
            }}>
              <div style={{ fontSize: '12.5px', color: '#a3f3d2', fontWeight: 900, marginBottom: '6px' }}>
                ✔ {lang === 'ko' ? '기상 안정 상태' : lang === 'vi' ? 'Trạng thái thời tiết ổn định' : 'Weather Stable'}
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: 'rgba(240,248,255,0.78)', lineHeight: 1.45 }}>
                {lang === 'ko' 
                  ? '현재 베트남 및 감시 해역 내에 활동 중인 실시간 태풍이 없습니다. 분석하고 싶은 과거 기록을 검색해 조회할 수 있습니다.' 
                  : lang === 'vi' 
                  ? 'Hiện tại không có cơn bão nào hoạt động trong vùng biển Việt Nam. Bạn có thể tra cứu bão lịch sử từ thanh tìm kiếm.' 
                  : 'No active typhoons in the monitoring area. You can look up past storm records using the search filter above.'}
              </p>
            </div>
          ) : (
            typhoonData && (
              <>
                <div className="typhoon-name-row">
                  <h3>{historicalTyphoons.find(t => t.id === selectedTyphoonId)?.name[lang]}</h3>
                  <span className="danger-badge">{historicalTyphoons.find(t => t.id === selectedTyphoonId)?.category[lang]}</span>
                </div>
                <div className="typhoon-stats-grid">
                  <div className="typhoon-stat-item" style={{ gridColumn: 'span 2' }}>
                    <span className="stat-label">{lang === 'ko' ? '태풍 발생기간' : lang === 'vi' ? 'Thời gian hoạt động' : 'Duration'}</span>
                    <span className="stat-value">{historicalTyphoons.find(t => t.id === selectedTyphoonId)?.duration[lang]}</span>
                  </div>
                  <div className="typhoon-stat-item">
                    <span className="stat-label">{lang === 'ko' ? '해당 지점' : lang === 'vi' ? 'Địa điểm' : 'Location'}</span>
                    <span className="stat-value">{typhoonData.lat.toFixed(1)}°N, {typhoonData.lon.toFixed(1)}°E</span>
                  </div>
                  <div className="typhoon-stat-item">
                    <span className="stat-label">{lang === 'ko' ? '중심 기압' : lang === 'vi' ? 'Khí áp trung tâm' : 'Min Pressure'}</span>
                    <span className="stat-value">{typhoonData.pressure} hPa</span>
                  </div>
                  <div className="typhoon-stat-item">
                    <span className="stat-label">{lang === 'ko' ? '최대 풍속' : lang === 'vi' ? 'Gió mạnh nhất' : 'Max Wind'}</span>
                    <span className="stat-value">{typhoonData.wind} m/s</span>
                  </div>
                  <div className="typhoon-stat-item">
                    <span className="stat-label">{lang === 'ko' ? '폭풍 반경' : lang === 'vi' ? 'Bán kính bão' : 'Storm Radius'}</span>
                    <span className="stat-value">{typhoonData.windRadius} km</span>
                  </div>
                  <div className="typhoon-stat-item" style={{ gridColumn: 'span 2' }}>
                    <span className="stat-label">{lang === 'ko' ? '이동 방향 및 속도' : lang === 'vi' ? 'Tốc độ & Hướng di chuyển' : 'Movement'}</span>
                    <span className="stat-value">{typhoonData.dirMovement[lang] || typhoonData.dirMovement.en} {typhoonData.speedMovement} km/h</span>
                  </div>
                </div>
                <div className="typhoon-warning-box">
                  <strong>{lang === 'ko' ? '태풍 정보 요약:' : lang === 'vi' ? 'Thông tin tóm tắt:' : 'Typhoon Summary:'}</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '10.5px', lineHeight: '1.4', color: 'rgba(244,248,255,0.85)' }}>
                    {historicalTyphoons.find(t => t.id === selectedTyphoonId)?.details[lang]}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTyphoonId('live')
                    setIsTimelinePlaying(false)
                  }}
                  style={{
                    width: '100%',
                    background: '#ff1744',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 10px',
                    borderRadius: '3px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginTop: '4px',
                    textAlign: 'center',
                    transition: 'background 0.2s',
                    boxShadow: '0 4px 10px rgba(255,23,68,0.2)'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#d50000')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#ff1744')}
                >
                  ◀ {lang === 'ko' ? '실시간 감시 모드로 복귀' : lang === 'vi' ? 'Trở về giám sát trực tiếp' : 'Return to Live Monitoring'}
                </button>
              </>
            )
          )}
        </div>
      </aside>
    )
  }

  return (
    <aside className={`rank-panel ${mobileBoardOpen ? 'mobile-open' : ''}`} aria-label={translations[lang]['rank'] || '주요 지점'}>
      <div className="mobile-sheet-drag-handle" />
      <div className="panel-heading">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BarChart3 size={15} />
          <span>{translations[lang][activeScenario.id] || activeScenario.metric}</span>
        </div>
      </div>
      {topPoints.map((point, index) => {
        const valueColor = rgbaToCss(valueToSteppedColor(point.value, activeScenario.palette, 255))
        const valueRange = activeScenario.maxValue - activeScenario.minValue
        const percent = valueRange > 0 ? ((point.value - activeScenario.minValue) / valueRange) * 100 : 50
        const clPercent = Math.max(2, Math.min(100, percent))
        const isActive = selectedStationId === point.id

        return (
          <div 
            className={`rank-row-container ${isActive ? 'active' : ''}`} 
            key={point.id}
            onClick={() => setSelectedStationId(point.id)}
            style={{ cursor: 'pointer' }}
          >
            <div className="rank-row">
              <span>{String(index + 1).padStart(2, '0')}</span>
              <b>{point.names?.[lang] || point.name}</b>
              <strong style={{ color: valueColor }}>
                {point.value}
                <small>{activeScenario.unit}</small>
              </strong>
            </div>
            <div className="rank-bar-bg">
              <div className="rank-bar-fill" style={{ width: `${clPercent}%`, backgroundColor: valueColor }} />
            </div>
          </div>
        )
      })}
    </aside>
  )
}
