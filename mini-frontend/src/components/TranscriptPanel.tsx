import { FileText, Type, Save } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card"
import { Textarea } from "./ui/Textarea"
import { Button } from "./ui/Button"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/Tooltip"
import { Badge } from "./ui/Badge"

interface TranscriptPanelProps {
  transcript: string
  onChange: (value: string) => void
  transcribing: boolean
}

export function TranscriptPanel({ transcript, onChange, transcribing }: TranscriptPanelProps) {
  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0
  const charCount = transcript.length

  const handleSave = () => {
    const blob = new Blob([transcript], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transcript-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const cleanFillers = () => {
    // Simple filler word removal
    const fillers = ['um', 'uh', 'like', 'you know', 'I mean', 'basically', 'actually']
    let cleaned = transcript
    fillers.forEach(filler => {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi')
      cleaned = cleaned.replace(regex, '')
    })
    cleaned = cleaned.replace(/\s+/g, ' ').trim()
    onChange(cleaned)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Transcript Editor
          </span>
          <div className="flex items-center gap-2 text-sm font-normal">
            <Badge variant="secondary">
              <Type className="h-3 w-3 mr-1" />
              {wordCount} words
            </Badge>
            <Badge variant="outline">{charCount} chars</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {transcribing && (
          <div className="bg-muted rounded-lg p-3 text-sm text-muted-foreground">
            Processing audio transcript...
          </div>
        )}
        
        <Textarea
          value={transcript}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Medical transcript will appear here. You can edit and refine the text as needed..."
          className="min-h-[300px] font-mono text-sm leading-relaxed"
        />
        
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={cleanFillers}
                disabled={!transcript || transcribing}
              >
                Clean Fillers
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove filler words (um, uh, like, etc.)</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={!transcript}
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save transcript (⌘S / Ctrl+S)</TooltipContent>
          </Tooltip>
        </div>

        {!transcript && !transcribing && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Click Record or Upload audio to begin</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

