import { Moon, Sun, Download, Settings, LogOut } from "lucide-react"
import { Button } from "./ui/Button"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/Tooltip"

interface AppHeaderProps {
  darkMode: boolean
  onToggleDarkMode: () => void
  onExport: () => void
  onNewVisit: () => void
  onLogout?: () => void
}

export function AppHeader({ darkMode, onToggleDarkMode, onExport, onNewVisit, onLogout }: AppHeaderProps) {
  return (
    <header className="border-b bg-card sticky top-0 z-40 no-print">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold">C</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold">Clinical Voice Assistant</h1>
            <p className="text-xs text-muted-foreground">AI Medical Transcription</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={onNewVisit}>
                New Visit
              </Button>
            </TooltipTrigger>
            <TooltipContent>Start a new patient visit</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4" />
                Export
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export summary (⌘P / Ctrl+P)</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onToggleDarkMode}>
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{darkMode ? 'Light mode' : 'Dark mode'}</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>

          {onLogout && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onLogout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Logout</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </header>
  )
}

