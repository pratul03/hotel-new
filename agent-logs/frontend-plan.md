;# Frontend Development Plan — Airbnb Clone
> Created: March 11, 2026 | Status: ⏳ Not Started

---

## 1. Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js (App Router) | ^16.0.0 |
| Language | TypeScript | ^5.8.0 |
| Styling | TailwindCSS | ^4.1.0 |
| Component Library | shadcn/ui (with sidebar) | latest CLI |
| Icons | lucide-react | ^0.475.0 |
| Client State | Zustand | ^5.0.3 |
| Server State / Caching | TanStack React Query | ^5.66.0 |
| HTTP Client | Axios | ^1.8.4 |
| Forms | React Hook Form + Zod | ^7.54.0 / ^3.24.2 |
| Maps | react-leaflet + leaflet | ^4.2.1 / ^1.9.4 |
| Payment | Razorpay JS SDK | ^1.0.0 |
| Date Picker | react-day-picker | ^9.4.0 |
| Image Carousel | embla-carousel-react | ^8.5.2 |
| Toasts / Notifications | sonner | ^2.0.3 |
| Table | @tanstack/react-table | ^8.21.0 |
| Testing | Jest + @testing-library/react | ^29.7.0 / ^16.2.0 |
| E2E Testing | Playwright | ^1.50.0 |

---

## 2. Project Structure

```
frontend/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (Navbar, Footer, Providers)
│   ├── page.tsx                  # Homepage / Hotel search
│   ├── providers.tsx             # QueryClientProvider + Zustand init
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── verify-email/page.tsx
│   ├── search/page.tsx           # Search results page
│   ├── hotels/
│   │   └── [id]/
│   │       ├── page.tsx          # Hotel detail
│   │       └── rooms/
│   │           └── [roomId]/page.tsx  # Room detail
│   ├── bookings/
│   │   ├── page.tsx              # Booking history (guest)
│   │   └── [id]/page.tsx         # Single booking detail
│   ├── payment/
│   │   ├── success/page.tsx
│   │   └── failed/page.tsx
│   ├── messages/
│   │   ├── page.tsx              # Conversations list
│   │   └── [userId]/page.tsx     # Message thread
│   ├── notifications/page.tsx
│   ├── wishlist/page.tsx
│   ├── profile/
│   │   ├── page.tsx              # Edit profile
│   │   └── documents/page.tsx    # ID verification
│   ├── support/page.tsx
│   └── host/
│       ├── page.tsx              # Host dashboard
│       ├── bookings/page.tsx     # Incoming bookings
│       ├── hotels/
│       │   ├── page.tsx          # My hotels list
│       │   ├── new/page.tsx      # Add hotel
│       │   └── [id]/
│       │       ├── edit/page.tsx
│       │       ├── rooms/
│       │       │   ├── page.tsx
│       │       │   └── new/page.tsx
│       │       └── block-dates/page.tsx
│       └── verification/page.tsx
├── components/
│   ├── layout/                   # ★ Core shell — used on every authenticated page
│   │   ├── AppLayout.tsx         # Root shell: AppSidebar + TopNavbar + <main>
│   │   ├── AppSidebar.tsx        # shadcn <Sidebar> with nav items, user footer
│   │   ├── TopNavbar.tsx         # shadcn SidebarTrigger + breadcrumb + user menu
│   │   └── Footer.tsx
│   ├── ui/                       # shadcn/ui base components (auto-generated)
│   ├── common/                   # ★ Generic reusable system components
│   │   ├── DataTable/
│   │   │   ├── DataTable.tsx     # Main table: search bar, add button, table, pagination
│   │   │   ├── DataTableToolbar.tsx  # Search input + Add button row
│   │   │   ├── DataTablePagination.tsx  # Prev/Next + page numbers
│   │   │   └── DataTableRowActions.tsx  # Per-row edit/delete/view dropdown
│   │   ├── AppForm/
│   │   │   ├── AppForm.tsx       # Generic RHF + Zod form wrapper
│   │   │   ├── FormField.tsx     # Renders one field by type config
│   │   │   └── types.ts          # FieldConfig type definition
│   │   ├── AppCard/
│   │   │   ├── AppCard.tsx       # Generic card (default / compact / stat variants)
│   │   │   └── StatCard.tsx      # Dashboard KPI card (number + label + icon + trend)
│   │   ├── EmptyState.tsx
│   │   ├── PageLoader.tsx
│   │   ├── ConfirmDialog.tsx
│   │   └── ErrorBoundary.tsx
│   ├── shared/
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── StarRating.tsx
│   │   ├── PriceBreakdown.tsx
│   │   ├── ImageGallery.tsx      # Full-page hero gallery (hotel/room detail)
│   │   ├── ImageSlider.tsx       # Inline embla slider used inside AppCard
│   │   ├── DateRangePicker.tsx
│   │   ├── MapView.tsx
│   │   └── NotificationDropdown.tsx
│   ├── hotels/
│   │   ├── HotelCard.tsx
│   │   ├── HotelGrid.tsx
│   │   ├── HotelSearchBar.tsx
│   │   ├── FilterSidebar.tsx
│   │   ├── HotelGallery.tsx      # Hero gallery grid at top of hotel detail page
│   │   ├── AmenitiesList.tsx
│   │   └── ReviewsSection.tsx
│   ├── rooms/
│   │   ├── RoomCard.tsx
│   │   ├── RoomList.tsx
│   │   ├── AvailabilityChecker.tsx
│   │   └── PricingPanel.tsx
│   ├── booking/
│   │   ├── BookingForm.tsx
│   │   ├── BookingCard.tsx
│   │   ├── BookingStatusBadge.tsx
│   │   ├── CancelBookingModal.tsx
│   │   └── ExpiryCountdown.tsx
│   ├── payment/
│   │   ├── PayButton.tsx
│   │   └── PaymentStatusCard.tsx
│   ├── messages/
│   │   ├── ConversationCard.tsx
│   │   ├── MessageBubble.tsx
│   │   └── MessageInput.tsx
│   ├── reviews/
│   │   ├── ReviewCard.tsx
│   │   ├── ReviewForm.tsx
│   │   └── RatingBreakdown.tsx
│   ├── host/
│   │   ├── DashboardStats.tsx
│   │   ├── HotelForm.tsx
│   │   ├── RoomForm.tsx
│   │   ├── BlockDatesCalendar.tsx
│   │   └── ImageUploader.tsx
│   └── auth/
│       ├── LoginForm.tsx
│       └── RegisterForm.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useHotels.ts
│   ├── useBookings.ts
│   ├── useMessages.ts
│   ├── useNotifications.ts
│   ├── useWishlist.ts
│   ├── usePayment.ts
│   └── useDebounce.ts
├── lib/
│   ├── axios.ts                  # Axios instance with interceptors
│   ├── queryClient.ts            # TanStack Query client config
│   └── utils.ts                  # cn(), formatDate(), formatPrice(), etc.
├── store/
│   ├── authStore.ts              # Zustand auth store
│   └── uiStore.ts                # Zustand UI store (modals, sidebar)
├── types/
│   ├── user.ts
│   ├── hotel.ts
│   ├── room.ts
│   ├── booking.ts
│   ├── payment.ts
│   ├── review.ts
│   ├── message.ts
│   ├── notification.ts
│   └── api.ts                    # Generic API response shapes
├── middleware.ts                  # Auth route protection
├── tailwind.config.ts
├── next.config.ts
└── .env.local
```

