<#
Legacy deploy template is disabled.
It used to rewrite interface files and can reset the portfolio design.

Use content-only update flow instead:
1. git pull --ff-only origin main
2. npm ci
3. npm run generate:photos
4. npm test
5. npm run build
6. git add public/photo public/photographer src/generated/photoManifest.json content/series-descriptions.json content/photo-descriptions.json
7. git commit -m "Update photo portfolio content"
8. git push origin main
#>

Write-Host "ERROR: This legacy deploy script is disabled because it rewrites the site interface." -ForegroundColor Red
Write-Host "Use the content-only update flow described at the top of this file." -ForegroundColor Yellow
exit 1
