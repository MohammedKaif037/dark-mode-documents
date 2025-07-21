"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import {
  Upload,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Settings,
  Moon,
  FileText,
  Contrast,
  FolderOpen,
  X,
  RotateCcw,
  Maximize,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import PDFViewer from "@/components/pdf-viewer-alternative"
import WordViewer from "@/components/word-viewer"
import TextViewer from "@/components/text-viewer"

type DocumentFile = File
type FileType = "pdf" | "word" | "text" | null

export default function DocumentReader() {
  const [documentFile, setDocumentFile] = useState<DocumentFile | null>(null)
  const [fileType, setFileType] = useState<FileType>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [zoom, setZoom] = useState(1.0)
  const [rotation, setRotation] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [theme, setTheme] = useState<"dark" | "sepia" | "high-contrast">("dark")
  const [autoScroll, setAutoScroll] = useState(false)
  const [scrollSpeed, setScrollSpeed] = useState(1)
  const [contrast, setContrast] = useState(1.0)
  const [brightness, setBrightness] = useState(1.0)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Handle keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "=":
          case "+":
            event.preventDefault()
            zoomIn()
            break
          case "-":
            event.preventDefault()
            zoomOut()
            break
          case "0":
            event.preventDefault()
            resetZoom()
            break
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const getFileType = (file: File): FileType => {
    if (file.type === "application/pdf") return "pdf"
    if (
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.type === "application/msword" ||
      file.name.endsWith(".docx") ||
      file.name.endsWith(".doc")
    ) {
      return "word"
    }
    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      return "text"
    }
    return null
  }

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const type = getFileType(file)
      if (type) {
        setDocumentFile(file)
        setFileType(type)
        setCurrentPage(1)
        setTotalPages(0)
      } else {
        alert("Please select a valid PDF, Word document, or text file")
      }
    }
  }, [])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      const type = getFileType(file)
      if (type) {
        setDocumentFile(file)
        setFileType(type)
        setCurrentPage(1)
        setTotalPages(0)
      } else {
        alert("Please select a valid PDF, Word document, or text file")
      }
    }
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
  }, [])

  const handleGoHome = useCallback(() => {
    setDocumentFile(null)
    setFileType(null)
    setCurrentPage(1)
    setTotalPages(0)
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  const handleNewFile = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  const zoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3.0))
  const zoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5))
  const resetZoom = () => setZoom(1.0)
  const rotate = () => setRotation((prev) => (prev + 90) % 360)

  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1))

  const resetVisualSettings = () => {
    setContrast(1.0)
    setBrightness(1.0)
    setZoom(1.0)
  }

  const getThemeClasses = () => {
    switch (theme) {
      case "sepia":
        return "bg-amber-900 text-amber-100"
      case "high-contrast":
        return "bg-black text-white"
      default:
        return "bg-gray-900 text-gray-100"
    }
  }

  const getFileIcon = () => {
    if (fileType === "pdf") return <FileText className="w-4 h-4 text-red-400" />
    if (fileType === "word") return <FileText className="w-4 h-4 text-blue-400" />
    if (fileType === "text") return <FileText className="w-4 h-4 text-green-400" />
    return <FileText className="w-4 h-4" />
  }

  const getFileTypeLabel = () => {
    switch (fileType) {
      case "pdf":
        return "PDF"
      case "word":
        return "Word"
      case "text":
        return "Text"
      default:
        return ""
    }
  }

  const getZoomStyles = () => {
    if (!documentFile) return {}

    return {
      transform: `scale(${zoom})`,
      transformOrigin: "top center",
      transition: "transform 0.2s ease-in-out",
      minHeight: `${100 / zoom}vh`, // Adjust container height to prevent overflow
    }
  }

  return (
    <div ref={containerRef} className={`min-h-screen transition-colors duration-300 ${getThemeClasses()}`}>
      {/* Header - Fixed and not affected by zoom */}
      <header className="border-b border-gray-600 bg-gray-800 backdrop-blur-sm p-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-blue-400" />
              <h1 className="text-xl font-semibold">Dark Document Reader</h1>
            </div>

            {documentFile && (
              <div className="flex items-center gap-2 text-sm bg-gray-700 px-3 py-1 rounded-full border border-gray-600">
                {getFileIcon()}
                <span className="max-w-[200px] truncate">{documentFile.name}</span>
                <span className="text-xs bg-gray-600 px-2 py-0.5 rounded text-gray-300">{getFileTypeLabel()}</span>
                {fileType === "pdf" && totalPages > 0 && (
                  <span className="opacity-70 ml-2">
                    Page {currentPage} of {totalPages}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {documentFile && (
              <>
                {/* Navigation Controls */}
                <div className="flex items-center gap-1 mr-2">
                  <Button variant="ghost" size="sm" onClick={handleNewFile} title="Open New File (Ctrl+O)">
                    <FolderOpen className="w-4 h-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" title="Close Document (Ctrl+W)">
                        <X className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-gray-800 border-gray-700">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-100">Close Document?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-300">
                          Are you sure you want to close this document? You'll return to the home page to select a new
                          file.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleGoHome} className="bg-blue-600 hover:bg-blue-700 text-white">
                          Close Document
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <div className="w-px h-6 bg-gray-600 mx-2" />
                </div>

                {/* Document Controls */}
                {fileType === "pdf" && (
                  <>
                    <Button variant="ghost" size="sm" onClick={prevPage} disabled={currentPage <= 1}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <Button variant="ghost" size="sm" onClick={nextPage} disabled={currentPage >= totalPages}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>

                    <div className="w-px h-6 bg-gray-600 mx-2" />
                  </>
                )}

                <Button variant="ghost" size="sm" onClick={zoomOut} title="Zoom Out (Ctrl+-)">
                  <ZoomOut className="w-4 h-4" />
                </Button>

                <span className="text-sm min-w-[4rem] text-center bg-gray-700 px-2 py-1 rounded border border-gray-600 text-gray-100">
                  {Math.round(zoom * 100)}%
                </span>

                <Button variant="ghost" size="sm" onClick={zoomIn} title="Zoom In (Ctrl++)">
                  <ZoomIn className="w-4 h-4" />
                </Button>

                <Button variant="ghost" size="sm" onClick={resetZoom} title="Reset Zoom (Ctrl+0)">
                  <RotateCcw className="w-4 h-4" />
                </Button>

                {fileType === "pdf" && (
                  <Button variant="ghost" size="sm" onClick={rotate} title="Rotate">
                    <RotateCcw className="w-4 h-4 rotate-90" />
                  </Button>
                )}

                <Button variant="ghost" size="sm" onClick={toggleFullscreen} title="Fullscreen (F11)">
                  <Maximize className="w-4 h-4" />
                </Button>
              </>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-gray-800 border-gray-700 w-80">
                <SheetHeader>
                  <SheetTitle className="text-gray-100 flex items-center gap-2">
                    <Contrast className="w-5 h-5" />
                    Reading Settings
                  </SheetTitle>
                </SheetHeader>

                <div className="space-y-6 mt-6">
                  {documentFile && (
                    <div className="border-b border-gray-700 pb-4">
                      <h3 className="text-sm font-medium text-gray-200 mb-3 flex items-center gap-2">
                        <Moon className="w-4 h-4" />
                        Navigation
                      </h3>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNewFile}
                          className="w-full bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 justify-start"
                        >
                          <FolderOpen className="w-4 h-4 mr-2" />
                          Open New File
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGoHome}
                          className="w-full bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 justify-start"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Back to Home
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-gray-200">Theme</Label>
                    <Select
                      value={theme}
                      onValueChange={(value: "dark" | "sepia" | "high-contrast") => setTheme(value)}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="dark" className="text-gray-100 focus:bg-gray-600">
                          Dark Mode
                        </SelectItem>
                        <SelectItem value="sepia" className="text-gray-100 focus:bg-gray-600">
                          Sepia Mode
                        </SelectItem>
                        <SelectItem value="high-contrast" className="text-gray-100 focus:bg-gray-600">
                          High Contrast
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border-t border-gray-700 pt-4">
                    <h3 className="text-sm font-medium text-gray-200 mb-4 flex items-center gap-2">
                      <Contrast className="w-4 h-4" />
                      Visual Adjustments
                    </h3>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-gray-200">Layout Zoom</Label>
                        <Slider
                          value={[zoom]}
                          onValueChange={([value]) => setZoom(value)}
                          min={0.5}
                          max={2.0}
                          step={0.25}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>50%</span>
                          <span>{Math.round(zoom * 100)}%</span>
                          <span>200%</span>
                        </div>
                        <div className="text-xs text-gray-500">Zooms the entire document layout</div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-200">Contrast</Label>
                        <Slider
                          value={[contrast]}
                          onValueChange={([value]) => setContrast(value)}
                          min={0.5}
                          max={2.0}
                          step={0.1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Low</span>
                          <span>{contrast.toFixed(1)}x</span>
                          <span>High</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-200">Brightness</Label>
                        <Slider
                          value={[brightness]}
                          onValueChange={([value]) => setBrightness(value)}
                          min={0.5}
                          max={1.5}
                          step={0.1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Dim</span>
                          <span>{brightness.toFixed(1)}x</span>
                          <span>Bright</span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetVisualSettings}
                        className="w-full bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
                      >
                        Reset to Default
                      </Button>
                    </div>
                  </div>

                  {fileType === "pdf" && (
                    <div className="border-t border-gray-700 pt-4">
                      <h3 className="text-sm font-medium text-gray-200 mb-4">PDF Options</h3>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-scroll" className="text-gray-200">
                          Auto Scroll
                        </Label>
                        <Switch id="auto-scroll" checked={autoScroll} onCheckedChange={setAutoScroll} />
                      </div>

                      {autoScroll && (
                        <div className="space-y-2 mt-4">
                          <Label className="text-gray-200">Scroll Speed</Label>
                          <Slider
                            value={[scrollSpeed]}
                            onValueChange={([value]) => setScrollSpeed(value)}
                            min={0.5}
                            max={3.0}
                            step={0.5}
                            className="w-full"
                          />
                          <div className="text-sm text-gray-400">{scrollSpeed}x</div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="border-t border-gray-700 pt-4">
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>⌨️ Keyboard shortcuts:</p>
                      <p>Ctrl/Cmd + Plus: Zoom in</p>
                      <p>Ctrl/Cmd + Minus: Zoom out</p>
                      <p>Ctrl/Cmd + 0: Reset zoom</p>
                      <p>💡 Layout zoom affects the entire document view</p>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content - This gets zoomed */}
      <main className="flex-1 overflow-auto">
        <div ref={contentRef} style={getZoomStyles()}>
          {!documentFile ? (
            <div
              className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-8"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <Card className="p-12 text-center max-w-md bg-gray-800 border-gray-600 hover:bg-gray-750 transition-colors shadow-xl">
                <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h2 className="text-xl font-semibold mb-2 text-gray-100">Upload a Document</h2>
                <p className="text-gray-400 mb-6">Drag and drop a document here, or click to select one</p>
                <div className="space-y-3">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Select Document
                  </Button>
                  <div className="text-xs text-gray-500">Supported formats: PDF, DOCX, DOC, TXT</div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </Card>
            </div>
          ) : (
            <div className="p-4">
              {fileType === "pdf" ? (
                <PDFViewer
                  file={documentFile}
                  currentPage={currentPage}
                  zoom={1.0} // Pass 1.0 since we're handling zoom at layout level
                  rotation={rotation}
                  theme={theme}
                  autoScroll={autoScroll}
                  scrollSpeed={scrollSpeed}
                  contrast={contrast}
                  brightness={brightness}
                  onPageChange={setCurrentPage}
                  onTotalPagesChange={setTotalPages}
                />
              ) : fileType === "word" ? (
                <WordViewer
                  file={documentFile}
                  zoom={1.0} // Pass 1.0 since we're handling zoom at layout level
                  theme={theme}
                  contrast={contrast}
                  brightness={brightness}
                  onTotalPagesChange={setTotalPages}
                />
              ) : fileType === "text" ? (
                <TextViewer
                  file={documentFile}
                  zoom={1.0} // Pass 1.0 since we're handling zoom at layout level
                  theme={theme}
                  contrast={contrast}
                  brightness={brightness}
                  onTotalPagesChange={setTotalPages}
                />
              ) : null}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