---

## 2.5 Common Component Specifications

These four components are the **system-wide building blocks** used across every page. Build them first before any feature pages.

---

### A. `AppLayout` — Unified Shell

```tsx
// components/layout/AppLayout.tsx
// Wraps every authenticated page. Uses shadcn SidebarProvider.

<SidebarProvider>          // shadcn — manages open/collapsed state
  <AppSidebar />           // Left sidebar
  <SidebarInset>           // Right content area
    <TopNavbar />          // Sticky top bar
    <main className="flex-1 overflow-y-auto p-6">
      {children}
    </main>
  </SidebarInset>
</SidebarProvider>
```

**Props:** `children: ReactNode`  
**Used on:** All routes inside `(app)/` route group (all authenticated pages)

---

### B. `AppSidebar` — Navigation Sidebar

Built with shadcn `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarFooter`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarMenuSub`.

```ts
// Navigation config — drives the sidebar automatically
const NAV_ITEMS = [
  { label: 'Home',          href: '/',                icon: Home },
  { label: 'Search',        href: '/search',          icon: Search },
  { label: 'Bookings',      href: '/bookings',        icon: CalendarDays },
  { label: 'Messages',      href: '/messages',        icon: MessageSquare, badge: unreadCount },
  { label: 'Wishlist',      href: '/wishlist',        icon: Heart },
  { label: 'Notifications', href: '/notifications',   icon: Bell, badge: unreadNotifs },
  {
    label: 'Host',
    icon: Building2,
    children: [
      { label: 'Dashboard',   href: '/host' },
      { label: 'My Hotels',   href: '/host/hotels' },
      { label: 'Bookings',    href: '/host/bookings' },
      { label: 'Verification',href: '/host/verification' },
    ]
  },
  { label: 'Profile',       href: '/profile',         icon: User },
  { label: 'Support',       href: '/support',         icon: LifeBuoy },
]
```

**Sidebar Footer:** User avatar + name + role badge + logout button  
**Collapsible:** Desktop → icon-only rail. Mobile → Sheet drawer via `SidebarTrigger`  
**Active state:** `isActive` on `SidebarMenuButton` driven by `usePathname()`

---

### C. `TopNavbar` — Sticky Top Bar

```tsx
// components/layout/TopNavbar.tsx
<header className="flex h-14 items-center gap-4 border-b px-6 sticky top-0 bg-background z-10">
  <SidebarTrigger />                    // shadcn — toggles sidebar
  <Breadcrumb>                          // shadcn — auto-built from pathname
    <BreadcrumbList>
      <BreadcrumbItem>Dashboard</BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>Bookings</BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
  <div className="ml-auto flex items-center gap-3">
    <NotificationDropdown />            // Bell icon + unread badge
    <UserMenu />                        // Avatar + dropdown (Profile / Logout)
    <ModeToggle />                      // Dark / Light toggle
  </div>
