"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

interface PDFViewerProps {
  file: File
  currentPage: number
  zoom: number
  rotation: number
  theme: "dark" | "sepia" | "high-contrast"
  autoScroll: boolean
  scrollSpeed: number
  contrast: number
  brightness: number
  onPageChange: (page: number) => void
  onTotalPagesChange: (total: number) => void
}

export default function PDFViewer({
  file,
  currentPage,
  zoom,
  rotation,
  theme,
  autoScroll,
  scrollSpeed,
  contrast,
  brightness,
  onPageChange,
  onTotalPagesChange,
}: PDFViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [pdfUrl, setPdfUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const autoScrollRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const loadPDF = async () => {
      setIsLoading(true)
      try {
        // Create object URL for the PDF file
        const url = URL.createObjectURL(file)
        setPdfUrl(url)

        // For simplicity, we'll estimate total pages (this is a limitation of this approach)
        // In a real implementation, you'd want to use PDF.js properly
        onTotalPagesChange(100) // Placeholder - we can't easily get actual page count with iframe
        setIsLoading(false)
      } catch (error) {
        console.error("Error loading PDF:", error)
        setIsLoading(false)
      }
    }

    loadPDF()

    // Cleanup
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [file, onTotalPagesChange])

  useEffect(() => {
    if (autoScroll) {
      const interval = 3000 / scrollSpeed

      autoScrollRef.current = setInterval(() => {
        onPageChange((prev) => prev + 1)
      }, interval)

      return () => {
        if (autoScrollRef.current) {
          clearInterval(autoScrollRef.current)
        }
      }
    }
  }, [autoScroll, scrollSpeed, onPageChange])

  const getThemeStyles = () => {
    const baseFilter = `contrast(${contrast}) brightness(${brightness})`

    switch (theme) {
      case "sepia":
        return {
          filter: `sepia(0.8) hue-rotate(15deg) saturate(0.9) ${baseFilter}`,
          backgroundColor: "#2d2318",
          border: "2px solid #4a3728",
        }
      case "high-contrast":
        return {
          filter: `invert(1) ${baseFilter} saturate(1.2)`,
          backgroundColor: "#000000",
          border: "2px solid #333333",
        }
      default:
        return {
          filter: `invert(0.9) hue-rotate(180deg) ${baseFilter}`,
          backgroundColor: "#1f2937",
          border: "2px solid #374151",
        }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-gray-200">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading PDF...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <div
        className="w-full max-w-4xl rounded-lg overflow-hidden shadow-2xl transition-all duration-300"
        style={getThemeStyles()}
      >
        <iframe
          ref={iframeRef}
          src={`${pdfUrl}#page=${currentPage}&zoom=${zoom * 100}`}
          className="w-full h-[80vh] border-0"
          title="PDF Viewer"
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: "center center",
          }}
        />
      </div>
    </div>
  )
}
