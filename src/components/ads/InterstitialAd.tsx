// import { useEffect, useState } from 'react';
// import { X, Loader2, AlertCircle, Megaphone } from 'lucide-react';
// import { adConfig } from '@/config/ads';
// import { useAdContext } from '@/context/AdContext';

// const INTERSTITIAL_DURATION_MS = 5000;
// const LOAD_MS = 1000;

// /**
//  * Full-screen interstitial ad overlay, shown only at natural breaks
//  * (after a completed game). Self-dismisses after the simulated ad plays.
//  * If ads are disabled, it calls onSkip immediately so the user is never blocked.
//  */
// export function InterstitialAd({
//   open,
//   onComplete,
//   onSkip,
// }: {
//   open: boolean;
//   onComplete: () => void;
//   onSkip: () => void;
// }) {
//   const { adsActive } = useAdContext();
//   const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
//   const [countdown, setCountdown] = useState(Math.ceil(INTERSTITIAL_DURATION_MS / 1000));

//   useEffect(() => {
//     if (!open) return;
//     if (!adConfig.enabled || !adsActive) {
//       onSkip();
//       return;
//     }
//     setStatus('loading');
//     setCountdown(Math.ceil(INTERSTITIAL_DURATION_MS / 1000));
//     const loadTimer = setTimeout(() => {
//       const failed = Math.random() < 0.05;
//       setStatus(failed ? 'error' : 'loaded');
//     }, LOAD_MS);
//     return () => clearTimeout(loadTimer);
//   }, [open, adsActive, onSkip]);

//   useEffect(() => {
//     if (!open || status !== 'loaded') return;
//     const tick = setInterval(() => {
//       setCountdown((c) => {
//         if (c <= 1) {
//           clearInterval(tick);
//           onComplete();
//           return 0;
//         }
//         return c - 1;
//       });
//     }, 1000);
//     return () => clearInterval(tick);
//   }, [open, status, onComplete]);

//   useEffect(() => {
//     if (!open || status !== 'error') return;
//     const t = setTimeout(onSkip, 1500);
//     return () => clearTimeout(t);
//   }, [open, status, onSkip]);

//   if (!open) return null;
//   if (!adConfig.enabled || !adsActive) return null;

//   return (
//     <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-950/80 backdrop-blur-sm animate-fade-in">
//       <div className="relative mx-4 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-card dark:bg-ink-900 animate-pop-in">
//         <div className="flex items-center justify-between border-b border-ink-200 px-4 py-2.5 dark:border-ink-800">
//           <span className="text-xs font-bold uppercase tracking-wide text-ink-400">
//             Advertisement
//           </span>
//           {status === 'loaded' && (
//             <button
//               onClick={onSkip}
//               className="flex items-center gap-1 text-xs font-semibold text-ink-500 transition-colors hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200"
//             >
//               Skip <X size={14} />
//             </button>
//           )}
//         </div>
//         <div className="flex h-64 w-full items-center justify-center sm:h-72">
//           {status === 'loading' && (
//             <div className="flex flex-col items-center gap-3 text-ink-400">
//               <Loader2 size={28} className="animate-spin text-primary-500" />
//               <span className="text-sm font-medium">Loading ad…</span>
//             </div>
//           )}
//           {status === 'error' && (
//             <div className="flex flex-col items-center gap-3 text-error-500">
//               <AlertCircle size={28} />
//               <span className="text-sm font-medium">Ad unavailable — continuing…</span>
//             </div>
//           )}
//           {status === 'loaded' && (
//             <div className="flex flex-col items-center gap-3">
//               <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary-500/15 text-primary-500">
//                 <Megaphone size={28} />
//               </div>
//               <p className="font-display text-lg font-bold">Test Interstitial</p>
//               <p className="text-sm text-ink-500 dark:text-ink-400">
//                 This is a safe development placeholder.
//               </p>
//               <p className="text-xs font-semibold text-ink-400">
//                 Continuing in {countdown}s…
//               </p>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }



import { useEffect, useRef } from 'react';
import { AdMob } from '@capacitor-community/admob';
import { adConfig } from '@/config/ads';
import { useAdContext } from '@/context/AdContext';

export function InterstitialAd({
  open,
  onComplete,
  onSkip,
}: {
  open: boolean;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const { adsActive } = useAdContext();
  const showingRef = useRef(false);

  useEffect(() => {
    if (!open) return;

    if (
      !adConfig.enabled ||
      !adsActive ||
      !adConfig.unitIds.interstitial
    ) {
      onSkip();
      return;
    }

    if (showingRef.current) return;

    const showAd = async () => {
      try {
        showingRef.current = true;

        console.log('Interstitial Ad: Preparing...');

        await AdMob.initialize();

        await AdMob.prepareInterstitial({
          adId: adConfig.unitIds.interstitial,
          isTesting: true,
        });

        console.log('Interstitial Ad: Prepared');

        await AdMob.showInterstitial();

        console.log('Interstitial Ad: Shown');

        onComplete();
      } catch (error) {
        console.error('Interstitial Ad Error:', error);
        onSkip();
      } finally {
        showingRef.current = false;
      }
    };

    showAd();
  }, [open, adsActive, onComplete, onSkip]);

  return null;
}