</header>
```

**Breadcrumbs:** Auto-generated from `usePathname()` → split by `/` → capitalised segments

---

### D. `DataTable<T>` — Generic Action Table

Built on **shadcn `Table`** + **`@tanstack/react-table`**.

```ts
// Props
interface DataTableProps<T> {
  columns: ColumnDef<T>[]         // tanstack column definitions
  data: T[]                        // current page rows
  totalCount: number               // total records (for pagination)
  page: number                     // current page (1-based)
  limit: number                    // rows per page
  isLoading?: boolean              // shows skeleton rows
  searchPlaceholder?: string       // e.g. "Search bookings..."
  onSearch?: (q: string) => void   // called on debounced input change
  addLabel?: string                // e.g. "Add Hotel"
  onAdd?: () => void               // opens modal or navigates
  onPageChange: (page: number) => void
}
```

**Toolbar row (`DataTableToolbar`):**
```
[ 🔍 Search input (debounced 300ms) ]          [ + Add Hotel button ]
```

**Table body:**
- Renders shadcn `<Table>`, `<TableHeader>`, `<TableBody>`, `<TableRow>`, `<TableCell>`
- Sortable columns via `column.getToggleSortingHandler()`
- Loading state: renders `<Skeleton>` rows (same count as `limit`)
- Empty state: `<EmptyState>` component centered in table body

**Row actions (`DataTableRowActions`):** `DropdownMenu` with View / Edit / Delete items — passed via a special `actions` column definition.

**Pagination (`DataTablePagination`):**
```
[ ← Prev ]  [ 1 ] [ 2 ] [3] [ 4 ] [ 5 ]  [ Next → ]
Showing 1–10 of 47 results
```
- First, prev, numbered pages (±2 from current), next, last
- Ellipsis (`...`) for large page counts

**Usage example:**
```tsx
<DataTable
  columns={bookingColumns}
  data={bookings}
  totalCount={total}
  page={page}
  limit={10}
  searchPlaceholder="Search by guest name or hotel..."
  addLabel="New Booking"
  onAdd={() => router.push('/bookings/new')}
  onSearch={setQuery}
  onPageChange={setPage}
  isLoading={isLoading}
/>
```

---

### E. `AppForm<T>` — Generic Form

Built on **React Hook Form** + **Zod resolver**.

```ts
// Field config type
type FieldConfig = {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'textarea'
       | 'select' | 'date' | 'daterange' | 'checkbox' | 'file' | 'rating'
  placeholder?: string
  options?: { label: string; value: string }[]  // for select
  disabled?: boolean
  description?: string   // helper text below field
}

