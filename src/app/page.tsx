import Link from 'next/link'
import { db } from '@/lib/db'
import { getSiteSettings } from '@/lib/site'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowUpRight, CalendarDays, ChefHat, Gamepad2, Refrigerator, Search, ShoppingBasket, Timer, Youtube } from 'lucide-react'
import { getRecipeImage, getRecipeImageAlt } from '@/lib/recipe-image'
import { TiltCard, StaggerGroup, StaggerItem } from '@/components/motion'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return { title: `${settings.siteName} — Cook with what you have`, description: settings.siteDescription, alternates: { canonical: '/' } }
}

const FEATURES = [
  { icon: Refrigerator, eyebrow: '01 / Start here', title: 'Scan your fridge', description: 'Turn what is already in your kitchen into a plan for tonight.', href: '/scan', cta: 'Open scanner' },
  { icon: Search, eyebrow: '02 / Explore', title: 'Browse recipes', description: 'A deep, searchable collection of Indian and global comfort food.', href: '/recipes', cta: 'Find a dish' },
  { icon: Timer, eyebrow: '03 / Stay in flow', title: 'Cook with timers', description: 'Keep every simmer, bake, and rest on track without leaving the recipe.', href: '/recipes', cta: 'See the recipes' },
  { icon: ShoppingBasket, eyebrow: '04 / Shop less', title: 'Find what is missing', description: 'Only buy the ingredients you need to finish the meal.', href: '/grocery', cta: 'Open grocery list' },
  { icon: CalendarDays, eyebrow: '05 / Make it easy', title: 'Plan your week', description: 'Save the good stuff and build a week of meals in minutes.', href: '/meal-plan', cta: 'Plan a meal' },
  { icon: Gamepad2, eyebrow: '06 / Take five', title: 'Play Chef Slice', description: 'A small arcade break with fruit, sandwiches, and flying dishes.', href: '/game', cta: 'Play a round' },
]

