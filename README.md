# Tara ✈️

**Travel Together, Book Better**

All-in-one travel platform for the Philippines. Plan trips, discover content, and book with confidence.

---

## 🎯 What is Tara?

Tara is a travel platform that combines:
- **📝 Free Trip Planner** - Create detailed itineraries, tag places, book services
- **📸 Travel Content** - Social feed with posts, reels, and stories from real travelers
- **🏨 Booking System** - Hotels, tours, activities, and transport
- **💰 Creator Monetization** - Content creators earn through affiliate commissions
- **🇵🇭 Built for Philippines** - Local payments (GCash, Maya), Filipino language support

---

## 🚀 Why Tara?

### Our Competitive Advantages

**vs Boop (Our Main Competitor)**
- ✅ Hyper-local Philippines focus (not global)
- ✅ FREE comprehensive trip planner (not just viewing itineraries)
- ✅ Budget travel oriented (not luxury-only)
- ✅ Community-driven (real travelers, not just influencers)
- ✅ Local payment methods (GCash, Maya, over-counter)
- ✅ Direct supplier relationships (better prices)
- ✅ Higher creator commissions (6% vs ~3-5%)

**vs Booking.com / Agoda**
- ✅ Integrated trip planner
- ✅ Social content for inspiration
- ✅ Creator affiliate program
- ✅ Better local payment options

**vs Instagram / TikTok**
- ✅ Direct booking from content
- ✅ Integrated trip planning
- ✅ Better creator monetization tools

---

## 📁 Project Structure

This project follows **Clean Architecture** principles:

```
src/
├── app/                      # Next.js App Router (UI Layer)
│   ├── (public)/            # Landing pages
│   ├── (auth)/              # Login, register
│   ├── (app)/               # Main app (feed, planner, bookings)
│   ├── (creator)/           # Creator dashboard
│   ├── (supplier)/          # Supplier dashboard
│   └── api/                 # API routes
│
├── features/                 # Feature modules (Business Logic)
│   ├── auth/
│   ├── social/              # Posts, comments, likes
│   ├── planner/             # Trip planner
│   ├── booking/             # Booking system
│   ├── payment/             # Payment processing
│   └── ...
│
├── shared/                   # Shared/Reusable code
│   ├── components/ui/       # Button, Input, Modal, etc.
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Utility functions
│   └── types/               # Shared TypeScript types
│
├── lib/                      # Core libraries
│   ├── supabase/            # Supabase client
│   ├── api/                 # API client
│   └── integrations/        # Third-party integrations
│
├── repositories/             # Data Access Layer
├── services/                 # Business Logic Layer
└── config/                   # App configuration
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React, TypeScript, Tailwind CSS |
| **State Management** | React Query, Zustand |
| **Forms** | React Hook Form + Zod |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **Storage** | Supabase Storage |
| **Payments** | PayMongo, Xendit |
| **Maps** | Google Maps API |
| **Email** | SendGrid |
| **SMS** | Twilio / Semaphore |
| **Hosting** | Vercel / Railway |

---

## 🏁 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn
- Supabase account (free tier)
- Code editor (VS Code recommended)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be provisioned (2-3 minutes)
3. Go to **SQL Editor** in your Supabase dashboard
4. Open `supabase-schema.sql` from this project
5. Copy and paste the entire SQL code into the editor
6. Click **Run** to create all tables and functions

This will create:
- All necessary tables (users, posts, itineraries, bookings, etc.)
- Database triggers and functions
- Row Level Security (RLS) policies
- Indexes for performance

### 3. Get Your Supabase Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (`https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (keep this secret!)

### 4. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app!

---

## 📚 Documentation

- **[FEATURE_ROADMAP.md](./FEATURE_ROADMAP.md)** - Complete feature roadmap (MVP → Phase 3)
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Clean architecture documentation
- **[FUNDING_GUIDE.md](./FUNDING_GUIDE.md)** - How to raise funds in the Philippines

---

## 🎯 Development Roadmap

### Phase 1: MVP (Months 1-6)
- [x] Project setup with clean architecture
- [x] Database schema
- [ ] User authentication (login, register)
- [ ] User profiles
- [ ] Social feed (post creation, viewing)
- [ ] Trip planner (create itineraries)
- [ ] Basic hotel listings
- [ ] Simple booking flow
- [ ] Payment integration (GCash + cards)

**Goal:** Launch with 100-500 users, 10-50 suppliers

### Phase 2: Growth (Months 7-12)
- [ ] Creator dashboard & analytics
- [ ] Affiliate tracking
- [ ] Advanced search & filters
- [ ] Maps integration (Google Maps)
- [ ] Reviews & ratings
- [ ] Messaging between users
- [ ] Supplier dashboard
- [ ] More payment methods (Maya, bank transfer)

