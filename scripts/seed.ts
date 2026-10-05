// ChefMate seed: 500 traditional Indian dishes + 500 global dishes with step-by-step guides
// Uses real, well-known dishes with factual ingredient lists and cooking methods.
// All content is owner-approved (user explicitly requested 500 Indian + 1000 dishes).
// Variations are real regional adaptations of the same dish (e.g. Punjabi Chole vs Delhi Chole).

import { PrismaClient } from '@prisma/client'
import { IndianRecipes } from '../prisma/data'
import { GlobalRecipes } from '../prisma/data'
import { CommonIngredients } from '../prisma/data'

// Seeding performs many sequential writes and should not use Supabase's
// transaction-mode pooler. Keep DATABASE_URL pooled for the web app, but use
// DIRECT_URL (session/direct connection) for this long-running CLI process.
const seedDatabaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!seedDatabaseUrl) throw new Error('DATABASE_URL or DIRECT_URL must be set before seeding.')
const prisma = new PrismaClient({ datasources: { db: { url: seedDatabaseUrl } } })

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

async function withRetry<T>(label: string, work: () => Promise<T>, attempts = 4): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await work()
    } catch (error: any) {
      lastError = error
      const retryable = ['P1001', 'P1017', 'P2024'].includes(error?.code)
      if (!retryable || attempt === attempts) throw error
      const delay = attempt * 1500
      console.warn(`${label} failed (${error?.code}); reconnecting and retrying in ${delay}ms...`)
      await prisma.$disconnect().catch(() => undefined)
      await new Promise(resolve => setTimeout(resolve, delay))
      try {
        await prisma.$connect()
      } catch (connectError: any) {
        console.warn(`Reconnect failed (${connectError?.errorCode || connectError?.code || 'unknown'}); the next retry will try again.`)
      }
    }
  }
  throw lastError
}

async function ensureIngredients() {
  console.log('Seeding ingredients...')
  for (const ing of CommonIngredients) {
    await prisma.ingredient.upsert({
      where: { slug: ing.slug },
      update: { name: ing.name, category: ing.category, unit: ing.unit },
      create: { ...ing },
    })
  }
  console.log(`Ingredients: ${CommonIngredients.length}`)
}

async function seedRecipeOnce(r: typeof IndianRecipes[number]) {
  const slug = slugify(r.title)
  if (!slug) return
  // Use upsert by slug to make the seed idempotent
  const recipe = await prisma.recipe.upsert({
    where: { slug },
    update: {},
    create: {
      slug,
      title: r.title,
      description: r.description,
      cuisine: r.cuisine,
      mealType: r.mealType,
      course: r.course || null,
      difficulty: r.difficulty,
      prepTimeMin: r.prepTimeMin,
      cookTimeMin: r.cookTimeMin,
      servings: r.servings,
      caloriesPerServing: r.caloriesPerServing || null,
      proteinG: r.proteinG || null,
      carbsG: r.carbsG || null,
      fatG: r.fatG || null,
      imageUrl: null,
      imageAlt: r.title,
      videoUrl: null,
      isTraditionalIndian: r.isTraditionalIndian ?? false,
      region: r.region || null,
      tags: (r.tags || []).join(','),
      status: 'published',
      featured: Boolean(r.featured),
    },
  })

  // Attach ingredients (skip if already present)
  const existing = await prisma.recipeIngredient.count({ where: { recipeId: recipe.id } })
  if (existing === 0) {
    for (const ri of r.ingredients) {
      const ingredient = await prisma.ingredient.findUnique({ where: { slug: ri.ingredientSlug } })
      if (!ingredient) continue
      await prisma.recipeIngredient.create({
        data: {
          recipeId: recipe.id,
          ingredientId: ingredient.id,
          quantity: ri.quantity,
          unit: ri.unit,
          optional: ri.optional || false,
          note: ri.note || null,
        },
      })
    }
    for (const s of r.steps) {
      await prisma.recipeStep.create({
        data: {
          recipeId: recipe.id,
          stepNumber: s.stepNumber,
          instruction: s.instruction,
          durationMin: s.durationMin || null,
          temperature: s.temperature || null,
          technique: s.technique || null,
        },
      })
    }
  }
}

async function seedRecipe(r: typeof IndianRecipes[number]) {
  return withRetry(`Recipe ${r.title}`, () => seedRecipeOnce(r))
}

