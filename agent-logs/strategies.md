# Implementation Strategies - Backend

## Strategy 1: Express Server Architecture

### Server Structure
```
apps/api/src/
├── index.ts                 # Entry point
├── config/
│   ├── database.ts
│   ├── redis.ts
│   └── environment.ts
├── middleware/
│   ├── errorHandler.ts
│   ├── requestLogger.ts
│   ├── authMiddleware.ts
│   └── validators.ts
├── controllers/
│   ├── auth.controller.ts
│   ├── hotel.controller.ts
│   ├── room.controller.ts
│   ├── booking.controller.ts
│   └── ... (others)
├── services/
│   ├── auth.service.ts
│   ├── hotel.service.ts
│   ├── booking.service.ts
│   └── ... (others)
├── routes/
│   ├── auth.routes.ts
│   └── ... (others)
├── utils/
│   ├── jwt.ts
│   ├── response.ts
│   └── validators.ts
└── jobs/
    ├── cronManager.ts
    ├── jobWorker.ts
    └── ipcMessenger.ts
```

### Middleware Stack
```
1. CORS
2. Helmet (Security headers)
3. Compression
4. Morgan (Request logging)
5. JSON parser
6. Request validator
7. Auth checker
8. Error handler
```

## Strategy 2: Authentication Flow

### JWT Token Structure
```
Header Token: Authorization: Bearer <token>
Payload:
{
  "userId": "user-id",
  "email": "user@example.com",
  "role": "host|guest|admin",
  "iat": 1234567890,
  "exp": 1234654290
}
```

### Auth Endpoints
```
POST /api/auth/register
  - Validate email format
  - Hash password with bcrypt
  - Create user in DB
  - Return JWT token

POST /api/auth/login
  - Find user by email
  - Compare password hash
  - Generate JWT token
  - Return token

POST /api/auth/logout
  - Invalidate token (add to blacklist in Redis)
  - Clear client-side storage

POST /api/auth/refresh-token
  - Validate refresh token
  - Issue new access token

GET /api/auth/me
  - Extract userId from JWT
  - Return current user profile
```

## Strategy 3: Hotel Management API

### CRUD Operations with Auth
```
POST /api/hotels/ (Host only)
  - Validate location coordinates
  - Create hotel record
  - Link to host userId

GET /api/hotels/search
  - Geo-distance search (lat/lng + radius)
  - Date range filtering
  - Aggregate room availability
  - Return sorted results

GET /api/hotels/:id
  - Include all rooms
  - Include reviews + ratings
  - Include images

PUT /api/hotels/:id (Owner only)
  - Validate ownership
  - Update hotel details
  - Update amenities

DELETE /api/hotels/:id (Owner only)
  - Soft delete or hard delete
  - Archive bookings
```

## Strategy 4: Room Management

### Room Availability Logic
```
GET /api/rooms/:id/available?checkIn=DATE&checkOut=DATE
  - Find RoomAvailability records
  - Check for BlockedDates
  - Check for active Bookings
  - Return isAvailable: boolean

GET /api/rooms/:id/pricing?checkIn=DATE&checkOut=DATE
  - Calculate nightly rate
  - Add cleaning fee
  - Calculate service fee (13%)
  - Calculate taxes (by region)
  - Return breakdown
```

### Pricing Calculation
```
Function calculateTotal(basePrice, nights, cleaningFee, taxRate, serviceFeePercent):
  subtotal = (basePrice * nights) + cleaningFee
  serviceCharge = subtotal * (serviceFeePercent / 100)
  taxes = (subtotal + serviceCharge) * taxRate
  total = subtotal + serviceCharge + taxes
  
  return {
    subtotal
    serviceCharge
    taxes
    total
    breakdown: { basePrice, nights, cleaningFee, serviceCharge, taxes }
  }
```

## Strategy 5: Booking Concurrency with Redis Lock

### Lock Mechanism
```
Function createBooking(userId, roomId, checkIn, checkOut):
  lockKey = `booking:${roomId}:${checkIn}:${checkOut}`
  
  1. TRY to acquire lock:
     redis.set(lockKey, PROCESSING, EX=5, NX)
     
  2. If lock acquired:
     - Check room availability in DB
     - If available, create Booking
     - Set status = PENDING
     - Set expiresAt = now + 10 minutes
     - Release lock
     - Return booking
     
  3. If lock fails:
     - Retry 3 times with exponential backoff
     - Return error: "Room is being booked, try again"
```

