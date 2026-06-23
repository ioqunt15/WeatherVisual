import React, { useState, useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { scenarios } from '../data/scenarios'
import { translations } from '../data/translations'
import { categories, scenarioIcon } from '../utils/helpers'

export const Sidebar: React.FC = () => {
  const showControls = useAppStore((state) => state.showControls)
  const shortcutChromeHidden = useAppStore((state) => state.shortcutChromeHidden)
  const mobileMenuOpen = useAppStore((state) => state.mobileMenuOpen)
  const scenarioId = useAppStore((state) => state.scenarioId)
  const lang = useAppStore((state) => state.lang)

  const setScenarioId = useAppStore((state) => state.setScenarioId)
  const setFrameIndex = useAppStore((state) => state.setFrameIndex)
  const setIsTimelinePlaying = useAppStore((state) => state.setIsTimelinePlaying)
  const setMobileMenuOpen = useAppStore((state) => state.setMobileMenuOpen)
  const setDataStatus = useAppStore((state) => state.setDataStatus)
  const setTimeline = useAppStore((state) => state.setTimeline)
  const startColumnReveal = useAppStore((state) => state.startColumnReveal)

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    observation: true,
    forecast: false,
    danger: false,
    marine: false,
  })

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }))
  }

  const scenario = useMemo(
    () => scenarios.find((item) => item.id === scenarioId) ?? scenarios[0],
    [scenarioId],
  )

  const selectScenario = (nextScenarioId: typeof scenarioId) => {
    if (nextScenarioId === scenarioId) {
      setMobileMenuOpen(false)
      return
    }
    const nextScenario = scenarios.find((item) => item.id === nextScenarioId) ?? scenarios[0]

    setScenarioId(nextScenario.id)
    setFrameIndex(0)
    startColumnReveal()
    setIsTimelinePlaying(false)
    setMobileMenuOpen(false)
    setDataStatus({ key: 'status_loading' })
    setTimeline([])
  }

  if (!showControls || shortcutChromeHidden) return null

  return (
    <aside className={`scenario-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`} aria-label="메뉴 선택">
      {categories.map((cat) => {
        const isExpanded = !!expandedCategories[cat.id]
        return (
          <div className="category-group" key={cat.id}>
            <h3 
              className="category-title" 
              onClick={() => toggleCategory(cat.id)}
              style={{ 
                cursor: 'pointer', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                userSelect: 'none'
              }}
            >
              <span>{translations[lang][cat.id] || cat.title}</span>
              <ChevronDown 
                size={12} 
                style={{ 
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', 
                  transition: 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  opacity: 0.7
                }} 
              />
            </h3>
            {isExpanded && (
              <div className="category-tabs">
                {cat.scenarioIds.map((id) => {
                  const item = scenarios.find((s) => s.id === id)
                  if (!item) return null
                  const Icon = scenarioIcon[id as keyof typeof scenarioIcon]
                  const isActive = id === scenario.id

                  return (
                    <button
                      type="button"
                      className={`scenario-btn ${isActive ? 'active' : ''}`}
                      key={id}
                      onClick={() => selectScenario(id as any)}
                    >
                      <Icon size={13} />
                      <span>{translations[lang][id] || item.title}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </aside>
  )
}
