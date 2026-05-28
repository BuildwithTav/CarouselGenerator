export const metadata = {
  title: 'Carousel Generator — Build with Tav',
  description: 'Generate Instagram carousels in your brand voice.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#0D0D0D' }}>{children}</body>
    </html>
  )
}
