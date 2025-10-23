import { Mic, Square, Upload, Play } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card"
import { Button } from "./ui/Button"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/Tooltip"
import { Badge } from "./ui/Badge"
import { useEffect, useState } from "react"

interface RecorderPanelProps {
  recording: boolean
  audioUrl: string | null
  transcribing: boolean
  onStartRecording: () => void
  onStopRecording: () => void
  onFileUpload: (file: File) => void
}

export function RecorderPanel({
  recording,
  audioUrl,
  transcribing,
  onStartRecording,
  onStopRecording,
  onFileUpload,
}: RecorderPanelProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    let interval: number | undefined
    if (recording) {
      setElapsed(0)
      interval = window.setInterval(() => {
        setElapsed(t => t + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [recording])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileUpload(file)
    }
  }

  const getStatus = () => {
    if (transcribing) return { text: 'Transcribing', variant: 'warning' as const }
    if (recording) return { text: 'Recording', variant: 'destructive' as const }
    if (audioUrl) return { text: 'Ready', variant: 'success' as const }
    return { text: 'Idle', variant: 'secondary' as const }
  }

  const status = getStatus()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Recording
          </span>
          <Badge variant={status.variant}>{status.text}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center gap-4">
          {recording ? (
            <>
              <div className="relative">
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={onStopRecording}
                  className="h-24 w-24 rounded-full"
                >
                  <Square className="h-8 w-8" />
                </Button>
                <div className="absolute -inset-2 rounded-full border-2 border-destructive animate-pulse" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-mono font-semibold">{formatTime(elapsed)}</div>
                <div className="text-sm text-muted-foreground">Press R or click to stop</div>
              </div>
            </>
          ) : (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="lg"
                    onClick={onStartRecording}
                    className="h-24 w-24 rounded-full"
                    disabled={transcribing}
                  >
                    <Mic className="h-8 w-8" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Start recording (R)</TooltipContent>
              </Tooltip>
              <div className="text-sm text-muted-foreground text-center">
                Click or press R to start recording
              </div>
            </>
          )}
        </div>

        {audioUrl && !recording && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Play className="h-4 w-4" />
              <span>Playback</span>
            </div>
            <audio src={audioUrl} controls className="w-full" />
          </div>
        )}

        {!recording && !transcribing && (
          <div className="pt-4 border-t">
            <label>
              <Button variant="outline" className="w-full" asChild disabled={transcribing}>
                <div>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Audio File
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </div>
              </Button>
            </label>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Or upload an existing audio file
            </p>
          </div>
        )}

        {transcribing && (
          <div className="bg-muted rounded-lg p-4 text-center">
            <div className="animate-pulse text-sm text-muted-foreground">
              Transcribing with AI...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

