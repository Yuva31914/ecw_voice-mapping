import { WandSparkles, Check, Trash2 } from "lucide-react"
import { Button } from "./ui/Button"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/Tooltip"

interface BottomBarProps {
  transcript: string
  extracting: boolean
  onExtract: () => void
  onAcceptAll: () => void
  onClear: () => void
}

export function BottomBar({
  transcript,
  extracting,
  onExtract,
  onAcceptAll,
  onClear,
}: BottomBarProps) {
  return (
    <div className="sticky bottom-0 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 no-print">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onExtract}
                disabled={!transcript || extracting}
                size="lg"
              >
                {extracting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                    Mapping Data...
                  </>
                ) : (
                  <>
                    <WandSparkles className="h-5 w-5 mr-2" />
                    Map Clinical Data
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Map clinical data (⌘⏎ / Ctrl+Enter)</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={onAcceptAll} disabled={extracting}>
                <Check className="h-4 w-4 mr-2" />
                Accept All
              </Button>
            </TooltipTrigger>
            <TooltipContent>Accept all items in current tab (A)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={onClear}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear all data and start fresh</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

