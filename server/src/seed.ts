/**
 * Seed script — run with:  npx tsx src/seed.ts
 * Drops existing users & posts, then inserts fresh dummy data.
 */
import "dotenv/config";
import mongoose from "mongoose";
import User from "./models/User.js";
import Post from "./models/Post.js";

const URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/nexus";

// ── Helpers ──────────────────────────────────────────────────────────────────

const avatar = (name: string, bg = "7c6ff7") =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&size=200&bold=true`;

const cover = (seed: string) => `https://picsum.photos/seed/${seed}/1200/400`;

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// ── Raw user definitions ──────────────────────────────────────────────────────

const RAW_USERS = [
  {
    firstName: "Arjun",
    lastName: "Sharma",
    email: "arjun@nexus.dev",
    password: "password123",
    bio: "Full-stack dev who loves building things for the web. Coffee addict ☕",
    location: "Mumbai, India",
    occupation: "Software Engineer",
    education: "IIT Bombay",
    website: "https://arjun.dev",
    avatar: avatar("Arjun Sharma", "7c6ff7"),
    coverPhoto: cover("arjun"),
  },
  {
    firstName: "Priya",
    lastName: "Mehta",
    email: "priya@nexus.dev",
    password: "password123",
    bio: "UX designer passionate about accessible, beautiful interfaces 🎨",
    location: "Bengaluru, India",
    occupation: "UX Designer",
    education: "NID Ahmedabad",
    website: "https://priya.design",
    avatar: avatar("Priya Mehta", "a78bfa"),
    coverPhoto: cover("priya"),
  },
  {
    firstName: "Rohan",
    lastName: "Verma",
    email: "rohan@nexus.dev",
    password: "password123",
    bio: "Backend engineer. Obsessed with distributed systems and clean code 🚀",
    location: "Pune, India",
    occupation: "Backend Engineer",
    education: "BITS Pilani",
    website: "",
    avatar: avatar("Rohan Verma", "06b6d4"),
    coverPhoto: cover("rohan"),
  },
  {
    firstName: "Sneha",
    lastName: "Patel",
    email: "sneha@nexus.dev",
    password: "password123",
    bio: "AI/ML researcher | Making machines think better 🤖",
    location: "Hyderabad, India",
    occupation: "ML Engineer",
    education: "IISc Bengaluru",
    website: "https://sneha.ai",
    avatar: avatar("Sneha Patel", "f59e0b"),
    coverPhoto: cover("sneha"),
  },
  {
    firstName: "Vikram",
    lastName: "Singh",
    email: "vikram@nexus.dev",
    password: "password123",
    bio: "DevOps enthusiast. Kubernetes, Docker, and endless YAML files 😅",
    location: "Delhi, India",
    occupation: "DevOps Engineer",
    education: "DTU Delhi",
    website: "",
    avatar: avatar("Vikram Singh", "10b981"),
    coverPhoto: cover("vikram"),
  },
  {
    firstName: "Ananya",
    lastName: "Iyer",
    email: "ananya@nexus.dev",
    password: "password123",
    bio: "Product manager building products people love. Reader. Marathoner 🏃‍♀️",
    location: "Chennai, India",
    occupation: "Product Manager",
    education: "IIM Ahmedabad",
    website: "",
    avatar: avatar("Ananya Iyer", "ef4444"),
    coverPhoto: cover("ananya"),
  },
  {
    firstName: "Karan",
    lastName: "Joshi",
    email: "karan@nexus.dev",
    password: "password123",
    bio: "Mobile dev (React Native & Flutter). Building apps millions use 📱",
    location: "Jaipur, India",
    occupation: "Mobile Developer",
    education: "MNIT Jaipur",
    website: "https://karanjoshi.in",
    avatar: avatar("Karan Joshi", "f97316"),
    coverPhoto: cover("karan"),
  },
  {
    firstName: "Divya",
    lastName: "Nair",
    email: "divya@nexus.dev",
    password: "password123",
    bio: "Cybersecurity analyst. Ethical hacker. Making the internet safer 🔐",
    location: "Kochi, India",
    occupation: "Security Analyst",
    education: "NIT Calicut",
    website: "",
    avatar: avatar("Divya Nair", "8b5cf6"),
    coverPhoto: cover("divya"),
  },
  {
    firstName: "Rahul",
    lastName: "Gupta",
    email: "rahul@nexus.dev",
    password: "password123",
    bio: "Startup founder | ex-Google | Helping early-stage startups scale 🌱",
    location: "Bengaluru, India",
    occupation: "Founder & CEO",
    education: "IIT Delhi",
    website: "https://rahulgupta.co",
    avatar: avatar("Rahul Gupta", "0ea5e9"),
    coverPhoto: cover("rahul"),
  },
  {
    firstName: "Meera",
    lastName: "Krishnan",
    email: "meera@nexus.dev",
    password: "password123",
    bio: "Data scientist | Turning raw data into business insights 📊",
    location: "Coimbatore, India",
    occupation: "Data Scientist",
    education: "Anna University",
    website: "",
    avatar: avatar("Meera Krishnan", "ec4899"),
    coverPhoto: cover("meera"),
  },
];

// ── Post content pool ─────────────────────────────────────────────────────────

