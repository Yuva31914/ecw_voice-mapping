import { useState } from "react"
import { Check, X, Edit, Stethoscope, Pill, TestTube, Beaker, ClipboardCheck, AlertCircle, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/Tabs"
import { Button } from "./ui/Button"
import { Badge } from "./ui/Badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/Dialog"
import { Input } from "./ui/Input"
import { Textarea } from "./ui/Textarea"

interface MappingPanelProps {
  mapping: any | null
  extracting: boolean
  acceptedItems: Set<string>
  rejectedItems: Set<string>
  onAccept: (key: string) => void
  onReject: (key: string) => void
  onEdit: (category: string, index: number, data: any) => void
  onAcceptAll: (category: string) => void
  onRejectAll: (category: string) => void
}

export function MappingPanel({
  mapping,
  extracting,
  acceptedItems,
  rejectedItems,
  onAccept,
  onReject,
  onEdit,
  onAcceptAll,
  onRejectAll,
}: MappingPanelProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [editDialog, setEditDialog] = useState<{ open: boolean; category: string; index: number; data: any } | null>(null)

  if (!mapping && !extracting) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Clinical Data Mapping
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm mb-2">No mapping data available</p>
            <p className="text-xs">Complete the transcription above to map structured clinical data</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (extracting) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Clinical Data Mapping
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="animate-pulse text-muted-foreground">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-3" />
              <p className="text-sm">Mapping clinical data with AI...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderItem = (item: any, category: string, index: number) => {
    const key = `${category}:${index}`
    const isAccepted = acceptedItems.has(key)
    const isRejected = rejectedItems.has(key)

    return (
      <div
        key={key}
        className={`flex items-start gap-3 p-3 rounded-lg border ${
          isAccepted ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' :
          isRejected ? 'bg-gray-50 dark:bg-gray-900 opacity-50' :
          'bg-card'
        }`}
      >
        <div className="flex-1">
          <div className="font-medium">{item.text || item.name || item.substance || 'Untitled'}</div>
          <div className="text-sm text-muted-foreground space-y-1 mt-1">
            {item.code && <div>Code: {item.code}</div>}
            {item.severity && <div>Severity: {item.severity}</div>}
            {item.dose && <div>Dose: {item.dose}</div>}
            {item.route && <div>Route: {item.route}</div>}
            {item.frequency && <div>Frequency: {item.frequency}</div>}
            {item.value && <div>Value: {item.value} {item.unit}</div>}
            {item.date && <div>Date: {item.date}</div>}
            {item.reaction && <div>Reaction: {item.reaction}</div>}
            {item.due && <div>Due: {item.due}</div>}
          </div>
        </div>
        <div className="flex gap-1">
          {!isAccepted && !isRejected && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditDialog({ open: true, category, index, data: item })}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-green-600 hover:text-green-700"
                onClick={() => onAccept(key)}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600 hover:text-red-700"
                onClick={() => onReject(key)}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
          {isAccepted && <Badge variant="success">Accepted</Badge>}
          {isRejected && <Badge variant="destructive">Rejected</Badge>}
        </div>
      </div>
    )
  }

  const renderCategory = (category: string, items: any[], icon: any) => {
    if (!items || items.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <div className="opacity-50 mb-2">{icon}</div>
          <p className="text-sm">No {category} found in transcript</p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{items.length} item(s)</div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onAcceptAll(category)}>
              Accept All
            </Button>
            <Button size="sm" variant="outline" onClick={() => onRejectAll(category)}>
              Reject All
            </Button>
          </div>
        </div>
        {items.map((item, index) => renderItem(item, category, index))}
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Clinical Data Mapping
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 lg:grid-cols-7 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="diagnoses">Diagnoses</TabsTrigger>
              <TabsTrigger value="medications">Meds</TabsTrigger>
              <TabsTrigger value="allergies">Allergies</TabsTrigger>
              <TabsTrigger value="labs">Labs</TabsTrigger>
              <TabsTrigger value="procedures">Procedures</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="prose dark:prose-invert max-w-none">
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Summary
                  </h4>
                  <p className="text-sm">{mapping.summary || 'No summary available'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="text-sm">
                    <div className="font-semibold">Diagnoses</div>
                    <div className="text-muted-foreground">{mapping.diagnoses?.length || 0}</div>
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold">Medications</div>
                    <div className="text-muted-foreground">{mapping.medications?.length || 0}</div>
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold">Allergies</div>
                    <div className="text-muted-foreground">{mapping.allergies?.length || 0}</div>
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold">Labs</div>
                    <div className="text-muted-foreground">{mapping.labs?.length || 0}</div>
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold">Procedures</div>
                    <div className="text-muted-foreground">{mapping.procedures?.length || 0}</div>
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold">Tasks</div>
                    <div className="text-muted-foreground">{mapping.tasks?.length || 0}</div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="diagnoses">
              {renderCategory('diagnoses', mapping.diagnoses, <Stethoscope className="h-8 w-8 mx-auto" />)}
            </TabsContent>

            <TabsContent value="medications">
              {renderCategory('medications', mapping.medications, <Pill className="h-8 w-8 mx-auto" />)}
            </TabsContent>

            <TabsContent value="allergies">
              {renderCategory('allergies', mapping.allergies, <AlertCircle className="h-8 w-8 mx-auto" />)}
            </TabsContent>

            <TabsContent value="labs">
              {renderCategory('labs', mapping.labs, <TestTube className="h-8 w-8 mx-auto" />)}
            </TabsContent>

            <TabsContent value="procedures">
              {renderCategory('procedures', mapping.procedures, <Beaker className="h-8 w-8 mx-auto" />)}
            </TabsContent>

            <TabsContent value="tasks">
              {renderCategory('tasks', mapping.tasks, <ClipboardCheck className="h-8 w-8 mx-auto" />)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {editDialog && (
        <Dialog open={editDialog.open} onOpenChange={(open) => !open && setEditDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit {editDialog.category} Item</DialogTitle>
              <DialogDescription>
                Modify the details of this clinical data item
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {Object.entries(editDialog.data).map(([key, value]) => (
                <div key={key}>
                  <label className="text-sm font-medium capitalize">{key}</label>
                  {typeof value === 'string' && value.length > 50 ? (
                    <Textarea
                      defaultValue={value as string}
                      onChange={(e) => {
                        editDialog.data[key] = e.target.value
                      }}
                    />
                  ) : (
                    <Input
                      defaultValue={value as string}
                      onChange={(e) => {
                        editDialog.data[key] = e.target.value
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editDialog) {
                    onEdit(editDialog.category, editDialog.index, editDialog.data)
                    setEditDialog(null)
                  }
                }}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