// Props
interface AppFormProps<T extends FieldValues> {
  schema: ZodSchema<T>
  defaultValues: Partial<T>
  fields: FieldConfig[]
  onSubmit: (data: T) => Promise<void>
  isLoading?: boolean
  submitLabel?: string      // default: "Save"
  cancelLabel?: string      // default: "Cancel"
  onCancel?: () => void
  columns?: 1 | 2          // grid layout: 1 or 2 column
}
```

**Field rendering map:**
| type | Rendered as |
|------|------------|
| `text`, `email`, `password`, `number` | shadcn `<Input>` |
| `textarea` | shadcn `<Textarea>` |
| `select` | shadcn `<Select>` + options |
| `date` | shadcn `<Popover>` + react-day-picker single |
| `daterange` | `DateRangePicker` component |
| `checkbox` | shadcn `<Checkbox>` |
| `file` | `ImageUploader` component |
| `rating` | `StarRating` interactive component |

**Layout:** CSS Grid (`grid-cols-1` or `grid-cols-2`) — fields span full width by default, override with `span: 2` in config.

**Usage example:**
```tsx
<AppForm
  schema={hotelSchema}
  defaultValues={{ name: '', location: '' }}
  columns={2}
  fields={[
    { name: 'name',        label: 'Hotel Name',  type: 'text' },
    { name: 'location',    label: 'Location',    type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea', span: 2 },
    { name: 'instantBooking', label: 'Instant Booking', type: 'checkbox' },
  ]}
  onSubmit={handleCreate}
  isLoading={isPending}
  submitLabel="Create Hotel"
  onCancel={() => router.back()}
/>
```

---

### F. `AppCard` — Generic Card

Three visual variants covering every card use-case in the system.

```ts
type AppCardVariant = 'default' | 'compact' | 'stat'

interface AppCardProps {
  variant?: AppCardVariant       // default: 'default'
  title: string
  subtitle?: string
  description?: string
  images?: string[]                // image slider (default variant) — shows embla carousel if >1
  badge?: { label: string; color?: 'green'|'yellow'|'red'|'blue'|'gold' }
  stats?: { label: string; value: string | number }[]  // bottom stats row
  actions?: ReactNode              // buttons / dropdown in card footer
  onClick?: () => void             // makes card a clickable link
  isLoading?: boolean              // shows Skeleton
  // stat variant only:
  icon?: LucideIcon
  trend?: { value: number; direction: 'up' | 'down' }  // e.g. +12% vs last month
}
```

**`default` variant** — vertical card (used for HotelCard, RoomCard, WishlistCard)
```
┌──────────────────────┐
│  [◀ image slider ▶]  │  ← embla carousel, aspect-video, dot indicators
│  ♡ (wishlist)        │  ← absolute top-right over image
├──────────────────────┤
│  Title          ★4.8 │  ← badge top-right (Superhost / Instant)
│  Subtitle            │
│  Description         │
│  [stat] [stat] [stat]│
│  [actions]           │
└──────────────────────┘
```
- If `images.length === 1`: renders a plain `<Image>` (no controls)
- If `images.length > 1`: renders embla carousel with `prev/next` arrow buttons and dot indicators
- Arrow buttons visible on hover only (opacity transition)
- Dots show current slide index

**`compact` variant** — horizontal card (used for BookingCard, ConversationCard)
```
┌─────┬────────────────────────┐
│image│ Title          [badge] │
│     │ Subtitle               │
│     │ [stat] [stat]          │
│     │              [actions] │
└─────┴────────────────────────┘
```

**`stat` variant** — KPI card (used for host Dashboard)
```
┌──────────────────────┐
│ [icon]    ↑ +12%     │
│ 1,247                │
│ Total Bookings       │
└──────────────────────┘
```

**Usage examples:**
```tsx
// Hotel card (multiple images → slider)
<AppCard
  variant="default"
  images={hotel.rooms[0]?.images ?? [hotel.coverImage]}
  title={hotel.name}
  subtitle={hotel.location}
  badge={{ label: 'Superhost', color: 'gold' }}
  stats={[{ label: '/night', value: '₹5,000' }, { label: 'rating', value: '4.8★' }]}
  actions={<WishlistButton roomId={room.id} />}
  onClick={() => router.push(`/hotels/${hotel.id}`)}
/>

// Dashboard stat card
<AppCard
  variant="stat"
  title="Total Bookings"
  stats={[{ label: '', value: 1247 }]}
  icon={CalendarDays}
  trend={{ value: 12, direction: 'up' }}
/>
```

---

## 3. Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
NEXT_PUBLIC_MINIO_BASE_URL=http://localhost:9000
```

---

## 4. API Reference (Backend Endpoints)

### Auth — `/api/auth`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | Login → returns JWT token |
| POST | `/logout` | Logout |
| POST | `/refresh-token` | Refresh access token |
| GET | `/me` | Get current logged-in user |
| POST | `/verify-email` | Verify email address |

### Users — `/api/users`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/:id/profile` | Get user profile |
| PUT | `/:id/profile` | Update name, avatar |
| POST | `/:id/verify-document` | Upload ID document |
| GET | `/:id/documents` | List user documents |
| DELETE | `/:id/documents/:docId` | Delete document |
| GET | `/:id/host-verification` | Superhost status + metrics |

### Hotels — `/api/hotels`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/search?lat&lng&radius&checkIn&checkOut&guests` | Search hotels |
| GET | `/:id` | Hotel detail with amenities, rules, reviews |
| GET | `/:id/rooms` | List rooms in hotel |
| GET | `/:id/reviews` | Hotel reviews |
| POST | `/` | Create hotel (host only) |
| PUT | `/:id` | Update hotel (owner only) |
| DELETE | `/:id` | Delete hotel (owner only) |
| POST | `/:id/block-dates` | Block dates (host only) |
| GET | `/:id/block-dates` | Get blocked date ranges |

### Rooms — `/api/rooms`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/:id` | Room detail with full amenities |
| GET | `/:id/available?checkIn&checkOut` | Check availability |
| GET | `/:id/pricing?checkIn&checkOut` | Pricing breakdown with taxes/fees |
| POST | `/:id/images` | Upload image to MinIO |
| DELETE | `/:id/images/:imageId` | Delete room image |

### Bookings — `/api/bookings`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create booking (with Redis lock) |
| GET | `/` | Current user's bookings |
| GET | `/host` | Host's incoming bookings |
| GET | `/:id` | Booking detail |
| PATCH | `/:id/cancel` | Cancel booking |
| PATCH | `/:id/update` | Update guest count / notes |
| POST | `/:id/confirm-checkin` | Host confirms check-in |
| POST | `/:id/confirm-checkout` | Host confirms check-out |

### Payments — `/api/payments`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create Razorpay order |
| POST | `/webhook` | Razorpay webhook (internal) |
| GET | `/:id` | Payment by ID |
| GET | `/booking/:bookingId` | Payment for a booking |

### Reviews — `/api/reviews`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Submit review for completed booking |
| GET | `/booking/:bookingId` | Review for a specific booking |
| PUT | `/:id` | Edit review |
| DELETE | `/:id` | Delete review |

### Messages — `/api/messages`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Send message |
| GET | `/thread/:userId` | Full conversation with a user |
| GET | `/conversations` | All conversations |
| PATCH | `/:id/read` | Mark message as read |
| GET | `/unread-count` | Unread message count |

### Wishlists — `/api/wishlists`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Add room to wishlist |
| GET | `/` | User's wishlist |
| DELETE | `/:roomId` | Remove from wishlist |

### Notifications — `/api/notifications`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List notifications |
| PATCH | `/:id/read` | Mark notification as read |
| DELETE | `/:id` | Delete notification |

### Support — `/api/support`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/tickets` | Create support ticket |
| GET | `/tickets` | User's tickets |
| GET | `/tickets/:id` | Ticket detail |
| POST | `/tickets/:id/reply` | Reply to ticket |

### Search History — `/api/search-history`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Save search |
| GET | `/` | User's search history |
| DELETE | `/` | Clear history |

---

## 5. State Management

### Zustand — `authStore.ts`
```ts
{
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login(user, token): void
  logout(): void
  setUser(user): void
}
```

### Zustand — `uiStore.ts`
```ts
{
  isMobileMenuOpen: boolean
  isSearchOpen: boolean
  activeModal: string | null
  openModal(name): void
  closeModal(): void
  toggleMobileMenu(): void
}
```

### TanStack React Query
- Hotels, search results, booking lists → cached + paginated
- Notifications, unread count → auto-refetch on window focus
- Mutations for create/update/delete → invalidate related query keys

---

## 6. Axios Setup (`lib/axios.ts`)

```ts
- Base URL: NEXT_PUBLIC_API_URL
- Request interceptor: Attach Authorization: Bearer <token> from authStore
- Response interceptor:
    - On 401: attempt token refresh via POST /auth/refresh-token
    - On refresh fail: clear auth state, redirect to /login
    - On other errors: throw standardized error object
```

---

## 7. Route Protection (`middleware.ts`)

```
Protected routes (require auth):
  /bookings/*
  /host/*
  /messages/*
  /wishlist
  /notifications
  /profile/*
  /support

Public routes:
  /
  /search
  /hotels/*
  /login
  /register
  /verify-email
```

---

## 8. Booking Flow (End-to-End)

```
1. User searches hotels → /search
2. User opens hotel page → /hotels/[id]
3. User selects room + dates → /hotels/[id]/rooms/[roomId]
4. User submits BookingForm → POST /api/bookings
   - Backend acquires Redis lock (5s TTL)
   - Creates booking with status: PENDING
   - Booking expires in 10 minutes
5. User lands on /bookings/[id] with 10-minute countdown
6. User clicks "Pay Now"
   - POST /api/payments → get Razorpay orderId
   - Open Razorpay JS SDK modal
   - User pays via card/UPI/wallet
7. Razorpay calls backend webhook → booking status → CONFIRMED
8. User redirected to /payment/success
   - Status polled via GET /api/payments/booking/:bookingId
9. Confirmation email sent (via notification-service)
```

---

## 9. Payment Integration (Razorpay)

```ts
// Razorpay JS SDK checkout options
const options = {
  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  amount: order.amount,         // in paise
  currency: 'INR',
  name: 'MyBnB',
  description: `Booking #${bookingId}`,
  order_id: order.razorpayOrderId,
  handler: function(response) {
    // Poll /api/payments/booking/:bookingId for CONFIRMED status
    // Redirect to /payment/success
  },
  prefill: { name: user.name, email: user.email },
  theme: { color: '#FF385C' }
}
const rzp = new window.Razorpay(options)
rzp.open()
```

---

## 10. Image Upload Flow (MinIO)

```
1. Host selects image file in RoomForm
2. POST /api/rooms/:id/images with FormData
3. Backend uploads to MinIO → returns { imageUrl }
4. Frontend adds imageUrl to room images list
5. Images displayed via next/image with MinIO base URL
```

---

## 11. Task Checklist

### Phase 5A — Setup & Infrastructure
- [ ] Bootstrap Next.js 16 project with TypeScript and App Router
- [ ] Install all packages: `react-leaflet leaflet react-day-picker embla-carousel-react sonner razorpay @tanstack/react-table`
- [ ] Configure TailwindCSS v4 (`tailwind.config.ts`, global CSS, CSS variables for theming)
- [ ] Initialize shadcn/ui CLI — add components: `button input dialog dropdown-menu card badge sheet popover select textarea avatar skeleton tabs separator tooltip sidebar breadcrumb`
- [ ] Create `lib/axios.ts` — Axios instance with auth + refresh interceptors
- [ ] Create `lib/queryClient.ts` — TanStack Query v5 client config
- [ ] Create `lib/utils.ts` — `cn()`, `formatDate()`, `formatPrice()`, `calcNights()`
- [ ] Create `store/authStore.ts` — Zustand v5 auth store with `persist` middleware
- [ ] Create `store/uiStore.ts` — Zustand UI store (modals, sidebar state)
- [ ] Create all `types/` files (user, hotel, room, booking, payment, review, message, notification, api)
- [ ] Create `app/providers.tsx` — QueryClientProvider + Zustand hydration
- [ ] Create `middleware.ts` — auth route protection (redirect to /login)
- [ ] Create `.env.local` — API URL, Razorpay key, MinIO base URL
- [ ] Set up `next.config.ts` — `images.remotePatterns` for MinIO

### Phase 5B — Common Layout & System Components ★ (Build first)

#### Layout Shell
- [ ] `AppLayout` — `SidebarProvider` + `AppSidebar` + `SidebarInset` (TopNavbar + main)
- [ ] `AppSidebar` — shadcn `Sidebar` with `NAV_ITEMS` config, active state via `usePathname`, collapsible sub-menus, user footer (avatar + name + role + logout)
- [ ] `TopNavbar` — `SidebarTrigger`, auto-breadcrumbs from `usePathname`, `NotificationDropdown`, `UserMenu`, `ModeToggle`
- [ ] Wrap all `(app)/` route group pages with `AppLayout`

#### DataTable (generic)
- [ ] `DataTable<T>` — props: `columns`, `data`, `totalCount`, `page`, `limit`, `isLoading`, `onPageChange`
- [ ] `DataTableToolbar` — debounced search input (300ms) + Add button (conditional)
- [ ] `DataTablePagination` — prev/next + numbered pages + ellipsis + "Showing X–Y of Z"
- [ ] `DataTableRowActions` — per-row `DropdownMenu` with View / Edit / Delete
- [ ] Skeleton rows when `isLoading` is true
- [ ] `EmptyState` fallback when `data.length === 0`

#### AppForm (generic)
- [ ] `AppForm<T>` — RHF + Zod resolver wrapper, renders fields from `FieldConfig[]` array
- [ ] `FormField` renderer — maps `type` to: Input / Textarea / Select / DateRangePicker / Checkbox / ImageUploader / StarRating
- [ ] 1-column and 2-column grid layout support (`columns` prop)
- [ ] Field-level error display below each input
- [ ] Submit button with spinner + Cancel button

#### AppCard (generic)
- [ ] `AppCard` — `default` variant: image-top card (hotels, rooms, wishlist)
- [ ] `AppCard` — `compact` variant: horizontal layout (bookings, conversations)
- [ ] `AppCard` — `stat` variant / `StatCard`: KPI card with icon + number + trend arrow
- [ ] Skeleton loading state for all variants
- [ ] Badge slot, stats row slot, actions slot

#### Other Shared
- [ ] `Avatar` — image with fallback initials
- [ ] `Badge` — colored status tags (maps booking status → color)
- [ ] `StarRating` — display and interactive (1–5 stars) modes
- [ ] `PriceBreakdown` — subtotal, service fee, taxes, total table
- [ ] `ImageSlider` — inline embla carousel with prev/next arrows + dot indicators (used inside AppCard for hotel/room cards — shows slider when images > 1, plain image when images = 1)
- [ ] `ImageGallery` — full-page hero gallery for hotel/room detail: main large image + thumbnail strip, click thumbnail to switch, lightbox on main image click
- [ ] `DateRangePicker` — react-day-picker with disabled/blocked dates
- [ ] `MapView` — react-leaflet map, hotel pins, popup card
- [ ] `NotificationDropdown` — unread badge + popover list
- [ ] `ConfirmDialog` — generic destructive action modal
- [ ] `PageLoader` — full-page spinner overlay
- [ ] `ErrorBoundary` — catch and display render errors

### Phase 5C — Auth Pages
- [ ] `/login` — LoginForm (email + password, Zod validation, React Hook Form)
- [ ] `/register` — RegisterForm (name, email, password, confirm password)
- [ ] `/verify-email` — email verification page
- [ ] Auth token persistence (localStorage via Zustand persist middleware)
- [ ] Auto-redirect authenticated users away from /login and /register

### Phase 5D — Search & Hotel Pages
- [ ] `/` Homepage — hero search bar + featured hotels grid
- [ ] `HotelSearchBar` — location input + DateRangePicker + guest count stepper
- [ ] `/search` — search results page (GET /api/hotels/search)
- [ ] `HotelCard` — thumbnail, price/night, star rating, superhost badge, wishlist heart
- [ ] `HotelGrid` — responsive grid with loading skeletons
- [ ] `FilterSidebar` — price range slider, amenities, room type, instant booking, radius
- [ ] Map toggle (split list/map view using MapView)
- [ ] Pagination or infinite scroll
- [ ] `/hotels/[id]` — hotel detail page
  - [ ] `HotelGallery` hero section — first image large (60% width), 2×2 thumbnail grid right side + "Show all photos" button opening full lightbox
  - [ ] Each hotel card in search grid uses `ImageSlider` for multiple room images
  - [ ] Hotel info (name, location, rules, check-in/out times)
  - [ ] Amenities grid
  - [ ] Room list section (`RoomCard` per room)
  - [ ] Reviews section with overall rating + breakdown
  - [ ] Map location embed
- [ ] `/hotels/[id]/rooms/[roomId]` — room detail page
  - [ ] Image gallery
  - [ ] Amenities, max guests, room type
  - [ ] `AvailabilityChecker` — date picker + `GET /api/rooms/:id/available`
  - [ ] `PricingPanel` — nights, subtotal, service fee, tax, total

### Phase 6A — Booking Flow
- [ ] `BookingForm` — guest count, dates, notes, cancellation policy select
- [ ] POST /api/bookings on submit
- [ ] `/bookings/[id]` — booking detail page
- [ ] `ExpiryCountdown` — 10-minute countdown timer (reads `expiresAt`)
- [ ] `BookingStatusBadge` — colored status (Pending, Confirmed, Cancelled, etc.)
- [ ] `/bookings` — booking history page with tabs (Upcoming / Past / Cancelled)
- [ ] `CancelBookingModal` — confirm + show refund policy
- [ ] PATCH /api/bookings/:id/cancel

### Phase 6B — Payment Flow
- [ ] `PayButton` — initiates `POST /api/payments`, opens Razorpay modal
- [ ] Razorpay JS SDK integration (load script, open modal, handle callbacks)
- [ ] `/payment/success` — poll for CONFIRMED status, show booking summary
- [ ] `/payment/failed` — retry option + support link
- [ ] `PaymentStatusCard` — shows amount, breakdown, status

### Phase 7A — Host Dashboard
- [ ] `/host` — dashboard with summary cards (pending bookings, avg rating, revenue, superhost badge)
- [ ] `/host/bookings` — incoming bookings list (GET /api/bookings/host)
  - [ ] Check-in confirm button → POST /api/bookings/:id/confirm-checkin
  - [ ] Check-out confirm button → POST /api/bookings/:id/confirm-checkout
- [ ] `/host/hotels` — my hotels list (filtered by ownerId)
- [ ] `/host/hotels/new` — multi-step `HotelForm` (basic info → location → rules)
- [ ] `/host/hotels/[id]/edit` — prefilled HotelForm
- [ ] `/host/hotels/[id]/rooms` — room management list
- [ ] `/host/hotels/[id]/rooms/new` — `RoomForm` (type, capacity, price, amenities)
- [ ] `ImageUploader` — drag & drop → POST /api/rooms/:id/images
- [ ] `/host/hotels/[id]/block-dates` — `BlockDatesCalendar` → POST /api/hotels/:id/block-dates
- [ ] `/host/verification` — Superhost metrics display

### Phase 7B — Reviews
- [ ] `ReviewForm` — star rating (overall + categories: cleanliness, location, accuracy, value), comment
- [ ] Submit review modal (triggered after checkout checkout)
- [ ] `ReviewCard` — avatar, rating, comment, date
- [ ] `RatingBreakdown` — per-category horizontal bars
- [ ] Edit / delete own reviews

### Phase 7C — Messaging
- [ ] `/messages` — `ConversationCard` list (avatar, name, last msg preview, unread dot)
- [ ] `/messages/[userId]` — full thread view with `MessageBubble` components
- [ ] `MessageInput` — textarea + send button
- [ ] Unread count badge in Navbar (polling via GET /api/messages/unread-count)
- [ ] Mark as read on thread open (PATCH /api/messages/:id/read)

### Phase 7D — Notifications, Wishlist & Profile
- [ ] `NotificationDropdown` — unread count, popover list, mark read, delete
- [ ] `/notifications` — full notification page
- [ ] `/wishlist` — saved rooms grid with remove button
- [ ] `/profile` — edit name + avatar upload
- [ ] `/profile/documents` — upload ID document, view status
- [ ] `/support` — create ticket, view tickets, reply

### Phase 8 — Testing & Deployment
- [ ] Jest + RTL unit tests for key components (BookingForm, PayButton, StarRating, DateRangePicker)
- [ ] Integration tests with mocked Axios
- [ ] Playwright E2E: register → search → book → pay → review
- [ ] `next build` production build + bundle analysis
- [ ] Vercel deployment with env vars
- [ ] Docker multi-stage production build for backend + microservices

---

## 12. Booking Status Flow

```
PENDING (10 min window to pay)
    ↓ payment success
