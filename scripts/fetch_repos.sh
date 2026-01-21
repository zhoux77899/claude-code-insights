rm -f /tmp/response.jsonl

echo "Fetching page 1..."
curl -s \
-H "Authorization: token $GITHUB_TOKEN" \
-H "Accept: application/vnd.github.v3+json" \
"https://api.github.com/search/code?q=filename:marketplace.json+path:.claude-plugin&sort=stars&order=desc&per_page=100&page=1" \
>> /tmp/response.jsonl

TOTAL=$(jq '.total_count' /tmp/response.jsonl)
PAGES=$(( ($TOTAL + 99) / 100 ))

for ((page=2; page<=$PAGES; page++)); do
  if [ $(( ($page - 1) % 5 )) -eq 0 ]; then
    echo "Paused for 1 minute to avoid rate limiting..."
    sleep 60
  fi
  echo "Fetching page $page/$PAGES..."
  curl -s \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/search/code?q=filename:marketplace.json+path:.claude-plugin&sort=stars&order=desc&per_page=100&page=$page" \
    >> /tmp/response.jsonl
done