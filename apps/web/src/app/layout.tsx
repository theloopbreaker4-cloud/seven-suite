/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import './global.css';

/** The real document (<html lang>, header, footer) is rendered per locale in [locale]/layout.tsx. */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
