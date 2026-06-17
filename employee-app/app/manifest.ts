import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Bithealth Center',
    short_name: 'Bithealth',
    description: "Bithealth Center is your company's command center for daily operations.",
    start_url: '/',
    display: 'standalone',
    background_color: '#f4f1ea',
    theme_color: '#f4f1ea',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  };
}
