'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'

interface Props {
  initial: {
    name: string
    description: string
    contactEmail: string
    phoneNumber: string
    streetAddress: string
    locality: string
    region: string
    postalCode: string
    country: string
    latitude: string
    longitude: string
    openingHours: string
    logoUrl: string
    faviconUrl: string
    copyrightHolder: string
    primaryDomain: string
    socialLinks: string
  } | null
  csrf: string
}

export function BusinessForm({ initial, csrf }: Props) {
  const router = useRouter()
  const [v, setV] = useState(initial || {
    name: '', description: '', contactEmail: '', phoneNumber: '',
    streetAddress: '', locality: '', region: '', postalCode: '', country: '',
    latitude: '', longitude: '', openingHours: '', logoUrl: '', faviconUrl: '',
    copyrightHolder: '', primaryDomain: '', socialLinks: '',
  })
  const [loading, setLoading] = useState(false)
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV(prev => ({ ...prev, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        credentials: 'same-origin',
        body: JSON.stringify(v),
      })
      if (res.ok) {
        toast.success('Saved.')
        router.refresh()
      } else if (res.status === 403) {
        toast.error('Session expired. Reload.')
      } else {
        toast.error('Could not save.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Business name</Label>
          <Input id="name" value={v.name} onChange={set('name')} className="mt-1" maxLength={120} required />
        </div>
        <div>
          <Label htmlFor="copyrightHolder">Copyright holder</Label>
          <Input id="copyrightHolder" value={v.copyrightHolder} onChange={set('copyrightHolder')} className="mt-1" maxLength={120} />
        </div>
      </div>
      <div>
        <Label htmlFor="description">Business description</Label>
        <Textarea id="description" value={v.description} onChange={set('description')} className="mt-1" rows={3} maxLength={500} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="contactEmail">Contact email</Label>
          <Input id="contactEmail" type="email" value={v.contactEmail} onChange={set('contactEmail')} className="mt-1" maxLength={254} />
        </div>
        <div>
          <Label htmlFor="phoneNumber">Phone number</Label>
          <Input id="phoneNumber" type="tel" value={v.phoneNumber} onChange={set('phoneNumber')} className="mt-1" maxLength={40} />
        </div>
      </div>
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="text-sm font-medium">Physical address (leave empty if not applicable)</legend>
        <div className="sm:col-span-2">
          <Label htmlFor="streetAddress">Street address</Label>
          <Input id="streetAddress" value={v.streetAddress} onChange={set('streetAddress')} className="mt-1" maxLength={200} />
        </div>
        <div>
          <Label htmlFor="locality">Locality</Label>
          <Input id="locality" value={v.locality} onChange={set('locality')} className="mt-1" maxLength={120} />
        </div>
        <div>
          <Label htmlFor="region">Region</Label>
          <Input id="region" value={v.region} onChange={set('region')} className="mt-1" maxLength={120} />
        </div>
        <div>
          <Label htmlFor="postalCode">Postal code</Label>
          <Input id="postalCode" value={v.postalCode} onChange={set('postalCode')} className="mt-1" maxLength={20} />
        </div>
        <div>
          <Label htmlFor="country">Country</Label>
          <Input id="country" value={v.country} onChange={set('country')} className="mt-1" maxLength={80} />
        </div>
        <div>
          <Label htmlFor="latitude">Latitude</Label>
          <Input id="latitude" type="number" step="any" value={v.latitude} onChange={set('latitude')} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="longitude">Longitude</Label>
          <Input id="longitude" type="number" step="any" value={v.longitude} onChange={set('longitude')} className="mt-1" />
        </div>
      </fieldset>
      <div>
        <Label htmlFor="openingHours">Opening hours</Label>
        <Input id="openingHours" value={v.openingHours} onChange={set('openingHours')} className="mt-1" maxLength={200} placeholder="Mon-Fri 9:00-17:00" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="primaryDomain">Primary custom domain</Label>
          <Input id="primaryDomain" value={v.primaryDomain} onChange={set('primaryDomain')} className="mt-1" maxLength={200} placeholder="chefmate.example.com" />
        </div>
        <div>
          <Label htmlFor="socialLinks">Social links (JSON)</Label>
          <Input id="socialLinks" value={v.socialLinks} onChange={set('socialLinks')} className="mt-1" placeholder='{"twitter":"https://..."}' />
        </div>
        <div>
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input id="logoUrl" value={v.logoUrl} onChange={set('logoUrl')} className="mt-1" placeholder="/media/logo.png" />
        </div>
        <div>
          <Label htmlFor="faviconUrl">Favicon URL</Label>
          <Input id="faviconUrl" value={v.faviconUrl} onChange={set('faviconUrl')} className="mt-1" placeholder="/media/favicon.ico" />
        </div>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save business profile
      </Button>
    </form>
  )
}
