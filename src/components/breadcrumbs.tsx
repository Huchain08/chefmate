import Link from 'next/link'

interface BreadcrumbItem { label: string; href: string }

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-1 text-muted-foreground">
        {items.map((item, i) => (
          <li key={item.href} className="flex items-center gap-1">
            {i === items.length - 1 ? (
              <span aria-current="page" className="text-foreground">{item.label}</span>
            ) : (
              <>
                <Link href={item.href} className="hover:text-foreground hover:underline underline-offset-4">{item.label}</Link>
                <span aria-hidden="true">/</span>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
