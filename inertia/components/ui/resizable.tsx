import React from 'react'
import { cn } from '~/lib/utils'
import { GripVertical } from 'lucide-react'
import * as ResizablePrimitive from 'react-resizable-panels'

/**
 * `react-resizable-panels` v4 renamed `PanelGroup` to `Group`,
 * `PanelResizeHandle` to `Separator`, and `direction` to `orientation`. The
 * group no longer emits a direction data attribute, so we mirror it here to
 * keep the orientation-aware handle styles working.
 */
const ResizablePanelGroup = ({
  className,
  orientation = 'horizontal',
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Group>) => (
  <ResizablePrimitive.Group
    data-slot="resizable-panel-group"
    data-orientation={orientation}
    orientation={orientation}
    className={cn('group/resizable flex h-full w-full', className)}
    {...props}
  />
)

const ResizablePanel = ResizablePrimitive.Panel

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Separator> & {
  withHandle?: boolean
}) => (
  <ResizablePrimitive.Separator
    data-slot="resizable-handle"
    className={cn(
      'relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 group-data-[orientation=vertical]/resizable:h-px group-data-[orientation=vertical]/resizable:w-full group-data-[orientation=vertical]/resizable:after:left-0 group-data-[orientation=vertical]/resizable:after:h-1 group-data-[orientation=vertical]/resizable:after:w-full group-data-[orientation=vertical]/resizable:after:-translate-y-1/2 group-data-[orientation=vertical]/resizable:after:translate-x-0 group-data-[orientation=vertical]/resizable:[&>div]:rotate-90',
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </ResizablePrimitive.Separator>
)

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }
