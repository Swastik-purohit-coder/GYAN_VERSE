// app/layout.js
import { ClerkProvider } from '@clerk/nextjs';
import Script from 'next/script';
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ConnectionStatus from '@/components/ConnectionStatus';
import SyncProgressLoader from '@/components/SyncProgressLoader';
import './globals.css'; // your global styles
import '@/student/styles/globals.css'; // student UI theme variables (bg/foreground, card, etc.)
import ThemeProvider from '@/components/ThemeProvider';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import PageTransition from '@/components/PageTransition';
import GoogleBannerSuppressor from '@/components/GoogleBannerSuppressor';

export const metadata = {
  title: 'GYANARATNA',
};

// Mobile viewport configuration for responsive behavior
export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <link rel="icon" href="/icons/icon-192.png" />
        {/* Hide Google Translate top banner/balloon early to avoid flicker */}
        <style>{`
          .goog-te-banner-frame { display: none !important; visibility: hidden !important; height: 0 !important; }
          iframe.goog-te-banner-frame { display: none !important; visibility: hidden !important; height: 0 !important; }
          .goog-te-balloon-frame { display: none !important; visibility: hidden !important; height: 0 !important; }
        `}</style>
        {/* Intercept and suppress Clerk ChunkLoadError / offline script errors before any bundle loads */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var isChunkErr = function(err, msg) {
                  var text = ((msg || '') + ' ' + (err && err.message ? err.message : '') + ' ' + (err && err.name ? err.name : '')).toLowerCase();
                  return text.indexOf('chunkloaderror') !== -1 || text.indexOf('loading chunk') !== -1 || text.indexOf('clerk.accounts.dev') !== -1 || text.indexOf('signin_clerk') !== -1;
                };
                window.addEventListener('error', function(e) {
                  if (isChunkErr(e.error, e.message)) {
                    e.preventDefault();
                    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                  }
                }, true);
                window.addEventListener('unhandledrejection', function(e) {
                  if (isChunkErr(e.reason, e.reason && e.reason.message)) {
                    e.preventDefault();
                    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                  }
                }, true);
              })();
            `,
          }}
        />
        <Script id="gt-hide-banner" strategy="afterInteractive">
          {`
            (function(){
              var hide = function(){
                try {
                  var iframe = document.querySelector('iframe.goog-te-banner-frame');
                  if (iframe) {
                    iframe.style.display='none';
                    try { if (iframe.parentNode && iframe.isConnected) { iframe.parentNode.removeChild(iframe); } } catch(e){}
                  }
                  var bar = document.querySelector('.goog-te-banner-frame');
                  if (bar) {
                    bar.style.display='none';
                    try { if (bar.parentNode && bar.isConnected) { bar.parentNode.removeChild(bar); } } catch(e){}
                  }
                  var tt = document.getElementById('goog-gt-tt');
                  if (tt) {
                    tt.style.display='none';
                    try { if (tt.parentNode && tt.isConnected) { tt.parentNode.removeChild(tt); } } catch(e){}
                  }
                } catch(e){}
              };
              hide();
              var mo = new MutationObserver(hide);
              mo.observe(document.documentElement, {childList:true, subtree:true});
            })();
          `}
        </Script>
      </head>
      <body className="flex flex-col min-h-screen">
        <ClerkProvider publishableKey={publishableKey}>
          <ThemeProvider>
            <SyncProgressLoader />
            <ServiceWorkerRegister />
            <GoogleBannerSuppressor />
            <ConnectionStatus />
            <Header />
            <main className="flex-grow">
              <PageTransition>
                {children}
              </PageTransition>
            </main>
            <Footer />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

