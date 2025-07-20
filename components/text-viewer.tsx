"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, AlertCircle, Type, Code } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface TextViewerProps {
  file: File
  zoom: number
  theme: "dark" | "sepia" | "high-contrast"
  contrast: number
  brightness: number
  onTotalPagesChange: (total: number) => void
}

export default function TextViewer({ file, zoom, theme, contrast, brightness, onTotalPagesChange }: TextViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [textContent, setTextContent] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [useMonospace, setUseMonospace] = useState(false)
  const [wordWrap, setWordWrap] = useState(true)
  const [lineNumbers, setLineNumbers] = useState(false)

  useEffect(() => {
    const loadTextFile = async () => {
      setIsLoading(true)
      setError("")

      try {
        const text = await file.text()
        setTextContent(text)
        onTotalPagesChange(1) // Text files are continuous, so we set to 1

        // Auto-detect if this might be a code file
        const isCodeFile = file.name.match(/\.(js|ts|jsx|tsx|py|java|cpp|c|css|html|xml|json|md|sql|sh|bat)$/i)
        if (isCodeFile) {
          setUseMonospace(true)
          setLineNumbers(true)
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Error loading text file:", error)
        setError("Failed to load text file. Please try a different file.")
        setIsLoading(false)
      }
    }

    loadTextFile()
  }, [file, onTotalPagesChange])

  const getThemeStyles = () => {
    const baseFilter = `contrast(${contrast}) brightness(${brightness})`

    switch (theme) {
      case "sepia":
        return {
          backgroundColor: "#2d2318",
          color: "#e8d5b7",
          border: "1px solid #4a3728",
          filter: baseFilter,
        }
      case "high-contrast":
        return {
          backgroundColor: "#000000",
          color: "#ffffff",
          border: "1px solid #333333",
          filter: `${baseFilter} saturate(1.2)`,
        }
      default:
        return {
          backgroundColor: "#1f2937",
          color: "#f3f4f6",
          border: "1px solid #374151",
          filter: baseFilter,
        }
    }
  }

  const getTextColor = () => {
    const textOpacity = Math.min(1, 0.8 + (contrast - 1) * 0.2)

    switch (theme) {
      case "sepia":
        return `rgba(232, 213, 183, ${textOpacity})`
      case "high-contrast":
        return `rgba(255, 255, 255, ${textOpacity})`
      default:
        return `rgba(229, 231, 235, ${textOpacity})`
    }
  }

  const getLineNumberColor = () => {
    switch (theme) {
      case "sepia":
        return "rgba(180, 160, 140, 0.6)"
      case "high-contrast":
        return "rgba(255, 255, 255, 0.4)"
      default:
        return "rgba(156, 163, 175, 0.6)"
    }
  }

  const renderTextWithLineNumbers = () => {
    const lines = textContent.split("\n")
    const maxLineNumber = lines.length.toString().length

    return (
      <div className="flex">
        {lineNumbers && (
          <div
            className="select-none pr-4 text-right border-r border-opacity-30"
            style={{
              color: getLineNumberColor(),
              borderColor: getLineNumberColor(),
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
              fontSize: `${14 * zoom}px`,
              lineHeight: 1.6,
              minWidth: `${maxLineNumber * 0.6 + 1}em`,
            }}
          >
            {lines.map((_, index) => (
              <div key={index}>{index + 1}</div>
            ))}
          </div>
        )}
        <div
          className="flex-1 pl-4"
          style={{
            color: getTextColor(),
            fontFamily: useMonospace
              ? 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
              : 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: `${16 * zoom}px`,
            lineHeight: 1.6,
            whiteSpace: wordWrap ? "pre-wrap" : "pre",
            wordBreak: wordWrap ? "break-word" : "normal",
          }}
        >
          {textContent}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-gray-200">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading text file...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert className="max-w-md bg-red-900/30 border-red-700">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-200">{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-6xl space-y-4">
        {/* Text Viewer Controls */}
        <div
          className="flex items-center gap-4 p-3 rounded-lg border"
          style={{
            backgroundColor: theme === "sepia" ? "#3d2f20" : theme === "high-contrast" ? "#1a1a1a" : "#374151",
            borderColor: theme === "sepia" ? "#4a3728" : theme === "high-contrast" ? "#333333" : "#4b5563",
          }}
        >
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4" />
            <Label className="text-sm">Font Style</Label>
            <Switch
              checked={useMonospace}
              onCheckedChange={setUseMonospace}
              className="data-[state=checked]:bg-blue-600"
            />
            <span className="text-xs opacity-70">{useMonospace ? "Monospace" : "Sans-serif"}</span>
          </div>

          <div className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            <Label className="text-sm">Line Numbers</Label>
            <Switch
              checked={lineNumbers}
              onCheckedChange={setLineNumbers}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-sm">Word Wrap</Label>
            <Switch checked={wordWrap} onCheckedChange={setWordWrap} className="data-[state=checked]:bg-blue-600" />
          </div>

          <div className="ml-auto text-xs opacity-70">
            {textContent.split("\n").length} lines • {textContent.length} characters
          </div>
        </div>

        {/* Text Content */}
        <div
          ref={containerRef}
          className="rounded-lg shadow-lg overflow-auto transition-all duration-300"
          style={getThemeStyles()}
        >
          <div
            className="p-6 min-h-[70vh]"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
            }}
          >
            {renderTextWithLineNumbers()}
          </div>
        </div>
      </div>
    </div>
  )
}
