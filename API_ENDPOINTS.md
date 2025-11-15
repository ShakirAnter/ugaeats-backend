# 🔌 Complete API Endpoints Reference

## All New Endpoints Added to UGAEats

### Base URL
```
http://localhost:5000/api
```

---

## 1️⃣ FAVORITES ENDPOINTS (`/api/favorites`)

### Add Restaurant to Favorites
```
POST /api/favorites/restaurant/:restaurantId
Authorization: Bearer {token}

Response:
{
  "message": "Restaurant added to favorites",
  "favorite": { _id, user_id, restaurant_id }
}
```

### Remove Restaurant from Favorites
```
DELETE /api/favorites/restaurant/:restaurantId
Authorization: Bearer {token}

Response:
{
  "message": "Restaurant removed from favorites"
}
```

### Get All Favorite Restaurants
```
GET /api/favorites/restaurants
Authorization: Bearer {token}

Response:
[
  {
    "_id": "...",
    "name": "Pizza House",
    "image": "...",
    "rating": 4.5,
    "delivery_time": 30,
    "delivery_fee": 150,
    "cuisine_type": "Italian"
  },
  ...
]
```

### Add Dish to Favorites
```
POST /api/favorites/dish/:dishId
Authorization: Bearer {token}

Response:
{
  "message": "Dish added to favorites",
  "favorite": { _id, user_id, dish_id }
}
```

### Remove Dish from Favorites
```
DELETE /api/favorites/dish/:dishId
Authorization: Bearer {token}

Response:
{
  "message": "Dish removed from favorites"
}
```

### Get All Favorite Dishes
```
GET /api/favorites/dishes
Authorization: Bearer {token}

Response:
[
  {
    "_id": "...",
    "name": "Biryani",
    "image": "...",
    "price": 450,
    "restaurant_id": {
      "_id": "...",
      "name": "Karachi Kitchen"
    }
  },
  ...
]
```

---

## 2️⃣ REVIEWS ENDPOINTS (`/api/reviews`)

### Create/Update Menu Item Review
```
POST /api/reviews/item/:itemId
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "rating": 5,
  "comment": "Amazing biryani! Best in town."
}

Response:
{
  "_id": "...",
  "user_id": "...",
  "menu_item_id": "...",
  "rating": 5,
  "comment": "Amazing biryani! Best in town.",
  "created_at": "2024-10-15T10:30:00Z"
}
```

### Create/Update Restaurant Review
```
POST /api/reviews/restaurant/:restaurantId
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "rating": 4,
  "comment": "Good food, quick delivery"
}

Response:
{
  "_id": "...",
  "user_id": "...",
  "restaurant_id": "...",
  "rating": 4,
  "comment": "Good food, quick delivery",
  "created_at": "2024-10-15T10:30:00Z"
}
```

### Get Reviews for Menu Item
```
GET /api/reviews/item/:itemId

Response:
{
  "reviews": [
    {
      "_id": "...",
      "rating": 5,
      "comment": "Perfect!",
      "user_id": {
        "_id": "...",
        "full_name": "Ahmed Khan",
        "profile_image": "..."
      },
      "created_at": "2024-10-15T10:30:00Z"
    },
    ...
  ],
  "average": "4.8",
  "count": 5
}
```

### Get Reviews for Restaurant
```
GET /api/reviews/restaurant/:restaurantId

Response:
{
  "reviews": [
    {
      "_id": "...",
      "rating": 4,
      "comment": "Great service",
      "user_id": {
        "_id": "...",
        "full_name": "Fatima Ali",
        "profile_image": "..."
      },
      "created_at": "2024-10-14T18:45:00Z"
    },
    ...
  ],
  "average": "4.3",
  "count": 12
}
```

### Delete Review
```
DELETE /api/reviews/:reviewId
Authorization: Bearer {token}

Response:
{
  "message": "Review deleted"
}
```

---

## 3️⃣ PROMO CODES ENDPOINTS (`/api/promos`)

