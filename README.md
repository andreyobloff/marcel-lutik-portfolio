# Marcel Lutik — auto-generated photo portfolio

The site is generated locally from the `photo` folder.

Original `photo/` files are ignored by Git. Optimized web copies are generated into `public/photo/` and committed.

## Update photos

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\deploy-marcel-lutik-real-photos.ps1" -ProjectDir "." -RepoName "marcel-lutik-portfolio" -Visibility public
```

## Edit series descriptions

`content/series-descriptions.json`

## Edit individual photo descriptions

`content/photo-descriptions.json`

Key example:

```json
{
  "Derealisation/DSCF3593.jpg": "Individual description"
}
```