curl -s \
-H "Authorization: token $GITHUB_TOKEN" \
-H "Accept: application/vnd.github.v3+json" \
"https://api.github.com/search/code?q=filename:marketplace.json+path:.claude-plugin" \
> /tmp/init_fetch.json

TOTAL=$(jq '.total_count' /tmp/init_fetch.json)
PAGES=$(( ($TOTAL + 99) / 100 ))
echo "Total results $TOTAL need $PAGES"

rm -f /tmp/repos.json

for ((page=1; page<=$PAGES; page++)); do
echo "Fetching page $page/$PAGES..."
curl -s \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/search/code?q=filename:marketplace.json+path:.claude-plugin&sort=stars&order=desc&per_page=100&page=$page" \
    >> /tmp/repos.json