CONFIRMED
    ↓ host action: confirm-checkin
CHECKED_IN
    ↓ host action: confirm-checkout
CHECKED_OUT

PENDING → CANCELLED (user cancels or 10 min expires → EXPIRED)
CONFIRMED → CANCELLED (user cancels with refund policy)
```

## 13. Cancellation & Refund Display

| Policy | Refund Rule |
|--------|------------|
| Flexible | Full refund up to 24 hours before check-in |
| Moderate | 50% refund up to 3 days before check-in |
| Strict | No refund after 2 days of booking confirmation |

Display refund estimate in `CancelBookingModal` before user confirms.

---

## 14. Pricing Display Formula

```
Subtotal     = basePrice × nights
Service Fee  = Subtotal × 13% (capped at 30%)
Tax          = (Subtotal + Service Fee) × 5%
─────────────────────────────────────────────
Total        = Subtotal + Service Fee + Tax

Example: ₹5,000/night × 2 nights
  Subtotal:     ₹10,000
  Service Fee:  ₹1,300
  Tax:          ₹570
  ─────────────
  Total:        ₹11,870
```

---

## 15. Key UX Notes

- **Wishlist heart button** on HotelCard — filled/unfilled, toggle via POST/DELETE /api/wishlists
- **Superhost badge** — gold badge on HotelCard and host profile if `user.superhost === true`
- **Instant booking badge** — on HotelCard if `hotel.instantBooking === true`
- **Blocked dates** — disabled in DateRangePicker (loaded from GET /api/hotels/:id/block-dates)
- **Search history** — auto-saved on each search, displayed as recent suggestions in search bar
- **10-minute payment window** — ExpiryCountdown shows live timer; on expiry redirect to /payment/failed
- **Map pins** — clickable HotelCard popup on MapView with price label
- **Mobile responsive** — all pages mobile-first with Navbar hamburger menu
- **Dark mode** — optional, via TailwindCSS `dark:` variants and shadcn/ui theme
