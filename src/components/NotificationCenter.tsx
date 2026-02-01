import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useErrorStore } from "./store"
import { useEffect, useState } from "react"

export function NotificationCenter() {
  const backendErrorList = useErrorStore((state) => state.currentBackendErrors)

  // const [unreadCount, setUnreadCount] = useState(0)
  // const [isOpen, setIsOpen] = useState(false);

  // useEffect(() => {
  //   if(!isOpen) { // if error list updates and comp is not open then update unread count
  //     setUnreadCount((unreadCount) => unreadCount + 1)
  //   }
  // }, [backendErrorList.length])

  // const handleNotificationOpen = (open) => {
  //   setIsOpen(open)

  //   if (open) {
  //     setUnreadCount(0)
  //   }
  // }

  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [lastSeenCount, setLastSeenCount] = useState(backendErrorList.length)

  useEffect(() => {
    if (!isOpen) {
      const diff = backendErrorList.length - lastSeenCount
      setUnreadCount(diff > 0 ? diff : 0)
    } else {
      setLastSeenCount(backendErrorList.length)
      setUnreadCount(0)
    }
  }, [backendErrorList.length, isOpen, lastSeenCount])

  const handleNotificationOpen = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      setUnreadCount(0)
      setLastSeenCount(backendErrorList.length)
    }
  }

  return (
    <Popover onOpenChange={handleNotificationOpen}>
      <PopoverTrigger>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-3 w-3 flex items-center justify-center rounded-full p-0 text-[10px]"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-75 p-0" align="center">
        <div className="p-2 font-medium text-sm">Notifications</div>
        <ScrollArea className="h-[375px]">
          <div className="flex flex-col gap-1 p-2">
            {backendErrorList.map((notification, index) => (
              <div className="flex flex-col gap-2 p-2">
                {backendErrorList.map((notification, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-1 rounded-md p-3 text-xs transition-colors hover:bg-muted/50 bg-muted/20 border border-red-500/30"
                  >
                    <div className="text-sm font-bold text-red-600 dark:text-red-400">
                      {`Error: ${notification.err_code}`}
                    </div>
                    {notification.library_generated_error_desc?.toLowerCase() !== "n/a" && (
                      <div className="font-medium text-[12px] text-foreground leading-tight">
                        {notification.library_generated_error_desc}
                      </div>
                    )}
                    {notification.user_error_string_desc?.toLowerCase() !== "n/a" && (
                      <div className="text-[12px] text-muted-foreground line-clamp-2 italic">
                        {notification.user_error_string_desc}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}