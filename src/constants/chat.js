const createTime = (value) => new Date(`2026-04-04T${value}:00`).getTime();
const yesterdayTime = new Date("2026-04-03T18:30:00").getTime();

export const initialChats = [
  {
    id: 1,
    name: "Olivia Carter",
    avatar: "OC",
    accent: "#5aa9ff",
    status: "online",
    lastSeen: "Active now",
    unreadCount: 2,
    isTyping: false,
    updatedAt: createTime("09:42"),
    messages: [
      { id: "1-1", text: "Morning! Did the onboarding screens feel clear enough?", time: "09:34", sender: "other" },
      { id: "1-2", text: "Much cleaner now. I tightened the spacing and simplified the CTA copy.", time: "09:37", sender: "me" },
      { id: "1-3", text: "Perfect. I'm polishing the final pass and sending it in a minute.", time: "09:42", sender: "other" },
    ],
  },
  {
    id: 2,
    name: "Design Crew",
    avatar: "DC",
    accent: "#7bb8ff",
    status: "4 members online",
    lastSeen: "Updated 12 min ago",
    unreadCount: 0,
    isTyping: false,
    updatedAt: createTime("08:15"),
    messages: [
      { id: "2-1", text: "Let's keep the dashboard cards airy and reduce the border noise.", time: "08:02", sender: "other" },
      { id: "2-2", text: "Agreed. The softer blue accents are working well with the white background.", time: "08:09", sender: "me" },
      { id: "2-3", text: "Ship the refined version after lunch and I'll review it.", time: "08:15", sender: "other" },
    ],
  },
  {
    id: 3,
    name: "Noah Bennett",
    avatar: "NB",
    accent: "#8bc5ff",
    status: "offline",
    lastSeen: "Last seen 1 hour ago",
    unreadCount: 1,
    isTyping: false,
    updatedAt: createTime("07:56"),
    messages: [
      { id: "3-1", text: "Can you send the revised component structure?", time: "07:50", sender: "other" },
      { id: "3-2", text: "Yes, I split it into Sidebar, ChatWindow, MessageBubble, and InputBox.", time: "07:56", sender: "me" },
    ],
  },
  {
    id: 4,
    name: "Product Updates",
    avatar: "PU",
    accent: "#65c0ff",
    status: "Channel",
    lastSeen: "Pinned announcement",
    unreadCount: 0,
    isTyping: false,
    updatedAt: yesterdayTime,
    messages: [
      { id: "4-1", text: "Sprint review moved to tomorrow morning. Notes are in the shared doc.", time: "Yesterday", sender: "other" },
    ],
  },
];
