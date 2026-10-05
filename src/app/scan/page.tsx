import Link from 'next/link'
import { env } from '@/lib/env'
import { getSiteSettings } from '@/lib/site'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Refrigerator, AlertCircle, Camera, CheckCircle2 } from 'lucide-react'
import { ScanForm } from '@/components/scan-form'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return {
    title: 'Scan your fridge',
    description: `Upload a photo of your fridge or pantry and ${settings.siteName} will try to identify the ingredients for you.`,
    alternates: { canonical: '/scan' },
  }
}

export default async function ScanPage() {
  const settings = await getSiteSettings()
  const visionConfigured = env.vision.enabled

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Scan fridge', href: '/scan' },
      ]} />

      <header className="mt-4">
        <p className="text-sm text-primary">{settings.siteName} scanner</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Scan your fridge or pantry</h1>
        <p className="mt-2 text-muted-foreground">
          Upload a photo of what you have. ChefMate will try to identify the ingredients so you can verify them and find matching recipes.
        </p>
      </header>

      {!visionConfigured && (
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-5 w-5 text-amber-600" /> Vision service is not configured
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-800">
            <p>
              The owner has not enabled a vision provider yet. You can still add your ingredients manually below.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="animate-fade-up animate-delay-1 mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Camera className="h-5 w-5" /> Upload or capture an image
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScanForm visionConfigured={visionConfigured} />
        </CardContent>
      </Card>

      <Card className="animate-fade-up animate-delay-2 mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-5 w-5" /> What happens next
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground">
          <p>1. ChefMate attempts to identify the ingredients in your photo.</p>
          <p>2. You review and correct the list before anything is saved.</p>
          <p>3. ChefMate matches the ingredients against published recipes.</p>
          <p>4. You can mark items as missing so they go onto your grocery list.</p>
        </CardContent>
      </Card>

      <p className="mt-6 text-sm text-muted-foreground">
        Prefer not to upload an image? <Link href="/recipes" className="underline underline-offset-4 hover:text-foreground">Browse recipes directly</Link>.
      </p>
    </div>
  )
}