**Goal:** 10,000 users, 500+ suppliers, ₱1M+ GMV

### Phase 3: Scale (Year 2+)
- [ ] Mobile apps (iOS + Android)
- [ ] Live streaming
- [ ] Groups & communities
- [ ] AI trip planner
- [ ] Flight booking
- [ ] Multiple languages (Tagalog, Bisaya)
- [ ] International expansion

**Goal:** 100,000+ users, market leader in Philippines

---

## 💡 Key Features

### 1. Free Trip Planner (Key Differentiator!)
- Create unlimited itineraries
- Day-by-day planning
- Tag places and activities
- **Book directly from planner** (hotels, tours, transport)
- Add notes and budget tracking
- Share with friends
- Collaborate on group trips
- Export to PDF

### 2. Social Travel Content
- Post photos and videos
- Stories (24-hour expiring content)
- Reels (short-form video)
- Like, comment, share
- Follow travelers and creators
- Location tags
- Hashtags
- Save favorite posts

### 3. Booking System
- Hotels, resorts, hostels
- Tours and activities
- Transport (van, boat)
- Filter by price, rating, location
- Read reviews
- Instant confirmation
- Multiple payment methods

### 4. Creator Monetization
- Earn 6% commission on bookings
- Affiliate links in posts
- Analytics dashboard
- Track earnings
- Monthly payouts (GCash or bank)

### 5. Local-First Features
- GCash payment
- Maya (PayMaya) payment
- Over-the-counter payment (7-Eleven, etc.)
- Filipino language support
- Peso (₱) currency
- Philippine destinations focus

---

## 💰 Business Model

### Revenue Streams

1. **Commission on Bookings** (Primary)
   - 12% platform fee on all bookings
   - Lower than Booking.com (15-25%)

2. **Creator Affiliates**
   - Creators earn 6% commission
   - Platform keeps 6% (12% - 6%)

3. **Supplier Subscriptions**
   - Free tier: Basic listing
   - Pro (₱999/mo): Featured listings, analytics
   - Enterprise (₱2,999/mo): Multiple properties

4. **Premium Features** (Future)
   - Ad-free experience
   - Advanced analytics
   - Priority support

---

## 📈 Go-to-Market Strategy

### Phase 1: Launch (Months 1-3)
- Soft launch in Metro Manila
- Recruit 20-50 micro-influencers
- Partner with 50-100 suppliers in popular destinations
- Content marketing (blog, SEO)

### Phase 2: Growth (Months 4-6)
- Expand to Boracay, Palawan, Siargao
- Recruit 100+ creators
- PR & media coverage
- Partnerships with tourism boards

### Phase 3: Scale (Months 7-12)
- National coverage (all major provinces)
- 1,000+ suppliers
- 100,000+ users
- Mobile app launch
- Fundraising (Seed round: ₱5-20M)

---

## 🤝 For Investors

### Market Opportunity
- **Philippines travel market:** $6.7B (2025)
- **Population:** 110M (50% under 30)
- **Growing middle class:** Rising domestic travel
- **Internet penetration:** 73% (80M users)
- **Mobile-first:** 99% access via mobile

### Traction Goals (Year 1)
- **Users:** 10,000+
- **Suppliers:** 500+
- **GMV:** ₱50M+
- **Monthly growth:** 20%+

### Funding Needs
- **Pre-Seed:** ₱1-2M (bootstrapping + IdeaSpace/QBO)
- **Seed Round:** ₱5-20M (angels + accelerators)
- **Series A:** ₱50-200M (VCs)

See [FUNDING_GUIDE.md](./FUNDING_GUIDE.md) for detailed fundraising strategy.

---

## 🙋 Contributing

As this is a startup project, we're not accepting external contributions at this time. However, if you're interested in:
- **Joining the team** - Reach out!
- **Becoming a partner supplier** - List your business
- **Being an early creator** - Apply for our creator program

---

## 📄 License

Proprietary - All rights reserved.

---

## 📞 Contact

- **Email:** hello@tara.ph (coming soon)
- **Website:** https://tara.ph (coming soon)
- **Facebook:** @taraph (coming soon)
- **Instagram:** @taraph (coming soon)

---

## 🙏 Acknowledgments

Built with:
- Next.js team for the amazing framework
- Supabase for the incredible developer experience
- Philippine startup ecosystem
- All the travel creators and suppliers who inspire us

---

**Made with ❤️ for the Philippines**

*Tara na! Let's travel together!*