### Booking Expiration
```
CRON Job (Every 5 minutes):
  SELECT * FROM Booking 
  WHERE status = 'PENDING' 
  AND createdAt < now() - 10 minutes
  
  For each expired booking:
    - Update status = EXPIRED
    - Update RoomAvailability (mark available)
    - Create Notification
    - If payment captured, start refund process
```

## Strategy 6: Payment Integration

### Razorpay Flow
```
1. Client initiates booking (in-app)

2. Backend creates Razorpay Order:
   POST https://api.razorpay.com/v1/orders
   {
     amount: totalInPaise,
     currency: "INR",
     receipt: bookingId,
     notes: { bookingId, userId }
   }

3. Frontend opens Razorpay Checkout:
   window.Razorpay({
     key: RAZORPAY_KEY_ID,
     order_id: orderId,
     handler: handlePaymentSuccess
   })

4. Payment verification webhook:
   POST /api/payments/webhook
   - Verify signature
   - Find Booking
   - Update Payment status
   - Update Booking status to CONFIRMED
   - Send confirmation email
```

## Strategy 7: MinIO Image Upload

### Presigned URL Flow
```
1. Client requests presigned URL:
   GET /api/rooms/:id/images/presigned-url
   
2. Backend generates URL:
   - Create object key: `room-images/{hotelId}/{roomId}/{timestamp}_{fileName}`
   - Generate presigned URL (expires in 1 hour)
   - Return URL to client
   
3. Client uploads directly to MinIO:
   - PUT request to presigned URL
   - No backend involvement = better performance
   
4. Database records image:
   - Store bucket, objectKey, publicUrl
   - Link to Room
```

## Strategy 8: CRON Jobs with IPC

### Job Flow
```
Main API Process
├── Express Server (port 3000)
├── CRON Scheduler (node-cron)
└── IPC Channel (for communication)

Every scheduled time:
1. CRON triggers event
2. Main process spawns Worker via child_process.fork()
3. Worker executes task (isolated process)
4. Worker sends status via IPC:
   {
     jobId, jobType, status, processedCount,
     errors, duration, timestamp
   }
5. Main process logs result
6. If failed, retry with backoff
```

### Jobs List
- **bookingExpiration** (every 5 min) - Expire old bookings
- **checkoutReminder** (every 1 hour) - Email reminders
- **roomCleaning** (every 30 min) - Update cleaning status
- **superhostCalculation** (daily 2 AM) - Update superhost status
- **notificationProcessor** (every 2 min) - Send queued notifications
- **incidentEscalation** (every 4 hours) - Auto-escalate incidents

## Strategy 9: API Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* response object */ },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Email must be a valid format",
    "field": "email"
  }
}
```

### List Response with Pagination
```json
{
  "success": true,
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "pages": 5
  }
}
```

## Strategy 10: Database Query Optimization

### Indexes to Add (Already in Schema)
- User: email, role
- Booking: userId, roomId, status, expiresAt
- RoomAvailability: roomId, date
- Message: senderUserId, receiverUserId, createdAt
- Notification: userId, read, createdAt
- HostVerification: userId, status

### Connection Pooling
- Use PrismaClient (connection pooling built-in)
- Max connections: 10 (dev), 20 (prod)
- Timeout: 30 seconds

### N+1 Query Prevention
- Use Prisma `include` for relationships
- Avoid loops with separate queries
- Use `findMany` with filters instead

## Implementation Order

1. **Express Server Setup**
   - Create index.ts with middleware
   - Setup config files
   - Test with health check endpoint

2. **Auth System**
   - Register & login endpoints
   - JWT token generation
   - Auth middleware

3. **Hotel Endpoints**
   - CRUD for hotels
   - Search with geo-location
   - Block dates management

4. **Room Endpoints**
   - CRUD for rooms
   - Availability checking
   - Pricing calculations

5. **Booking Endpoints**
   - Create booking with Redis lock
   - Cancel booking with refund
   - Check-in/checkout
   - Update booking

6. **Redis Lock Implementation**
   - Lock acquisition
   - Lock release
   - Timeout handling

7. **CRON Jobs**
   - Job scheduler setup
   - Worker processes
   - IPC communication
   - Logging system

8. **MinIO Integration**
   - Bucket creation
   - Presigned URL generation
   - Image retrieval

Ready to implement!