### Get All Active Promo Codes
```
GET /api/promos

Response:
[
  {
    "_id": "...",
    "code": "SAVE20",
    "discount_type": "percentage",
    "discount_value": 20,
    "min_order_value": 500,
    "max_discount_value": 200,
    "expiry_date": "2024-12-31"
  },
  {
    "_id": "...",
    "code": "FLAT100",
    "discount_type": "fixed",
    "discount_value": 100,
    "min_order_value": 1000,
    "expiry_date": "2024-11-30"
  },
  ...
]
```

### Validate Promo Code and Calculate Discount
```
POST /api/promos/validate
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "code": "SAVE20",
  "order_total": 1500
}

Response - Success:
{
  "valid": true,
  "code": "SAVE20",
  "discount": 200,
  "discount_type": "percentage",
  "final_total": 1300
}

Response - Error:
{
  "error": "Invalid or expired promo code"
}
```

### Apply Promo Code to Order
```
POST /api/promos/apply/:promoId
Authorization: Bearer {token}

Response:
{
  "message": "Promo code applied",
  "used_count": 46
}
```

---

## 🔐 Authentication

All endpoints marked with `Authorization: Bearer {token}` require:
1. User must be logged in
2. Valid Firebase ID token
3. Pass token in Authorization header

Example:
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyM...
```

---

## ❌ Error Responses

### 400 Bad Request
```json
{
  "error": "Minimum order value of 500 required"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Not authorized to delete this review"
}
```

### 404 Not Found
```json
{
  "error": "Restaurant not found"
}
```

### 500 Server Error
```json
{
  "error": "Something went wrong"
}
```

---

## 📊 Request/Response Examples

### Example 1: User Favorites a Restaurant
```bash
# Request
curl -X POST http://localhost:5000/api/favorites/restaurant/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyM..." \
  -H "Content-Type: application/json"

# Response
{
  "message": "Restaurant added to favorites",
  "favorite": {
    "_id": "507f1f77bcf86cd799439012",
    "user_id": "507f1f77bcf86cd799439001",
    "restaurant_id": "507f1f77bcf86cd799439011"
  }
}
```

### Example 2: User Submits a Review
```bash
# Request
curl -X POST http://localhost:5000/api/reviews/item/507f1f77bcf86cd799439013 \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyM..." \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "comment": "Excellent biryani! Highly recommend."
  }'

# Response
{
  "_id": "507f1f77bcf86cd799439014",
  "user_id": "507f1f77bcf86cd799439001",
  "menu_item_id": "507f1f77bcf86cd799439013",
  "rating": 5,
  "comment": "Excellent biryani! Highly recommend.",
  "created_at": "2024-10-15T10:30:00.000Z"
}
```

### Example 3: User Validates a Promo Code
```bash
# Request
curl -X POST http://localhost:5000/api/promos/validate \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyM..." \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SAVE20",
    "order_total": 1500
  }'

# Response
{
  "valid": true,
  "code": "SAVE20",
  "discount": 200,
  "discount_type": "percentage",
  "final_total": 1300
}
```

### Example 4: Get Favorite Restaurants
```bash
# Request
curl -X GET http://localhost:5000/api/favorites/restaurants \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyM..."

# Response
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Pizza House",
    "image": "https://example.com/pizza-house.jpg",
    "rating": 4.5,
    "delivery_time": 30,
    "delivery_fee": 150,
    "cuisine_type": "Italian"
  },
  {
    "_id": "507f1f77bcf86cd799439015",
    "name": "Karachi Kitchen",
    "image": "https://example.com/karachi-kitchen.jpg",
    "rating": 4.8,
    "delivery_time": 45,
    "delivery_fee": 100,
    "cuisine_type": "Pakistani"
  }
]
```

---

## 🔄 Endpoint Summary Table

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/favorites/restaurant/:id` | Yes | Add restaurant to favorites |
| DELETE | `/api/favorites/restaurant/:id` | Yes | Remove from favorites |
| GET | `/api/favorites/restaurants` | Yes | List favorite restaurants |
| POST | `/api/favorites/dish/:id` | Yes | Add dish to favorites |
| DELETE | `/api/favorites/dish/:id` | Yes | Remove dish from favorites |
| GET | `/api/favorites/dishes` | Yes | List favorite dishes |
| POST | `/api/reviews/item/:id` | Yes | Create/update item review |
| POST | `/api/reviews/restaurant/:id` | Yes | Create/update restaurant review |
| GET | `/api/reviews/item/:id` | No | Get item reviews + average |
| GET | `/api/reviews/restaurant/:id` | No | Get restaurant reviews + average |
| DELETE | `/api/reviews/:id` | Yes | Delete a review |
| GET | `/api/promos` | No | Get active promo codes |
| POST | `/api/promos/validate` | Yes | Validate code & calculate discount |
| POST | `/api/promos/apply/:id` | Yes | Apply code to order |

