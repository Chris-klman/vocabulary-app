# App Icons

This directory should contain the PWA app icons.

## Required Icons

- **icon-192.png**: 192x192px PNG icon
- **icon-512.png**: 512x512px PNG icon

## Design Specifications

- **Style**: Minimalist, black/white design matching app theme
- **Content**: Could feature a letter/book symbol or vocabulary-related iconography
- **Background**: White (#FFFFFF)
- **Foreground**: Black (#000000)

## Temporary Placeholder

For development, you can use any square PNG images. For production, create proper app icons using a tool like:
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- Figma/Adobe Illustrator

## Quick Generation Command

If you have ImageMagick installed, you can generate simple placeholder icons:

```bash
# Generate 192x192 placeholder
convert -size 192x192 xc:white -fill black -pointsize 120 -gravity center -annotate +0+0 "V" public/icons/icon-192.png

# Generate 512x512 placeholder
convert -size 512x512 xc:white -fill black -pointsize 320 -gravity center -annotate +0+0 "V" public/icons/icon-512.png
```
