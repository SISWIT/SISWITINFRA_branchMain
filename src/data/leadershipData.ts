export interface LeadershipMember {
  id: string;
  name: string;
  role: string;
  description: string;
  imageUrl?: string;
  linkedIn?: string;
  email?: string;
  contactNote?: string;
  imagePosition?: string;
}

export const leadershipData: LeadershipMember[] = [
  {
    id: "nishant-raj",
    name: "Nishant Raj",
    role: "Founder",
    description: "Drives SISWIT vision, strategic direction, and long-term growth.",
    imageUrl: "/nishant.jpeg",
    linkedIn: "https://www.linkedin.com/in/nishant-raj-88102a371/",
    email: "rnishant75@gmail.com",
    imagePosition: "center 20%",
  },
  {
    id: "anand-mishra",
    name: "Anand Mishra",
    role: "CTO & COO",
    description: "Leads technology execution and operational scale across the company.",
    imageUrl: "/anand.jpeg",
    linkedIn: "https://www.linkedin.com/in/anand-ranjan-812b2b260?utm_source=share_via&utm_content=profile&utm_medium=member_android",
    email: "anandraj321a@gmail.com",
    imagePosition: "center 22%",
  },
  {
    id: "pooja",
    name: "Pooja",
    role: "CFO",
    description: "Owns financial planning, controls, and sustainable business performance.",
    imageUrl: "/Pooja.jpeg",
    linkedIn: "https://www.linkedin.com/in/pooja-kumari-b77478270?utm_source=share_via&utm_content=profile&utm_medium=member_android",
    email: "kumaripooja062001@gmail.com",
    imagePosition: "center 16%",
  },
  {
    id: "bipul-kumar",
    name: "Bipul Kumar",
    role: "CMO",
    description: "Builds brand, growth marketing strategy, and market positioning.",
    imageUrl: "/Bipul.jpeg",
    linkedIn: "https://www.linkedin.com/in/bipul-yadav-b191332b1/",
    email: "bipulkumaryadav720999@gmail.com",
    imagePosition: "center 18%",
  },
  {
    id: "ankur-singh",
    name: "Ankur Singh",
    role: "Co-Founder",
    description: "Supports strategic initiatives and cross-functional business growth.",
    contactNote: "Undisclosed",
  },
  {
    id: "sunny-singh",
    name: "Sunny Singh",
    role: "VP - Engineering",
    description: "Leads engineering delivery, architecture quality, and execution speed.",
    imageUrl: "/Sunny.jpeg",
    linkedIn: "https://www.linkedin.com/in/sunny-singh-0a6655341/",
    email: "sunnyk7rajput@gnail.com",
    imagePosition: "center 20%",
  },
];
