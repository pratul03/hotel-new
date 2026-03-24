# User Gap Closure Tasks (Guest Side)
> Last updated: March 14, 2026

## Objective
Close Airbnb vs My BnB guest-user feature gaps in incremental, testable steps.

## Step 1 - Discovery Parity Pack (COMPLETED)
| Task | Status | Notes |
|---|---|---|
| Add dedicated search endpoint compatibility | ✅ Done | Added `/api/hotels/search` support alongside existing list endpoint |
| Add advanced search filters in backend | ✅ Done | Added `minPrice`, `maxPrice`, `instantBooking`, `minRating`, `sortBy` |
| Add frontend advanced filters UI | ✅ Done | Added min/max price, instant booking, rating, sort controls |
| Validate backend/frontend build | ✅ Done | Backend and frontend build passed after Step 1 changes |

## Step 2 - Map Discovery (COMPLETED)
| Task | Status | Notes |
|---|---|---|
| Add map view toggle on search | ✅ Done | Added list/map toggle in search page |
| Add map markers with price pins | ✅ Done | Added coordinate markers with click-through to listing |
| Add viewport-based fetch | ✅ Done | Added bounds params (`north/south/east/west`) and map area search |

## Step 3 - Cancellation and Refund UX (COMPLETED)
| Task | Status | Notes |
|---|---|---|
| Show cancellation policy on listing and checkout | ✅ Done | Listing detail now shows policy summary |
| Add refund preview on cancellation | ✅ Done | Added booking cancellation preview endpoint + UI |
| Improve booking detail status timeline | ✅ Done | Booking detail now renders history timeline |

## Step 4 - Account Security (COMPLETED)
| Task | Status | Notes |
|---|---|---|
| Add forgot/reset password flow | ✅ Done | Added backend endpoints + auth pages/forms |
| Add active sessions management | ✅ Done | Added active sessions list + revoke APIs + security page |
| Add optional MFA scaffold | ✅ Done | Added MFA setup/verify scaffold APIs + security page |

## Step 5 - Localization (COMPLETED)
| Task | Status | Notes |
|---|---|---|
| Currency preference and formatting | ✅ Done | Added persisted currency preference + formatter support |
| Locale-based date/number formatting | ✅ Done | Added persisted locale preference + formatter support |
| Translation scaffolding | ✅ Done | Added base `i18n.ts` dictionary/lookup utility |

## Step 6 - Accessibility and Promotions (COMPLETED)
| Task | Status | Notes |
|---|---|---|
| Add accessibility discovery filter | ✅ Done | Added accessibility filter in search backend + frontend |
| Add promotion/coupon validation | ✅ Done | Added promotions API and booking-form coupon preview |

## Step 7 - Wishlist and Notifications Depth (COMPLETED)
| Task | Status | Notes |
|---|---|---|
| Add named wishlist collections | ✅ Done | Added listName support, collections endpoint, and wishlist list switching UI |
| Add notification preference center | ✅ Done | Added preference APIs and notification settings toggles in UI |

## Step 8 - Real Map SDK and Clustering (COMPLETED)
| Task | Status | Notes |
|---|---|---|
| Replace mock map with real map SDK | ✅ Done | Integrated Leaflet map component with OpenStreetMap tiles |
| Add clustered pins | ✅ Done | Added zoom-aware grid clustering for dense areas |
| Keep viewport-driven area search | ✅ Done | Added map bounds tracking and search-area refresh |

## Step 9 - Personalized Discovery Ranking (COMPLETED)
| Task | Status | Notes |
|---|---|---|
| Add optional user-context ranking signals | ✅ Done | Uses wishlist/bookings/search-history signals in recommended sort |
| Keep anonymous fallback behavior | ✅ Done | Search still works without auth; personalization applied only when token present |

## Step 10 - Rich Media and Listing Quality (COMPLETED)
| Task | Status | Notes |
|---|---|---|
| Improve listing media presentation | ✅ Done | Added multi-image gallery from room image metadata |
| Add listing quality cues | ✅ Done | Added quality score/progress indicators on hotel detail page |

## Step 11 - Messaging Depth (COMPLETED)
| Task | Status | Notes |
|---|---|---|
| Add attachment message support | ✅ Done | Added attachment metadata support in message payloads and thread UI |
| Add support escalation from chat | ✅ Done | Added message escalation to urgent support tickets |
| Fix message API contract mismatch | ✅ Done | Aligned frontend/backend thread paths and sender/receiver fields |

## Step 12 - Trust and Safety Emergency Flow (COMPLETED)
| Task | Status | Notes |
|---|---|---|
| Add emergency support endpoint | ✅ Done | Added `/api/support/emergency` for urgent safety requests |
| Surface emergency action in UI | ✅ Done | Added emergency alert card/action in support center page |

## Step 13 - Loyalty Depth (COMPLETED)
| Task | Status | Notes |
|---|---|---|
| Add loyalty summary API | ✅ Done | Added user loyalty tier, points, referral code summary endpoint |
| Add loyalty page in profile | ✅ Done | Added guest-facing loyalty dashboard and profile navigation |

## Step 14 - Wishlist Collaboration (COMPLETED)
| Task | Status | Notes |
|---|---|---|
| Add shared wishlist links | ✅ Done | Added share-code URL generation and shared list read endpoint |
| Add collaborator invites/acceptance | ✅ Done | Added invite, invite inbox, and accept flow with list import |
| Add collaboration controls in UI | ✅ Done | Added share, invite, and invite acceptance controls on wishlist page |
