import { useEffect, useRef, useState } from 'react'
import { TooltipProvider } from './components/ui/Tooltip'
import { AppHeader } from './components/AppHeader'
import { Mic, FileText, WandSparkles, CheckCircle2, Loader2, ArrowRight } from 'lucide-react'
import { Button } from './components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/Card'
import { Badge } from './components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/Tabs'
import { Textarea } from './components/ui/Textarea'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002'

type Step = 'record' | 'transcribe' | 'mapping' | 'results'

interface MainAppProps {
  onLogout: () => void
}

export default function MainApp({ onLogout }: MainAppProps) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Wizard state
  const [currentStep, setCurrentStep] = useState<Step>('record')
  const [completedSteps, setCompletedSteps] = useState<Step[]>([])

  // Recording state
  const [recording, setRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const chunks = useRef<BlobPart[]>([])
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)

  // Transcript state
  const [transcript, setTranscript] = useState('')
  const [transcribing, setTranscribing] = useState(false)

  // Mapping state
  const [extracting, setExtracting] = useState(false)
  const [mapping, setMapping] = useState<any>(null)

  // Recording timer
  useEffect(() => {
    let interval: number | undefined
    if (recording) {
      setRecordingTime(0)
      interval = window.setInterval(() => {
        setRecordingTime(t => t + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [recording])

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunks.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunks.current.push(e.data) }
      mr.onstop = async () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' })
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(track => track.stop())
        
        // Auto-progress to transcribe
        setCompletedSteps(prev => [...prev, 'record'])
        setCurrentStep('transcribe')
        await uploadAudio(blob)
      }
      mr.start()
      setMediaRecorder(mr)
      setRecording(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  // Stop recording
  const stopRecording = () => {
    mediaRecorder?.stop()
    setRecording(false)
  }

  // Upload audio
  const uploadAudio = async (blob: Blob) => {
    setTranscribing(true)
    try {
      const fd = new FormData()
      fd.append('file', blob, 'recording.webm')
      
      const r = await fetch(`${API}/transcribe`, { 
        method: 'POST', 
        body: fd,
        signal: AbortSignal.timeout(300000)
      })
      
      if (!r.ok) {
        throw new Error(`Server returned ${r.status}`)
      }
      
      const j = await r.json()
      setTranscript(j.transcript || '')
      
      // Auto-progress to mapping after 1 second
      setTimeout(() => {
        setTranscribing(false)
        setCompletedSteps(prev => [...prev, 'transcribe'])
        setCurrentStep('mapping')
        extractMapping(j.transcript || '')
      }, 1000)
    } catch (error: any) {
      console.error('Upload error:', error)
      setTranscribing(false)
      alert('Error transcribing audio. Please try again.')
    }
  }

  // Extract mapping
  const extractMapping = async (transcriptText: string) => {
    setExtracting(true)
    try {
      const r = await fetch(`${API}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcriptText })
      })
      const j = await r.json()
      setMapping(j)
      
      // Auto-progress to results after 1 second
      setTimeout(() => {
        setExtracting(false)
        setCompletedSteps(prev => [...prev, 'mapping'])
        setCurrentStep('results')
      }, 1000)
    } catch (error) {
      console.error('Extract error:', error)
      setExtracting(false)
      alert('Error mapping clinical data. Please try again.')
    }
  }

  // Reset flow
  const startNewVisit = () => {
    if (confirm('Start a new visit? This will clear all current data.')) {
      setCurrentStep('record')
      setCompletedSteps([])
      setTranscript('')
      setMapping(null)
      setAudioUrl(null)
      setRecording(false)
      setRecordingTime(0)
    }
  }

  // Export
  const exportResults = () => {
    window.print()
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <AppHeader
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onExport={exportResults}
          onNewVisit={startNewVisit}
          onLogout={onLogout}
        />

        <main className="container mx-auto px-4 py-12 pb-24">
          {/* Progress Indicator */}
          <div className="mb-12">
            <div className="flex items-center justify-center gap-4 max-w-4xl mx-auto">
              {(['record', 'transcribe', 'mapping', 'results'] as Step[]).map((step, index) => {
                const isActive = currentStep === step
                const isCompleted = completedSteps.includes(step)
                const icons = {
                  record: Mic,
                  transcribe: FileText,
                  mapping: WandSparkles,
                  results: CheckCircle2
                }
                const Icon = icons[step]
                
                return (
                  <div key={step} className="flex items-center">
                    <div className={`flex flex-col items-center transition-all duration-500 ${
                      isActive ? 'scale-110' : 'scale-100'
                    }`}>
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${
                        isCompleted 
                          ? 'bg-green-500 text-white scale-100' 
                          : isActive 
                          ? 'bg-primary text-white scale-110 shadow-xl animate-pulse' 
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                      }`}>
                        <Icon className="w-8 h-8" />
                      </div>
                      <div className={`mt-2 text-sm font-medium capitalize transition-all duration-300 ${
                        isActive ? 'text-primary scale-105' : 'text-gray-500'
                      }`}>
                        {step}
                      </div>
                    </div>
                    {index < 3 && (
                      <div className={`w-24 h-1 mx-4 transition-all duration-500 ${
                        completedSteps.includes((['record', 'transcribe', 'mapping', 'results'] as Step[])[index])
                          ? 'bg-green-500'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Step Content */}
          <div className="max-w-4xl mx-auto">
            {/* STEP 1: RECORD */}
            {currentStep === 'record' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Card className="border-2 shadow-2xl">
                  <CardHeader className="text-center pb-8">
                    <CardTitle className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                      Voice Recording or Text Input
                    </CardTitle>
                    <CardDescription className="text-lg mt-2">
                      Record audio or paste text for testing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-8 pb-12">
                    {!recording ? (
                      <Button
                        size="lg"
                        onClick={startRecording}
                        className="w-48 h-48 rounded-full text-xl shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300 hover:scale-110"
                      >
                        <Mic className="w-24 h-24" />
                      </Button>
                    ) : (
                      <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                          <button
                            onClick={stopRecording}
                            className="w-48 h-48 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 cursor-pointer"
                          >
                            <div className="w-16 h-16 bg-white rounded-lg" />
                          </button>
                          <div className="absolute -inset-4 rounded-full border-4 border-red-500 animate-ping pointer-events-none" />
                        </div>
                        <div className="text-center">
                          <div className="text-5xl font-mono font-bold text-red-600 animate-pulse">
                            {formatTime(recordingTime)}
                          </div>
                          <div className="text-xl text-muted-foreground mt-2">Recording in progress...</div>
                          <button
                            onClick={stopRecording}
                            className="mt-4 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105"
                          >
                            Stop Recording
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {!recording && (
                      <div className="w-full space-y-6">
                        <div className="text-center">
                          <p className="text-lg text-muted-foreground mb-2">
                            Press the microphone button to begin
                          </p>
                          <Badge variant="outline" className="text-sm">
                            Tip: Speak clearly and at a normal pace
                          </Badge>
                        </div>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                              Or for testing
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-sm font-medium">
                            Paste Conversation Text (for testing):
                          </label>
                          <textarea
                            className="w-full min-h-[200px] p-4 border-2 border-input rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                            placeholder="Paste your patient-doctor conversation text here..."
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                          />
                          <Button
                            onClick={() => {
                              if (transcript.trim()) {
                                setCompletedSteps(prev => [...prev, 'record'])
                                setCurrentStep('transcribe')
                                // Skip transcription and go directly to mapping
                                setTimeout(() => {
                                  setCompletedSteps(prev => [...prev, 'transcribe'])
                                  setCurrentStep('mapping')
                                  extractMapping(transcript)
                                }, 500)
                              }
                            }}
                            disabled={!transcript.trim()}
                            className="w-full"
                            size="lg"
                          >
                            Process Text with AI
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* STEP 2: TRANSCRIBING */}
            {currentStep === 'transcribe' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Card className="border-2 shadow-2xl">
                  <CardHeader className="text-center pb-8">
                    <CardTitle className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                      Transcribing Audio
                    </CardTitle>
                    <CardDescription className="text-lg mt-2">
                      AI is converting your voice to text...
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-8 pb-12">
                    {transcribing ? (
                      <div className="flex flex-col items-center gap-6">
                        <div className="relative w-48 h-48 flex items-center justify-center">
                          <div className="absolute inset-0 rounded-full border-8 border-primary/20" />
                          <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-primary animate-spin" />
                          <Loader2 className="w-24 h-24 text-primary animate-pulse" />
                        </div>
                        <div className="text-2xl font-semibold text-center">
                          Processing your recording...
                        </div>
                      </div>
                    ) : (
                      <div className="w-full space-y-6 animate-in fade-in duration-500">
                        <div className="flex items-center justify-center gap-3 text-green-600">
                          <CheckCircle2 className="w-12 h-12" />
                          <span className="text-2xl font-semibold">Transcription Complete!</span>
                        </div>
                        <div className="bg-muted rounded-lg p-6 max-h-96 overflow-y-auto">
                          <p className="text-lg leading-relaxed whitespace-pre-wrap">{transcript}</p>
                        </div>
                        <div className="flex justify-center">
                          <Badge variant="secondary" className="text-lg px-4 py-2">
                            {transcript.split(/\s+/).length} words transcribed
                          </Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* STEP 3: MAPPING */}
            {currentStep === 'mapping' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Card className="border-2 shadow-2xl">
                  <CardHeader className="text-center pb-8">
                    <CardTitle className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                      Mapping Clinical Data
                    </CardTitle>
                    <CardDescription className="text-lg mt-2">
                      AI is extracting structured medical information...
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-8 pb-12">
                    <div className="flex flex-col items-center gap-6">
                      <div className="relative w-48 h-48 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 opacity-20 animate-ping" />
                        <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-indigo-500 border-r-cyan-500 animate-spin" />
                        <WandSparkles className="w-24 h-24 text-primary animate-pulse" />
                      </div>
                      <div className="text-2xl font-semibold text-center">
                        Analyzing medical data...
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">Diagnoses</Badge>
                        <Badge variant="outline">Medications</Badge>
                        <Badge variant="outline">Allergies</Badge>
                        <Badge variant="outline">Labs</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* STEP 4: RESULTS */}
            {currentStep === 'results' && mapping && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
                <Card className="border-2 shadow-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900">
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <CheckCircle2 className="w-20 h-20 text-green-600 animate-bounce" />
                    </div>
                    <CardTitle className="text-4xl font-bold text-green-600">
                      Mapping Complete!
                    </CardTitle>
                    <CardDescription className="text-lg mt-2">
                      Your clinical data has been successfully processed
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="grid grid-cols-4 lg:grid-cols-7 w-full">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="diagnoses">Diagnoses</TabsTrigger>
                    <TabsTrigger value="medications">Medications</TabsTrigger>
                    <TabsTrigger value="allergies">Allergies</TabsTrigger>
                    <TabsTrigger value="labs">Labs</TabsTrigger>
                    <TabsTrigger value="procedures">Procedures</TabsTrigger>
                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Clinical Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-lg leading-relaxed">{mapping.summary || 'No summary available'}</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                          <div className="bg-muted rounded-lg p-4">
                            <div className="text-2xl font-bold">{mapping.diagnoses?.length || 0}</div>
                            <div className="text-sm text-muted-foreground">Diagnoses</div>
                          </div>
                          <div className="bg-muted rounded-lg p-4">
                            <div className="text-2xl font-bold">{mapping.medications?.length || 0}</div>
                            <div className="text-sm text-muted-foreground">Medications</div>
                          </div>
                          <div className="bg-muted rounded-lg p-4">
                            <div className="text-2xl font-bold">{mapping.allergies?.length || 0}</div>
                            <div className="text-sm text-muted-foreground">Allergies</div>
                          </div>
                          <div className="bg-muted rounded-lg p-4">
                            <div className="text-2xl font-bold">{mapping.labs?.length || 0}</div>
                            <div className="text-sm text-muted-foreground">Lab Tests</div>
                          </div>
                          <div className="bg-muted rounded-lg p-4">
                            <div className="text-2xl font-bold">{mapping.procedures?.length || 0}</div>
                            <div className="text-sm text-muted-foreground">Procedures</div>
                          </div>
                          <div className="bg-muted rounded-lg p-4">
                            <div className="text-2xl font-bold">{mapping.tasks?.length || 0}</div>
                            <div className="text-sm text-muted-foreground">Tasks</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {['diagnoses', 'medications', 'allergies', 'labs', 'procedures', 'tasks'].map(category => (
                    <TabsContent key={category} value={category} className="mt-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="capitalize">{category}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {mapping[category]?.length > 0 ? (
                            <div className="space-y-3">
                              {mapping[category].map((item: any, index: number) => (
                                <div
                                  key={index}
                                  className="bg-muted rounded-lg p-4 animate-in fade-in slide-in-from-left duration-300"
                                  style={{ animationDelay: `${index * 50}ms` }}
                                >
                                  <div className="font-semibold text-lg">
                                    {item.text || item.name || item.substance || 'Item ' + (index + 1)}
                                  </div>
                                  <div className="text-sm text-muted-foreground mt-2 space-y-1">
                                    {Object.entries(item).map(([key, value]) => {
                                      if (key !== 'text' && key !== 'name' && key !== 'substance' && value) {
                                        return (
                                          <div key={key} className="flex gap-2">
                                            <span className="font-medium capitalize">{key}:</span>
                                            <span>{value as string}</span>
                                          </div>
                                        )
                                      }
                                      return null
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12 text-muted-foreground">
                              <p>No {category} found in the transcript</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  ))}
                </Tabs>

                <div className="flex justify-center gap-4 mt-8">
                  <Button size="lg" onClick={startNewVisit} variant="outline">
                    Start New Visit
                  </Button>
                  <Button size="lg" onClick={exportResults}>
                    Export Results
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}
