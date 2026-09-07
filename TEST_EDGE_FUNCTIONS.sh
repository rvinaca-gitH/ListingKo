#!/bin/bash

# Quick test script for Supabase Edge Functions
# Usage: bash TEST_EDGE_FUNCTIONS.sh

set -e

BASE_URL="http://localhost:54321/functions/v1"
AUTH_TOKEN="dev-test-token"

echo "🧪 Testing Supabase Edge Functions..."
echo "Base URL: $BASE_URL"
echo ""

# 1. Create a product
echo "1️⃣  Creating a product..."
PRODUCT_RESPONSE=$(curl -s -X POST "$BASE_URL/products" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Wireless Headphones",
    "description": "High-quality wireless headphones with noise cancellation",
    "category": "Electronics"
  }')

echo "Response: $PRODUCT_RESPONSE"
PRODUCT_ID=$(echo "$PRODUCT_RESPONSE" | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')
echo "✅ Product created with ID: $PRODUCT_ID"
echo ""

# 2. Fetch products list
echo "2️⃣  Fetching products list..."
curl -s -X GET "$BASE_URL/products" \
  -H "Authorization: Bearer $AUTH_TOKEN" | jq .
echo "✅ Products fetched"
echo ""

# 3. Get product details
echo "3️⃣  Fetching product details..."
curl -s -X GET "$BASE_URL/products-detail/$PRODUCT_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN" | jq .
echo "✅ Product details fetched"
echo ""

# 4. Analyze product
echo "4️⃣  Analyzing product (requires ANTHROPIC_API_KEY)..."
echo "   Sending to Claude AI for analysis..."
ANALYZE_RESPONSE=$(curl -s -X POST "$BASE_URL/analyze/$PRODUCT_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json")

echo "Response: $ANALYZE_RESPONSE"
echo "✅ Product analyzed"
echo ""

# 5. Generate listings
echo "5️⃣  Generating listings for all platforms..."
LISTING_RESPONSE=$(curl -s -X POST "$BASE_URL/listings" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"productId\": \"$PRODUCT_ID\",
    \"platforms\": [\"shopee\", \"lazada\", \"tiktok\", \"facebook\"]
  }")

echo "Response: $LISTING_RESPONSE"
echo "✅ Listings generated"
echo ""

# 6. Fetch listings
echo "6️⃣  Fetching listings..."
curl -s -X GET "$BASE_URL/listings?productId=$PRODUCT_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN" | jq .
echo "✅ Listings fetched"
echo ""

echo "🎉 All tests completed!"
echo ""
echo "Product ID for reference: $PRODUCT_ID"
echo ""
echo "Next: Implement remaining endpoints:"
echo "  - QA Results: /api/qa-results"
echo "  - Export: /api/products/:id/export"
echo "  - Marketplace: /api/marketplace-connections"
echo "  - OAuth: /api/oauth/authorize"
echo "  - Images: /api/images/upload, /generate"