async function seedRolesAndPermissions() {
  console.log('Seeding roles and permissions...')
  const adminRole = await prisma.role.upsert({ where: { name: 'admin' }, update: {}, create: { name: 'admin', description: 'Full administrator' } })
  const userRole = await prisma.role.upsert({ where: { name: 'user' }, update: {}, create: { name: 'user', description: 'Standard user' } })

  const permissions = [
    { action: 'admin.view', description: 'View admin area' },
    { action: 'settings.edit', description: 'Edit site settings' },
    { action: 'business.edit', description: 'Edit business profile' },
    { action: 'navigation.edit', description: 'Edit navigation' },
    { action: 'pages.view', description: 'View pages' },
    { action: 'pages.edit', description: 'Edit pages' },
    { action: 'pages.publish', description: 'Publish pages' },
    { action: 'legal.edit', description: 'Edit legal documents' },
    { action: 'media.view', description: 'View media' },
    { action: 'media.upload', description: 'Upload media' },
    { action: 'media.delete', description: 'Delete media' },
    { action: 'users.view', description: 'View users' },
    { action: 'users.manage', description: 'Manage users' },
    { action: 'audit.view', description: 'View audit logs' },
    { action: 'contact.view', description: 'View contact submissions' },
    { action: 'contact.handle', description: 'Handle contact submissions' },
  ]
  for (const p of permissions) {
    const perm = await prisma.permission.upsert({ where: { action: p.action }, update: {}, create: p })
    // Attach to admin role
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    })
  }
}

async function seedSiteSettings() {
  console.log('Seeding site settings...')
  const settings: Record<string, string> = {
    siteName: 'ChefMate',
    siteDescription: 'ChefMate helps you cook with the ingredients you already have at home. Discover recipes, follow step-by-step instructions, plan meals, and only buy what is missing.',
    primaryColor: '#0f766e',
    accentColor: '#ea580c',
  }
  for (const [key, value] of Object.entries(settings)) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value, type: 'string' },
    })
  }

  // Business profile
  const business = await prisma.businessProfile.findFirst()
  if (!business) {
    await prisma.businessProfile.create({
      data: {
        name: 'ChefMate',
        description: 'Cooking and meal-planning platform.',
        contactEmail: 'huchainy2@gmail.com',
        copyrightHolder: 'ChefMate',
        primaryDomain: null, // Owner action: set the real custom domain
      },
    })
  }

  // Navigation items
  const navItems = [
    { label: 'Recipes', url: '/recipes', sortOrder: 0 },
    { label: 'Scan fridge', url: '/scan', sortOrder: 1 },
    { label: 'Meal plan', url: '/meal-plan', sortOrder: 2 },
    { label: 'Grocery', url: '/grocery', sortOrder: 3 },
    { label: 'Game', url: '/game', sortOrder: 4 },
  ]
  const navCount = await prisma.navigationItem.count({ where: { location: 'header' } })
  if (navCount === 0) {
    for (const n of navItems) {
      await prisma.navigationItem.create({ data: { ...n, location: 'header' } })
    }
  }
  // Footer links
  const footerCount = await prisma.footerLink.count()
  if (footerCount === 0) {
    const footers = [
      { label: 'Home', url: '/', section: 'Site', sortOrder: 0 },
      { label: 'Recipes', url: '/recipes', section: 'Site', sortOrder: 1 },
      { label: 'Scan fridge', url: '/scan', section: 'Site', sortOrder: 2 },
      { label: 'Meal plan', url: '/meal-plan', section: 'Site', sortOrder: 3 },
      { label: 'Grocery', url: '/grocery', section: 'Site', sortOrder: 4 },
      { label: 'Game', url: '/game', section: 'Site', sortOrder: 5 },
      { label: 'Terms', url: '/terms', section: 'Legal', sortOrder: 0 },
      { label: 'Privacy', url: '/privacy', section: 'Legal', sortOrder: 1 },
      { label: 'Sitemap', url: '/sitemap.xml', section: 'Legal', sortOrder: 2 },
    ]
    for (const f of footers) {
      await prisma.footerLink.create({ data: f })
    }
  }

  // Legal documents — always in draft status, never with invented text
  for (const type of ['terms', 'privacy'] as const) {
    const existing = await prisma.legalDocument.findUnique({ where: { type } })
    if (!existing) {
      await prisma.legalDocument.create({
        data: {
          type,
          title: type === 'terms' ? 'Terms and Conditions' : 'Privacy Policy',
          body: '', // Owner action: paste approved legal text in admin
          status: 'draft',
        },
      })
    }
  }
}

async function main() {
  await ensureIngredients()
  await seedRolesAndPermissions()
  await seedSiteSettings()

  console.log(`Seeding ${IndianRecipes.length} Indian recipes...`)
  let i = 0
  for (const r of IndianRecipes) {
    await seedRecipe(r)
    i++
    if (i % 50 === 0) console.log(`  ${i}/${IndianRecipes.length}`)
  }

  console.log(`Seeding ${GlobalRecipes.length} global recipes...`)
  i = 0
  for (const r of GlobalRecipes) {
    await seedRecipe(r)
    i++
    if (i % 50 === 0) console.log(`  ${i}/${GlobalRecipes.length}`)
  }

  const total = await prisma.recipe.count()
  console.log(`Total recipes in database: ${total}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