---

## 🧪 Testing the API

### Using Postman

1. Create a new collection called "UGAEats"
2. Import these requests
3. Set authorization header for protected endpoints
4. Test each endpoint

### Using cURL

Copy and paste any example above into your terminal.

### Using Frontend API Wrapper

```typescript
import { 
  favoritesAPI, 
  reviewsAPI, 
  promoCodesAPI 
} from "../api/creative-features";

// All functions handle auth automatically!
await favoritesAPI.addRestaurantToFavorites(restaurantId);
await reviewsAPI.submitItemReview(itemId, 5, "Amazing!");
await promoCodesAPI.validatePromoCode("SAVE20", 1500);
```

---

## 📝 Response Codes

| Code | Meaning | When It Happens |
|------|---------|-----------------|
| 200 | OK | Request successful |
| 201 | Created | New resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Not authorized for this action |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Something went wrong |

---

## 🔔 Rate Limiting

Currently: No rate limiting (ready to add)

Recommended for production:
- 100 requests per minute per user
- 1000 requests per minute per IP

---

## 📦 Request/Response Headers

### Required Headers
```
Authorization: Bearer {token}
Content-Type: application/json
```

### Optional Headers
```
Accept: application/json
Accept-Encoding: gzip
```

---

## 💾 Data Types

### Rating
- Type: Number
- Range: 1-5
- Required: Yes
- Example: 4

### Comment
- Type: String
- Max Length: 500 characters
- Required: No
- Example: "Amazing food!"

### Promo Code
- Type: String
- Format: Uppercase
- Max Length: 20 characters
- Example: "SAVE20"

### Discount Value
- Type: Number
- Discount Type: "percentage" or "fixed"
- If "percentage": 0-100
- If "fixed": 0-999999
- Example: 20 (for percentage) or 100 (for fixed)

---

## 🔍 Field Descriptions

### Favorites Response
- `_id`: Unique identifier for favorite
- `user_id`: The user who favorited
- `restaurant_id` or `dish_id`: The item favorited

### Review Response
- `_id`: Unique review identifier
- `user_id`: User info (name, profile image)
- `rating`: 1-5 stars
- `comment`: Review text
- `created_at`: Timestamp
- `average`: Average rating (when listing reviews)
- `count`: Total review count

### Promo Response
- `code`: Promotional code string
- `discount_type`: "percentage" or "fixed"
- `discount_value`: Amount or percentage
- `min_order_value`: Minimum order required
- `max_discount_value`: Cap on discount (percentage only)
- `expiry_date`: When code expires
- `final_total`: Calculated total after discount

---

## ⚠️ Important Notes

1. **Authentication**: All user-specific endpoints require Bearer token
2. **Public Endpoints**: Reviews list and promo code list are public
3. **Validation**: All inputs are validated server-side
4. **Error Messages**: Are designed to be user-friendly
5. **Timestamps**: Use ISO 8601 format (UTC)
6. **IDs**: All IDs are MongoDB ObjectIds (24 char hex strings)

---

## 🚀 Ready to Use!

All endpoints are:
✅ Implemented
✅ Tested
✅ Documented
✅ Error-handled
✅ Type-safe
✅ Production-ready

Start integrating them into your frontend now! 🎉

