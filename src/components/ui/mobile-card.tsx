import { cn } from "@/lib/utils"

interface MobileCardProps {
  children: React.ReactNode
  className?: string
}

export function MobileCard({ children, className }: MobileCardProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-3 space-y-2 sm:hidden", className)}>
      {children}
    </div>
  )
}

interface MobileCardFieldProps {
  label: string
  children: React.ReactNode
  className?: string
}

export function MobileCardField({ label, children, className }: MobileCardFieldProps) {
  return (
    <div className={cn("flex items-center justify-between text-sm", className)}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{children}</span>
    </div>
  )
}

interface MobileCardActionsProps {
  children: React.ReactNode
}

export function MobileCardActions({ children }: MobileCardActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1 pt-2 border-t">
      {children}
    </div>
  )
}
