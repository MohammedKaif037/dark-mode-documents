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
  onPageChange,
  onTotalPagesChange,
}: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const autoScrollRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const loadPDF = async () => {
      setIsLoading(true)
      try {
        // Dynamically import PDF.js
        const pdfjsLib = await import("pdfjs-dist")

        // Set worker source to use unpkg CDN which is more reliable
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`

        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

        setPdfDoc(pdf)
        onTotalPagesChange(pdf.numPages)
        setIsLoading(false)
      } catch (error) {
        console.error("Error loading PDF:", error)
        setIsLoading(false)
      }
    }

    loadPDF()
  }, [file, onTotalPagesChange])

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return

    const renderPage = async () => {
      const canvas = canvasRef.current!
      const ctx = canvas.getContext("2d")!

      const page = await pdfDoc.getPage(currentPage)
      const viewport = page.getViewport({ scale: zoom, rotation })

      canvas.height = viewport.height
      canvas.width = viewport.width

      // Apply theme-specific canvas styling
      if (theme === "dark") {
        ctx.fillStyle = "#111827" // gray-900
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      } else if (theme === "sepia") {
        ctx.fillStyle = "#fefbf3" // warm background
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      } else if (theme === "high-contrast") {
        ctx.fillStyle = "#000000"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      }

      await page.render(renderContext).promise

      // Apply theme-specific filters
      if (theme === "dark") {
        ctx.globalCompositeOperation = "difference"
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.globalCompositeOperation = "source-over"
      } else if (theme === "sepia") {
        // Apply sepia filter
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]

          data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189)
          data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168)
          data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131)
        }

        ctx.putImageData(imageData, 0, 0)
      }
    }

    renderPage()
  }, [pdfDoc, currentPage, zoom, rotation, theme])

  useEffect(() => {
    if (autoScroll && pdfDoc) {
      const interval = 3000 / scrollSpeed // Base interval adjusted by speed

      autoScrollRef.current = setInterval(() => {
        onPageChange((prev) => {
          if (prev >= pdfDoc.numPages) {
            return 1 // Loop back to first page
          }
          return prev + 1
        })
      }, interval)

      return () => {
        if (autoScrollRef.current) {
          clearInterval(autoScrollRef.current)
        }
      }
    }
  }, [autoScroll, scrollSpeed, pdfDoc, onPageChange])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading PDF...</span>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex justify-center">
      <canvas
        ref={canvasRef}
        className="max-w-full h-auto shadow-lg rounded-lg"
        style={{
          filter: theme === "high-contrast" ? "contrast(1.5)" : "none",
        }}
      />
    </div>
  )
}
