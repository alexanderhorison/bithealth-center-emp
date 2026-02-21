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
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml'
      },
      {
        src: '/apple-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml'
      }
    ]
  };
}
