import React from 'react'
import { Camera, Plus, Minus, Play, Video, Square, Download } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import type { CameraShot } from '../types'

interface CameraPanelProps {
  addCameraShot: () => void
  goToCameraShot: (shot: CameraShot) => void
  updateCameraShot: (id: string, patch: Partial<CameraShot>) => void
  updateCameraShotCenter: (id: string, axis: 0 | 1, value: number) => void
  updateCameraShotNumber: (id: string, patch: Partial<Pick<CameraShot, 'zoom' | 'pitch' | 'bearing'>>) => void
  removeCameraShot: (id: string) => void
  moveCameraShot: (dragId: string, targetId: string) => void
  playCamera: () => void
  startRecording: () => void
  stopRecording: () => void
}

export const CameraPanel: React.FC<CameraPanelProps> = ({
  addCameraShot,
  goToCameraShot,
  updateCameraShot,
  updateCameraShotCenter,
  updateCameraShotNumber,
  removeCameraShot,
  moveCameraShot,
  playCamera,
  startRecording,
  stopRecording,
}) => {
  const showControls = useAppStore((state) => state.showControls)
  const cameraPanelOpen = useAppStore((state) => state.cameraPanelOpen)
  const overlayVisibility = useAppStore((state) => state.overlayVisibility)
  const shortcutChromeHidden = useAppStore((state) => state.shortcutChromeHidden)
  const cameraShots = useAppStore((state) => state.cameraShots)
  const draggingShotId = useAppStore((state) => state.draggingShotId)
  const recordingState = useAppStore((state) => state.recordingState)
  const recordingUrl = useAppStore((state) => state.recordingUrl)
  const recordingExtension = useAppStore((state) => state.recordingExtension)
  const recordingError = useAppStore((state) => state.recordingError)

  const setDraggingShotId = useAppStore((state) => state.setDraggingShotId)

  if (!showControls || !cameraPanelOpen || !overlayVisibility.cameraPanel || shortcutChromeHidden) {
    return null
  }

  return (
    <aside className="camera-panel" aria-label="카메라 워크 설정">
      <header>
        <div>
          <Camera size={15} />
          <strong>카메라 워크</strong>
        </div>
        <button type="button" onClick={addCameraShot} disabled={cameraShots.length >= 10} title="현재 뷰 저장">
          <Plus size={15} />
        </button>
      </header>
      <p>{cameraShots.length}/10 views</p>
      <div className="camera-shot-list">
        {cameraShots.map((shot, index) => (
          <article
            className={`camera-shot ${draggingShotId === shot.id ? 'dragging' : ''}`}
            draggable
            key={shot.id}
            onDragStart={(event) => {
              setDraggingShotId(shot.id)
              event.dataTransfer.effectAllowed = 'move'
              event.dataTransfer.setData('text/plain', shot.id)
            }}
            onDragOver={(event) => {
              event.preventDefault()
              event.dataTransfer.dropEffect = 'move'
            }}
            onDrop={(event) => {
              event.preventDefault()
              const dragId = event.dataTransfer.getData('text/plain') || draggingShotId

              if (dragId) {
                moveCameraShot(dragId, shot.id)
              }

              setDraggingShotId(null)
            }}
            onDragEnd={() => setDraggingShotId(null)}
          >
            <button
              type="button"
              className="camera-thumb"
              onClick={() => goToCameraShot(shot)}
              title={`${shot.name} 위치로 이동`}
            >
              <img src={shot.thumbnail} alt="" draggable={false} />
              <span>{String(index + 1).padStart(2, '0')}</span>
            </button>
            <div className="camera-shot-fields">
              <input
                aria-label="카메라 이름"
                value={shot.name}
                onChange={(event) => updateCameraShot(shot.id, { name: event.target.value })}
              />
              <label>
                <span>정지</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.1"
                  value={shot.holdSeconds}
                  onChange={(event) => updateCameraShot(shot.id, { holdSeconds: Number(event.target.value) })}
                />
                <span>초</span>
              </label>
              <label>
                <span>이동</span>
                <input
                  type="number"
                  min="0.4"
                  max="12"
                  step="0.1"
                  value={shot.moveSeconds}
                  onChange={(event) => updateCameraShot(shot.id, { moveSeconds: Number(event.target.value) })}
                />
                <span>초</span>
              </label>
            </div>
            <div className="camera-shot-settings" aria-label={`${shot.name} camera values`}>
              <label>
                <span>경도</span>
                <input
                  type="number"
                  step="0.0001"
                  value={Number(shot.center[0].toFixed(4))}
                  onChange={(event) => updateCameraShotCenter(shot.id, 0, Number(event.target.value))}
                />
              </label>
              <label>
                <span>위도</span>
                <input
                  type="number"
                  step="0.0001"
                  value={Number(shot.center[1].toFixed(4))}
                  onChange={(event) => updateCameraShotCenter(shot.id, 1, Number(event.target.value))}
                />
              </label>
              <label>
                <span>줌</span>
                <input
                  type="number"
                  step="0.01"
                  value={Number(shot.zoom.toFixed(2))}
                  onChange={(event) => updateCameraShotNumber(shot.id, { zoom: Number(event.target.value) })}
                />
              </label>
              <label>
                <span>피치</span>
                <input
                  type="number"
                  step="1"
                  value={Number(shot.pitch.toFixed(1))}
                  onChange={(event) => updateCameraShotNumber(shot.id, { pitch: Number(event.target.value) })}
                />
              </label>
              <label>
                <span>회전</span>
                <input
                  type="number"
                  step="1"
                  value={Number(shot.bearing.toFixed(1))}
                  onChange={(event) => updateCameraShotNumber(shot.id, { bearing: Number(event.target.value) })}
                />
              </label>
            </div>
            <button type="button" className="camera-delete" onClick={() => removeCameraShot(shot.id)} title="카메라 삭제">
              <Minus size={13} />
            </button>
          </article>
        ))}
      </div>
      <button type="button" className="camera-run" onClick={playCamera}>
        <Play size={13} fill="currentColor" />
        전체 시연
      </button>
      <div className="record-controls" aria-label="녹화 컨트롤">
        <button type="button" onClick={startRecording} disabled={recordingState === 'recording'}>
          <Video size={13} />
          녹화
        </button>
        <button type="button" onClick={stopRecording} disabled={recordingState !== 'recording'}>
          <Square size={12} fill="currentColor" />
          정지
        </button>
        {recordingUrl ? (
          <a href={recordingUrl} download={`kbs-demo-${Date.now()}.${recordingExtension}`}>
            <Download size={13} />
            다운로드
          </a>
        ) : (
          <button type="button" disabled>
            <Download size={13} />
            다운로드
          </button>
        )}
      </div>
      {recordingError && <small className="recording-error">{recordingError}</small>}
    </aside>
  )
}
