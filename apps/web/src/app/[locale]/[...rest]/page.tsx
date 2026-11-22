/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */
import { notFound } from 'next/navigation';

/** Any unknown path under a language renders that language's 404 inside the site frame (with the CSP nonce). */
export default function CatchAll() {
  notFound();
}