const POST_CONTENTS = [
  "Just shipped a new feature after three days of debugging. The bug was a missing semicolon. 😅 #developerlife",
  "Hot take: good variable names save more time than any clever algorithm. Name your variables like you're writing documentation.",
  "Morning ritual: coffee → emails → question every career decision I've ever made → more coffee ☕",
  "Spent the whole evening setting up my dev environment. Wrote exactly zero lines of actual code. Productive day! 🙃",
  "The best code is no code. Every line you write is a line you have to maintain. Think before you type.",
  "Just got back from a team off-site. Now I understand why remote work exists. 🏔️",
  "AI tools are incredible but they still can't figure out why my CSS isn't centered. Some things are eternal mysteries.",
  "Three months into my new role and I finally feel like I know what I'm doing. Imposter syndrome is real but temporary 💪",
  "Reminder: it's okay to not know everything. It's NOT okay to pretend you do. Ask questions, learn, grow.",
  "Stack Overflow went down for 20 minutes today. I witnessed 10 million developers simultaneously rediscover the feeling of helplessness.",
  "Open source contribution tip: start with documentation. It's undervalued, always needed, and a great way to learn the codebase.",
  "Pair programming session today reminded me that two brains are genuinely better than one. Don't code alone on hard problems.",
  "Just deployed to production on a Friday. Praying to the cloud gods 🙏 #YOLO #NotReally",
  "The most important soft skill in tech? Writing clearly. Your PR descriptions, Slack messages, and docs matter enormously.",
  'Favourite part of being a developer: the "aha!" moment when everything clicks. That dopamine hit never gets old ✨',
  "Code review culture makes or breaks a team. Feedback should be kind, specific, and actionable. Always.",
  "Learned more in six months of actual work than in four years of college. Both matter, but differently.",
  "Unpopular opinion: meetings can actually be productive if they have a clear agenda and end on time.",
  "New personal rule: if I've fixed the same bug twice, I write a test for it. Future me will be grateful.",
  "The gap between a junior and senior dev isn't lines of code — it's knowing when NOT to write code.",
];

const COMMENT_POOL = [
  "This!! 💯",
  "Absolutely agree 🙌",
  "So true lol",
  "Needed to hear this today",
  "Screenshot saved for future me",
  "The Friday deploy fear is REAL",
  "Been there 😅",
  "This is the way",
  "Haha story of my life",
  "Couldn't agree more!",
  "Tag yourself I'm the missing semicolon bug",
  "Senior dev wisdom right here",
  "Adding this to my list of reasons I work remotely",
  "Facts 🔥",
  "The documentation part hit different",
  "Wish someone told me this earlier",
];

// ── Friendship map (0-indexed) ────────────────────────────────────────────────
// Pairs that will be mutual friends

const FRIEND_PAIRS = [
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [1, 2],
  [1, 5],
  [1, 6],
  [2, 5],
  [2, 7],
  [3, 4],
  [3, 8],
  [4, 5],
  [4, 9],
  [5, 6],
  [5, 8],
  [6, 7],
  [6, 9],
  [7, 8],
  [8, 9],
];

// ── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(URI);
  console.log("✓ Connected to MongoDB");

  // Clear
  await Promise.all([User.deleteMany({}), Post.deleteMany({})]);
  console.log("✓ Cleared existing users & posts");

  // Create users one-by-one so the pre-save password-hash hook fires
  const users = await Promise.all(
    RAW_USERS.map(u => new User({ ...u, isOnline: false }).save()),
  );
  console.log(`✓ Created ${users.length} users (passwords hashed)`);

  // Wire up friendships
  const friendOps = FRIEND_PAIRS.flatMap(([a, b]) => [
    User.findByIdAndUpdate(users[a]._id, {
      $addToSet: { friends: users[b]._id },
    }),
    User.findByIdAndUpdate(users[b]._id, {
      $addToSet: { friends: users[a]._id },
    }),
  ]);
  await Promise.all(friendOps);
  console.log(
    `✓ Wired ${FRIEND_PAIRS.length} friendships (${FRIEND_PAIRS.length * 2} edges)`,
  );

  // Create posts — 2 posts per user, random likes & comments
  const postDocs: object[] = [];

  for (const user of users) {
    const otherUsers = users.filter((u) => !u._id.equals(user._id));

    for (let p = 0; p < 2; p++) {
      // Random 3-6 likers, pulled from other users
      const likerCount = 3 + Math.floor(Math.random() * 4);
      const shuffled = [...otherUsers].sort(() => Math.random() - 0.5);
      const likers = shuffled.slice(0, likerCount).map((u) => u._id);

      // 2-4 comments
      const commentCount = 2 + Math.floor(Math.random() * 3);
      const commenters = shuffled.slice(likerCount, likerCount + commentCount);
      const comments = commenters.map((u) => ({
        author: u._id,
        content: pick(COMMENT_POOL),
        createdAt: new Date(
          Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
        ),
      }));

      postDocs.push({
        author: user._id,
        content: pick(POST_CONTENTS),
        media: [],
        likes: likers,
        comments,
        shares: [],
        privacy: pick(["public", "public", "public", "friends"]),
        feeling: "",
        createdAt: new Date(
          Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000,
        ),
      });
    }
  }

  await Post.insertMany(postDocs);
  console.log(`✓ Created ${postDocs.length} posts with likes & comments`);

  // Print login credentials
  console.log("\n── Login credentials (all passwords: password123) ──");
  RAW_USERS.forEach((u) => console.log(`  ${u.email}`));

  await mongoose.disconnect();
  console.log("\n✓ Done — database seeded!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
