import { cn } from "@/lib/utils"
import { HelpCircle } from "lucide-react"

interface HelpTextProps {
  text: string
  className?: string
}

export function HelpText({ text, className }: HelpTextProps) {
  return (
    <p className={cn("flex items-center gap-1.5 text-xs text-muted-foreground mt-1", className)}>
      <HelpCircle className="h-3 w-3 shrink-0" />
      {text}
    </p>
  )
}
