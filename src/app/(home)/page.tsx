import Image from "next/image";
import { Play, Sparkles } from "lucide-react";
import { Playfair_Display, Space_Grotesk } from "next/font/google";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProjectForm } from "@/modules/home/ui/components/project-form";

const display = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-grotesk",
});

const features = [
  {
    title: "Chat to build",
    description: "Describe screens, flows, or changes and watch layouts appear in real time.",
    accent: "from-neutral-900/25 via-neutral-700/15 to-white/15",
    image: "/images/images1.png",
  },
  {
    title: "Live preview",
    description: "See updates in seconds with visual diffs and interactive previews.",
    accent: "from-neutral-900/20 via-neutral-700/12 to-white/15",
    image: "/images/feature-preview.png",
  },

  {
    title: "Clean code export",
    description: "Human-readable React code with proper structure, types, and accessibility.",
    accent: "from-neutral-900/22 via-neutral-700/12 to-white/15",
    image: "/images/feature-code.png",
  },

];

const brands = ["Square", "Airtable", "Twitch", "Evernote", "Microsoft"];

export default function Page() {
  return (
    <div
      className={cn(
        "relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 transition-colors duration-300",
        "dark:from-[#050505] dark:via-[#0b0b0f] dark:to-black dark:text-white",
        grotesk.className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-80 dark:opacity-100"
        aria-hidden
      >
        <div className="absolute left-[-12%] top-[-8%] h-64 w-64 rounded-full bg-neutral-300/40 blur-[120px] dark:bg-white/5" />
        <div className="absolute right-[-10%] top-[10%] h-72 w-72 rounded-full bg-neutral-200/45 blur-[140px] dark:bg-white/8" />
        <div className="absolute left-[20%] bottom-[-5%] h-80 w-80 rounded-full bg-neutral-400/30 blur-[150px] dark:bg-white/6" />
      </div>

      <div className="relative z-10">
        <section className="mx-auto flex max-w-6xl flex-col items-center px-4 pt-28 pb-12 text-center md:pt-32">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/80 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-700 shadow-lg backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-white/70">
            <Sparkles className="h-4 w-4 text-slate-500 dark:text-white/60" />
            Live previews • Clean code • Instant deploys
          </div>

          <h1
            className={cn(
              "text-4xl leading-tight text-slate-900 md:text-6xl",
              "dark:text-white",
              display.className
            )}
          >
            Build the future
            <span className="block italic text-slate-800 dark:text-white/80">with a prompt</span>
          </h1>

          <p className="mt-4 max-w-2xl text-base text-slate-600 md:text-lg dark:text-white/70">
            From a single line of text, Lumo generates full apps with previews, edits, and instant deploys. Your imagination is the only limit.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-12 rounded-full bg-gradient-to-r from-black to-neutral-800 px-6 text-base font-semibold text-white shadow-[0_10px_45px_-18px_rgba(0,0,0,0.55)] hover:opacity-90"
            >
              Start for Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-slate-300/70 bg-white/80 px-6 text-base font-semibold text-slate-800 shadow-sm hover:bg-white/90 dark:border-white/20 dark:bg-white/10 dark:text-white"
            >
              <Play className="mr-2 h-4 w-4 fill-current" />
              Watch Demo
            </Button>
          </div>

          <div className="mt-12 w-full max-w-4xl">
            <div className="relative overflow-hidden rounded-[26px] border border-slate-200/60 bg-white/80 p-[1px] shadow-[0_30px_120px_-80px_rgba(0,0,0,0.45)] backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-white/30" aria-hidden />
              <div className="relative rounded-[24px] bg-white/80 px-6 py-8 ring-1 ring-black/5 dark:bg-[#0b0c15]/80 dark:ring-white/10">
                <p className="text-left text-sm font-semibold text-slate-800 dark:text-white/80">
                  Just chat your app into existence
                </p>
                <div className="mt-4">
                  <ProjectForm />
                </div>

              </div>
            </div>
          </div>

          <div className="mt-14 flex flex-wrap items-center justify-center gap-8 text-sm font-semibold uppercase tracking-wide text-slate-400 dark:text-white/40">
            {brands.map((brand) => (
              <span
                key={brand}
                className="opacity-80 transition-opacity hover:opacity-100"
              >
                {brand}
              </span>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/80 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-700 shadow-lg backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-white/70">
            Features that speed up your workflow
          </div>

          <h2
            className={cn(
              "mt-4 text-3xl text-slate-900 md:text-4xl",
              "dark:text-white",
              display.className
            )}
          >
            Everything you need to ship without boilerplate
          </h2>

          <p className="mt-3 text-base text-slate-600 md:text-lg dark:text-white/70">
            Go from prompt to production with live previews, edit-in-place, and safe publishing.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 p-[1px] shadow-[0_20px_80px_-60px_rgba(0,0,0,0.35)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_30px_120px_-80px_rgba(0,0,0,0.55)] dark:border-white/10 dark:bg-white/5"
              >
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-70 blur-3xl transition-opacity duration-300 group-hover:opacity-100",
                    feature.accent
                  )}
                  aria-hidden
                />
                <div className="relative flex h-full flex-col gap-4 rounded-[22px] bg-white/90 p-6 text-left ring-1 ring-black/5 dark:bg-[#0d0f1b]/85 dark:ring-white/5">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {feature.title}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-white/70">
                    {feature.description}
                  </p>
                  <div className="relative mt-auto aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200/60 bg-gradient-to-b from-slate-100 to-white shadow-inner dark:border-white/10 dark:from-white/5 dark:to-white/0">
                    <Image
                      src={`/images/images${i + 1}.png`}
                      alt={feature.title}
                      fill
                      sizes="(min-width: 1280px) 360px, (min-width: 768px) 50vw, 100vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent dark:from-black/40" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
