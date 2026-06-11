import React from 'react'
import { Layers, X } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { mapThemes } from '../data/mapThemes'
import { translations } from '../data/translations'
import { overlayOptions } from '../utils/helpers'
import type { OverlayKey } from '../types'

export const MobileMapOptions: React.FC = () => {
  const shortcutChromeHidden = useAppStore((state) => state.shortcutChromeHidden)
  const mobileMapOptionsOpen = useAppStore((state) => state.mobileMapOptionsOpen)
  const lang = useAppStore((state) => state.lang)
  const mapTheme = useAppStore((state) => state.mapTheme)
  const is3DMode = useAppStore((state) => state.is3DMode)
  const regionLayer = useAppStore((state) => state.regionLayer)
  const overlayVisibility = useAppStore((state) => state.overlayVisibility)

  const setMobileMapOptionsOpen = useAppStore((state) => state.setMobileMapOptionsOpen)
  const setLang = useAppStore((state) => state.setLang)
  const setMapTheme = useAppStore((state) => state.setMapTheme)
  const setIs3DMode = useAppStore((state) => state.setIs3DMode)
  const setRegionLayer = useAppStore((state) => state.setRegionLayer)
  const setOverlayVisibility = useAppStore((state) => state.setOverlayVisibility)

  if (shortcutChromeHidden) return null

  const regionLayers: Array<{ id: typeof regionLayer; label: string }> = [
    { id: 'stations', label: '측정지점' },
    { id: 'regions', label: '광역지역' },
  ]

  const toggleOverlay = (key: OverlayKey) => {
    setOverlayVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <aside className={`mobile-map-options-sheet ${mobileMapOptionsOpen ? 'mobile-open' : ''}`}>
      <div className="mobile-sheet-drag-handle" />
      <div className="panel-heading">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={15} />
          <span>{lang === 'ko' ? '지도 및 표시 설정' : lang === 'vi' ? 'Cài đặt bản đồ & hiển thị' : 'Map & Display Options'}</span>
        </div>
        <button type="button" className="mobile-sheet-close" onClick={() => setMobileMapOptionsOpen(false)}>
          <X size={15} />
        </button>
      </div>
      
      <div className="mobile-sheet-body">
        {/* 0. Language Selection */}
        <div className="mobile-option-group">
          <h4>{translations[lang]['languageLabel'] || (lang === 'ko' ? '언어 설정' : lang === 'vi' ? 'Cài đặt ngôn ngữ' : 'Language')}</h4>
          <div className="mobile-capsule-row">
            <button
              type="button"
              className={`mobile-capsule-btn ${lang === 'vi' ? 'active' : ''}`}
              onClick={() => setLang('vi')}
            >
              Tiếng Việt (VI)
            </button>
            <button
              type="button"
              className={`mobile-capsule-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
            >
              English (EN)
            </button>
            <button
              type="button"
              className={`mobile-capsule-btn ${lang === 'ko' ? 'active' : ''}`}
              onClick={() => setLang('ko')}
            >
              한국어 (KO)
            </button>
          </div>
        </div>
        
        {/* 1. Map Theme Selection */}
        <div className="mobile-option-group">
          <h4>{lang === 'ko' ? '지도 스타일' : lang === 'vi' ? 'Kiểu bản đồ' : 'Map Style'}</h4>
          <div className="mobile-capsule-row">
            {mapThemes.map((item) => {
              const transKey = 'style' + item.id.charAt(0).toUpperCase() + item.id.slice(1)
              const isActive = item.id === mapTheme
              return (
                <button
                  type="button"
                  className={`mobile-capsule-btn ${isActive ? 'active' : ''}`}
                  key={item.id}
                  onClick={() => setMapTheme(item.id)}
                >
                  {translations[lang][transKey] || item.shortLabel}
                </button>
              )
            })}
          </div>
        </div>

        {/* 2. 3D Mode Toggle */}
        <div className="mobile-option-group">
          <h4>{lang === 'ko' ? '3D 입체 뷰' : lang === 'vi' ? 'Chế độ 3D' : '3D View Mode'}</h4>
          <div className="mobile-capsule-row">
            <button
              type="button"
              className={`mobile-capsule-btn ${is3DMode ? 'active' : ''}`}
              onClick={() => setIs3DMode(true)}
            >
              3D
            </button>
            <button
              type="button"
              className={`mobile-capsule-btn ${!is3DMode ? 'active' : ''}`}
              onClick={() => setIs3DMode(false)}
            >
              2D
            </button>
          </div>
        </div>

        {/* 3. Region Zoom Shortcuts */}
        <div className="mobile-option-group">
          <h4>{lang === 'ko' ? '화면 데이터 방식' : lang === 'vi' ? 'Phương thức dữ liệu' : 'Data View'}</h4>
          <div className="mobile-capsule-row">
            {regionLayers.map((item) => {
              const isActive = item.id === regionLayer
              return (
                <button
                  type="button"
                  className={`mobile-capsule-btn ${isActive ? 'active' : ''}`}
                  key={item.id}
                  onClick={() => setRegionLayer(item.id)}
                >
                  {translations[lang][item.id] || item.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* 4. Display Overlays Checkboxes */}
        <div className="mobile-option-group">
          <h4>{lang === 'ko' ? '화면 표시 항목' : lang === 'vi' ? 'Lớp hiển thị' : 'Display Overlays'}</h4>
          <div className="mobile-checkbox-list">
            {overlayOptions.map((item) => (
              <label className="mobile-checkbox-label" key={item.key}>
                <span>{translations[lang]['opt_' + item.key] || item.label}</span>
                <input
                  type="checkbox"
                  checked={overlayVisibility[item.key]}
                  onChange={() => toggleOverlay(item.key)}
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
