import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

const notifications = [
  {
    title: "Error: Database Connection",
    description: "Failed to connect to primary cluster.",
    time: "2 mins ago",
    unread: true,
  },
  {
    title: "Warning: High CPU Usage",
    description: "Server is running at 90% capacity.",
    time: "1 hour ago",
    unread: true,
  },
  {
    title: "Payment Declined",
    description: "Credit card ending in 4242 was rejected.",
    time: "3 hours ago",
    unread: false,
  },
  {
    title: "Deployment Failed",
    description: "The latest build failed to deploy.",
    time: "Yesterday",
    unread: false,
  },
]

export function NotificationCenter() {
  const unreadCount = notifications.filter((n) => n.unread).length

  return (
    <Popover>
      <PopoverTrigger>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center rounded-full p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 font-medium border-b">Notifications</div>
        <ScrollArea className="h-[300px]">
          <div className="flex flex-col gap-1 p-2">
            {notifications.map((notification, index) => (
              <div
                key={index}
                className={`flex flex-col gap-1 rounded-md p-3 text-sm transition-colors hover:bg-muted/50 ${
                  notification.unread ? "bg-muted/20 border-l-2 border-red-500" : ""
                }`}
              >
                <div className="font-semibold text-foreground">
                  {notification.title}
                </div>
                <div className="text-muted-foreground line-clamp-2">
                  {notification.description}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {notification.time}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}