export default async function Home() {
  const settings = await getSiteSettings()
  let recipeCount = 0
  let indianCount = 0
  let featured: { id: string; slug: string; title: string; imageUrl: string | null; imageAlt: string | null; cuisine: string; cookTimeMin: number; difficulty: string }[] = []
  try {
    recipeCount = await db.recipe.count({ where: { status: 'published' } })
    indianCount = await db.recipe.count({ where: { status: 'published', isTraditionalIndian: true } })
    featured = await db.recipe.findMany({ where: { status: 'published', featured: true }, take: 4, orderBy: { createdAt: 'desc' }, select: { id: true, slug: true, title: true, imageUrl: true, imageAlt: true, cuisine: true, cookTimeMin: true, difficulty: true } })
    if (!featured.length) featured = await db.recipe.findMany({ where: { status: 'published' }, take: 4, orderBy: { createdAt: 'desc' }, select: { id: true, slug: true, title: true, imageUrl: true, imageAlt: true, cuisine: true, cookTimeMin: true, difficulty: true } })
  } catch { /* Empty state is valid before the database is seeded. */ }

  return <div className="w-full overflow-hidden">
    <section aria-labelledby="hero-heading" className="texture-dark relative isolate border-b border-border bg-[#173b35] text-[#fff7e9]">
      <div className="absolute -right-24 -top-28 -z-10 h-96 w-96 rounded-full bg-[#f2a65a]/25 blur-3xl" />
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:gap-20 lg:px-8 lg:py-24">
        <div className="animate-fade-up">
          <Badge className="rounded-full border-0 bg-[#f2a65a] px-4 py-2 text-[10px] font-black uppercase tracking-[.2em] text-[#173b35]">Your kitchen, but better</Badge>
          <h1 id="hero-heading" className="font-display mt-6 max-w-3xl text-6xl font-black uppercase leading-[.86] tracking-[-.07em] sm:text-8xl">Make something <span className="text-[#f2a65a]">good.</span></h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-[#fff7e9]/75">ChefMate turns the ingredients you have into food you actually want to eat. Scan, choose, cook, and make less of a meal of meal planning.</p>
          <div className="mt-9 flex flex-wrap gap-3"><Button asChild size="lg" className="rounded-full bg-[#f2a65a] px-6 font-bold text-[#173b35] hover:bg-[#ffc47c]"><Link href="/scan">Scan my fridge <ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button><Button asChild size="lg" variant="outline" className="rounded-full border-[#fff7e9]/30 bg-transparent px-6 text-[#fff7e9] hover:bg-[#fff7e9]/10"><Link href="/recipes">Browse recipes</Link></Button></div>
          {recipeCount > 0 && <p className="mt-7 text-xs font-bold uppercase tracking-[.16em] text-[#fff7e9]/55">{recipeCount.toLocaleString()} recipes{indianCount ? ` · ${indianCount.toLocaleString()} Indian classics` : ''}</p>}
        </div>
        <div className="relative mx-auto w-full max-w-[540px] animate-fade-up animate-delay-2">
          <div className="hero-card relative aspect-[.92] overflow-hidden rounded-[2rem] border border-[#fff7e9]/20 bg-[#f2a65a] p-4 shadow-2xl shadow-black/20"><div className="h-full overflow-hidden rounded-[1.5rem] bg-[url('https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1000&q=85')] bg-cover bg-center mix-blend-multiply" /><div className="absolute inset-4 rounded-[1.5rem] bg-gradient-to-t from-[#173b35]/65 via-transparent to-transparent" /><div className="absolute bottom-9 left-9 right-9 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-white/70">Tonight's mood</p><p className="font-display mt-1 text-4xl font-black uppercase tracking-[-.05em] text-white">Hungry.</p></div><ChefHat className="h-12 w-12 text-[#f2a65a]" /></div></div>
          <div className="absolute -bottom-5 -left-5 rounded-2xl bg-[#fff7e9] px-5 py-4 text-[#173b35] shadow-xl"><p className="text-[10px] font-black uppercase tracking-[.18em]">Less scrolling</p><p className="mt-1 font-display text-2xl font-black uppercase">More cooking</p></div>
        </div>
      </div>
    </section>

    <section aria-labelledby="features-heading" className="texture-paper border-b border-border/70 bg-background px-4 py-16 sm:px-6 lg:px-8 lg:py-24"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-xs font-black uppercase tracking-[.22em] text-primary">The kitchen toolkit</p><h2 id="features-heading" className="font-display mt-3 text-5xl font-black uppercase leading-none tracking-[-.06em] sm:text-7xl">Everything tastes<br /><span className="text-primary">better in motion.</span></h2></div><p className="max-w-sm text-sm leading-6 text-muted-foreground">One calm place to decide what to cook, get it done, and keep the good recipes close.</p></div><StaggerGroup className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">{FEATURES.map(({ icon: Icon, eyebrow, title, description, href, cta }) => <StaggerItem key={title}><Link href={href} className="group block bg-background p-7 transition-colors hover:bg-primary hover:text-primary-foreground"><div className="flex items-start justify-between"><span className="text-xs font-black uppercase tracking-[.15em] opacity-55">{eyebrow}</span><Icon className="h-6 w-6 text-primary transition-transform group-hover:rotate-12 group-hover:text-primary-foreground" /></div><h3 className="font-display mt-14 text-3xl font-black uppercase tracking-[-.04em]">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground group-hover:text-primary-foreground/75">{description}</p><span className="mt-7 inline-flex items-center text-xs font-black uppercase tracking-[.12em]">{cta}<ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></span></Link></StaggerItem>)}</StaggerGroup></div></section>

    {featured.length > 0 && <section aria-labelledby="featured-heading" className="bg-[#f2a65a] px-4 py-16 text-[#173b35] sm:px-6 lg:px-8 lg:py-24"><div className="mx-auto max-w-7xl"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.22em]">Worth making twice</p><h2 id="featured-heading" className="font-display mt-3 text-5xl font-black uppercase leading-none tracking-[-.06em] sm:text-7xl">The good stuff.</h2></div><Button asChild variant="outline" className="hidden rounded-full border-[#173b35]/30 bg-transparent text-[#173b35] hover:bg-[#173b35]/10 sm:inline-flex"><Link href="/recipes">See all recipes</Link></Button></div><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{featured.map(r => <Link key={r.id} href={`/recipes/${r.slug}`} className="group"><TiltCard><article className="overflow-hidden rounded-2xl bg-[#fff7e9] shadow-sm"><div className="aspect-[4/3] overflow-hidden"><img src={getRecipeImage(r.title, r.cuisine, r.imageUrl)} alt={getRecipeImageAlt(r.title, r.imageAlt)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" /></div><div className="p-4"><h3 className="font-display text-2xl font-black uppercase leading-none tracking-[-.04em]">{r.title}</h3><p className="mt-3 text-xs font-bold uppercase tracking-[.12em] text-[#173b35]/60">{r.cuisine} · {r.cookTimeMin} min · {r.difficulty}</p></div></article></TiltCard></Link>)}</div></div></section>}

    <section aria-labelledby="game-heading" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24"><div className="texture-dark overflow-hidden rounded-[2rem] bg-[#173b35] p-8 text-[#fff7e9] sm:p-12"><div className="grid items-center gap-8 md:grid-cols-[1fr_auto]"><div><p className="text-xs font-black uppercase tracking-[.22em] text-[#f2a65a]">A little intermission</p><h2 id="game-heading" className="font-display mt-3 text-5xl font-black uppercase leading-[.9] tracking-[-.06em] sm:text-7xl">Slice.<br />Score.<br /><span className="text-[#f2a65a]">Repeat.</span></h2><p className="mt-6 max-w-md leading-7 text-[#fff7e9]/70">A tiny arcade game for the moments when dinner needs a minute. Cut dishes, dodge bombs, and keep your kitchen reflexes sharp.</p><Button asChild className="mt-7 rounded-full bg-[#f2a65a] font-bold text-[#173b35] hover:bg-[#ffc47c]"><Link href="/game">Play Chef Slice <Gamepad2 className="ml-2 h-4 w-4" /></Link></Button></div><div className="hidden h-56 w-56 rotate-3 items-center justify-center rounded-[2rem] border-2 border-dashed border-[#f2a65a]/60 bg-[#f2a65a]/10 md:flex"><div className="text-center"><div className="font-display text-7xl font-black text-[#f2a65a]">+3</div><div className="text-xs font-black uppercase tracking-[.2em] text-[#fff7e9]/70">dish bonus</div></div></div></div></div></section>
    <section aria-labelledby="fallback-heading" className="border-t border-border bg-muted/40 px-4 py-12 sm:px-6 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 md:flex-row md:items-center"><div><p className="text-xs font-black uppercase tracking-[.2em] text-primary">Still hungry?</p><h2 id="fallback-heading" className="font-display mt-2 text-3xl font-black uppercase tracking-[-.04em]">Find the recipe. Make the meal.</h2></div><Button asChild variant="outline" className="rounded-full"><Link href="/recipes"><Youtube className="mr-2 h-4 w-4" /> Search recipes</Link></Button></div></section>
  </div>
}
