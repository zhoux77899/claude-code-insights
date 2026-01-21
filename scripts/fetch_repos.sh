rm -f /tmp/repos.json

echo "Fetching page 1..."
curl -s \
-H "Authorization: token $GITHUB_TOKEN" \
-H "Accept: application/vnd.github.v3+json" \
"https://api.github.com/search/code?q=filename:marketplace.json+path:.claude-plugin&sort=stars&order=desc&per_page=100&page=1" \
>> /tmp/repos.json

cat /tmp/repos.json

TOTAL=$(jq '.total_count' /tmp/repos.json)
PAGES=$(( ($TOTAL + 99) / 100 ))

for ((page=2; page<=$PAGES; page++)); do
  echo "Fetching page $page/$PAGES..."
  curl -s \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/search/code?q=filename:marketplace.json+path:.claude-plugin&sort=stars&order=desc&per_page=100&page=$page" \
    >> /tmp/repos.json
  if [ $(( $page % 5 )) -eq 0 ]; then
    echo "Paused for 1 minute to avoid rate limiting..."
    sleep 60
  fi
done