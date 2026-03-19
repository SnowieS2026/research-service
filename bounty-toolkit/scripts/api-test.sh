#!/bin/bash
# Fast API enumeration & fuzzing
# Usage: ./api-test.sh https://api.target.com

TARGET="${1:?Usage: $0 <https://api.target.com>}"
OUTPUT_DIR="api-test/$(echo $TARGET | sed 's/https\?:\/\///' | sed 's/\./_/g')"
mkdir -p "$OUTPUT_DIR"

echo "📡 API Testing: $TARGET"

# Common API paths wordlist (built-in minimal list)
API_PATHS="/opt/SecLists/Discovery/Web-Content/api/api-endpoints-resolved.txt"
[ -f "$API_PATHS" ] || API_PATHS="/opt/SecLists/Discovery/Web-Content/graphql-top-100.txt"

# Phase 1: Probe for common API paths
echo ""
echo "[1/5] 🔍 Probing common API endpoints..."
ffuf -u "$TARGET/FUZZ" \
  -w "$API_PATHS" \
  -mc 200,204,301,302,307,401,403,500 \
  -o "$OUTPUT_DIR/api_paths.json" \
  -of json 2>/dev/null || true
echo "  ↳ API path scan complete"

# Phase 2: Check for GraphQL
echo ""
echo "[2/5] 🔍 Checking GraphQL..."
echo '{ "query": "{ __schema { queryType { name } } }" }' > "$OUTPUT_DIR/graphql_introspection.json"
curl -s -X POST "$TARGET/graphql" \
  -H "Content-Type: application/json" \
  -d '{ "query": "{ __schema { queryType { name } } }" }' \
  -o "$OUTPUT_DIR/graphql_response.txt"
cat "$OUTPUT_DIR/graphql_response.txt"
echo "" # newline after graphql response

# Also try introspection query
curl -s -X POST "$TARGET/graphql" \
  -H "Content-Type: application/json" \
  -d '{ "query": "{ __introspectionQuery { types { name fields { name type { name kind ofType { name } } } } } }" }' \
  > "$OUTPUT_DIR/graphql_schema.txt" 2>/dev/null || true

# Phase 3: Check for Swagger/OpenAPI
echo ""
echo "[3/5] 🔍 Checking Swagger/OpenAPI docs..."
for path in "/swagger-ui.html" "/swagger-ui/index.html" "/api-docs" "/api/docs" "/swagger.json" "/api/swagger.json" "/openapi.json"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET$path")
  if [ "$status" != "404" ]; then
    echo "  ↳ Found: $path (HTTP $status)"
    curl -sL "$TARGET$path" -o "$OUTPUT_DIR/swagger_$path" 2>/dev/null || true
  fi
done

# Phase 4: Test for IDOR patterns
echo ""
echo "[4/5] 🔍 Checking IDOR patterns (numeric IDs)..."
curl -s "$TARGET/users/1" -o /dev/null -w "User 1: %{http_code}\n"
curl -s "$TARGET/users/2" -o /dev/null -w "User 2: %{http_code}\n"
curl -s "$TARGET/orders/1" -o /dev/null -w "Order 1: %{http_code}\n"
curl -s "$TARGET/accounts/1" -o /dev/null -w "Account 1: %{http_code}\n"

# Phase 5: Test for SSRF
echo ""
echo "[5/5] 🔍 Testing for SSRF in query parameters..."
ffuf -u "$TARGET?url=FUZZ" \
  -w /opt/SecLists/Fuzzing/SSRF.txt \
  -mc 200,301,302,400,403,500 \
  -mr "Internal" \
  -o "$OUTPUT_DIR/ssrf_results.json" \
  -of json 2>/dev/null || true

echo ""
echo "✅ API testing complete → $OUTPUT_DIR/"
