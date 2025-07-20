"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface WordViewerProps {
  file: File
  zoom: number
  theme: "dark" | "sepia" | "high-contrast"
  contrast: number
  brightness: number
  onTotalPagesChange: (total: number) => void
}

export default function WordViewer({ file, zoom, theme, contrast, brightness, onTotalPagesChange }: WordViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [htmlContent, setHtmlContent] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const loadWordDocument = async () => {
      setIsLoading(true)
      setError("")

      try {
        // Dynamically import mammoth
        const mammoth = await import("mammoth")

        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.convertToHtml({ arrayBuffer })

        if (result.messages.length > 0) {
          console.warn("Conversion warnings:", result.messages)
        }

        setHtmlContent(result.value)
        onTotalPagesChange(1) // Word docs are continuous, so we set to 1
        setIsLoading(false)
      } catch (error) {
        console.error("Error loading Word document:", error)
        setError("Failed to load Word document. Please try a different file.")
        setIsLoading(false)
      }
    }

    loadWordDocument()
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

  const getContentStyles = () => {
    const textOpacity = Math.min(1, 0.7 + (contrast - 1) * 0.3)
    const headingOpacity = Math.min(1, 0.9 + (contrast - 1) * 0.1)

    switch (theme) {
      case "sepia":
        return `
          .word-content h1, .word-content h2, .word-content h3, .word-content h4, .word-content h5, .word-content h6 {
            color: rgba(244, 228, 193, ${headingOpacity}) !important;
            font-weight: 600;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
          }
          .word-content p, .word-content li, .word-content span, .word-content div {
            color: rgba(232, 213, 183, ${textOpacity}) !important;
            line-height: 1.7;
          }
          .word-content strong, .word-content b {
            color: rgba(244, 228, 193, ${headingOpacity}) !important;
            font-weight: 600;
          }
        `
      case "high-contrast":
        return `
          .word-content h1, .word-content h2, .word-content h3, .word-content h4, .word-content h5, .word-content h6 {
            color: rgba(255, 255, 255, ${headingOpacity}) !important;
            font-weight: 700;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            text-shadow: 0 0 2px rgba(255, 255, 255, 0.5);
          }
          .word-content p, .word-content li, .word-content span, .word-content div {
            color: rgba(255, 255, 255, ${textOpacity}) !important;
            line-height: 1.8;
          }
          .word-content strong, .word-content b {
            color: rgba(255, 255, 255, ${headingOpacity}) !important;
            font-weight: 700;
            text-shadow: 0 0 1px rgba(255, 255, 255, 0.5);
          }
        `
      default:
        return `
          .word-content h1, .word-content h2, .word-content h3, .word-content h4, .word-content h5, .word-content h6 {
            color: rgba(249, 250, 251, ${headingOpacity}) !important;
            font-weight: 600;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
          }
          .word-content p, .word-content li, .word-content span, .word-content div {
            color: rgba(229, 231, 235, ${textOpacity}) !important;
            line-height: 1.7;
          }
          .word-content strong, .word-content b {
            color: rgba(243, 244, 246, ${headingOpacity}) !important;
            font-weight: 600;
          }
          .word-content ul, .word-content ol {
            color: rgba(229, 231, 235, ${textOpacity}) !important;
            padding-left: 1.5em;
          }
        `
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-gray-200">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading Word document...</span>
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
      <style dangerouslySetInnerHTML={{ __html: getContentStyles() }} />
      <div
        ref={containerRef}
        className="w-full max-w-4xl rounded-lg shadow-lg overflow-hidden transition-all duration-300"
        style={getThemeStyles()}
      >
        <div
          className="word-content p-8 min-h-[80vh] prose prose-lg max-w-none"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
            fontSize: `${16 * zoom}px`,
            lineHeight: 1.7,
          }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  )
}
