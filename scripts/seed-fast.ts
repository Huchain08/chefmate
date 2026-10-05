import { PrismaClient } from '@prisma/client'
import { IndianRecipes, GlobalRecipes, CommonIngredients } from '../prisma/data'

const seedDatabaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!seedDatabaseUrl) throw new Error('DATABASE_URL or DIRECT_URL must be set before seeding.')

const prisma = new PrismaClient({ datasources: { db: { url: seedDatabaseUrl } } })
const recipes = [...IndianRecipes, ...GlobalRecipes]
const CHUNK_SIZE = 200

type RecipeInput = (typeof IndianRecipes)[number]

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

async function inChunks<T>(items: T[], work: (chunk: T[]) => Promise<void>) {
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    await work(items.slice(i, i + CHUNK_SIZE))
  }
}

async function seedIngredients() {
  console.log(`Seeding ${CommonIngredients.length} ingredients in bulk...`)
  await prisma.ingredient.createMany({ data: CommonIngredients, skipDuplicates: true })
}

async function seedRolesAndPermissions() {
  console.log('Seeding roles and permissions...')
  const adminRole = await prisma.role.upsert({ where: { name: 'admin' }, update: {}, create: { name: 'admin', description: 'Full administrator' } })
  await prisma.role.upsert({ where: { name: 'user' }, update: {}, create: { name: 'user', description: 'Standard user' } })

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

  await prisma.permission.createMany({ data: permissions, skipDuplicates: true })
  const savedPermissions = await prisma.permission.findMany({ where: { action: { in: permissions.map(p => p.action) } }, select: { id: true } })
  await prisma.rolePermission.createMany({
    data: savedPermissions.map(permission => ({ roleId: adminRole.id, permissionId: permission.id })),
    skipDuplicates: true,
  })
}

async function seedSiteSettings() {
  console.log('Seeding site settings...')
  const settings = [
    { key: 'siteName', value: 'ChefMate', type: 'string' },
    { key: 'siteDescription', value: 'ChefMate helps you cook with the ingredients you already have at home. Discover recipes, follow step-by-step instructions, plan meals, and only buy what is missing.', type: 'string' },
    { key: 'primaryColor', value: '#0f766e', type: 'string' },
    { key: 'accentColor', value: '#ea580c', type: 'string' },
  ]
  for (const setting of settings) {
    await prisma.siteSetting.upsert({ where: { key: setting.key }, update: { value: setting.value }, create: setting })
  }

  if (!(await prisma.businessProfile.findFirst())) {
    await prisma.businessProfile.create({ data: { name: 'ChefMate', description: 'Cooking and meal-planning platform.', contactEmail: 'huchainy2@gmail.com', copyrightHolder: 'ChefMate' } })
  }

  const navItems = [
    { label: 'Recipes', url: '/recipes', sortOrder: 0 },
    { label: 'Scan fridge', url: '/scan', sortOrder: 1 },
    { label: 'Meal plan', url: '/meal-plan', sortOrder: 2 },
    { label: 'Grocery', url: '/grocery', sortOrder: 3 },
    { label: 'Game', url: '/game', sortOrder: 4 },
  ]
  if (!(await prisma.navigationItem.count({ where: { location: 'header' } }))) {
    await prisma.navigationItem.createMany({ data: navItems.map(item => ({ ...item, location: 'header' })) })
  }

  if (!(await prisma.footerLink.count())) {
    await prisma.footerLink.createMany({ data: [
      { label: 'Home', url: '/', section: 'Site', sortOrder: 0 },
      { label: 'Recipes', url: '/recipes', section: 'Site', sortOrder: 1 },
      { label: 'Scan fridge', url: '/scan', section: 'Site', sortOrder: 2 },
      { label: 'Meal plan', url: '/meal-plan', section: 'Site', sortOrder: 3 },
      { label: 'Grocery', url: '/grocery', section: 'Site', sortOrder: 4 },
      { label: 'Game', url: '/game', section: 'Site', sortOrder: 5 },
      { label: 'Terms', url: '/terms', section: 'Legal', sortOrder: 0 },
      { label: 'Privacy', url: '/privacy', section: 'Legal', sortOrder: 1 },
      { label: 'Sitemap', url: '/sitemap', section: 'Legal', sortOrder: 2 },
    ] })
  }

  // Legal documents — seeded as published with real content so they work out of the box.
  // To update the content, edit scripts/seed-legal.ts and re-run: tsx scripts/seed-legal.ts
  const legalDocs = [
    { type: 'terms', title: 'Terms of Service' },
    { type: 'privacy', title: 'Privacy Policy' },
  ] as const
  for (const { type, title } of legalDocs) {
    const existing = await prisma.legalDocument.findUnique({ where: { type } })
    if (!existing) {
      // Body will be populated by seed-legal.ts — create placeholder so FK constraints are met
      await prisma.legalDocument.create({ data: { type, title, body: '', status: 'draft' } })
    }
  }
}

async function seedRecipes() {
  console.log(`Seeding ${recipes.length} recipes in bulk...`)
  const recipeRows = recipes.map((recipe: RecipeInput) => ({
    slug: slugify(recipe.title),
    title: recipe.title,
    description: recipe.description,
    cuisine: recipe.cuisine,
    mealType: recipe.mealType,
    course: recipe.course || null,
    difficulty: recipe.difficulty,
    prepTimeMin: recipe.prepTimeMin,
    cookTimeMin: recipe.cookTimeMin,
    servings: recipe.servings,
    caloriesPerServing: recipe.caloriesPerServing || null,
    proteinG: recipe.proteinG || null,
    carbsG: recipe.carbsG || null,
    fatG: recipe.fatG || null,
    imageUrl: null,
    imageAlt: recipe.title,
    videoUrl: null,
    isTraditionalIndian: recipe.isTraditionalIndian ?? false,
    region: recipe.region || null,
    tags: (recipe.tags || []).join(','),
    status: 'published',
    featured: Boolean(recipe.featured),
  }))
  await inChunks(recipeRows, chunk => prisma.recipe.createMany({ data: chunk, skipDuplicates: true }).then(() => undefined))

  const [savedRecipes, savedIngredients] = await Promise.all([
    prisma.recipe.findMany({ select: { id: true, slug: true } }),
    prisma.ingredient.findMany({ select: { id: true, slug: true } }),
  ])
  const recipeBySlug = new Map(savedRecipes.map(recipe => [recipe.slug, recipe.id]))
  const ingredientBySlug = new Map(savedIngredients.map(ingredient => [ingredient.slug, ingredient.id]))

  const existingIngredients = await prisma.recipeIngredient.findMany({ select: { recipeId: true, ingredientId: true } })
  const ingredientKeys = new Set(existingIngredients.map(row => `${row.recipeId}:${row.ingredientId}`))
  const ingredientRows: Array<{ recipeId: string; ingredientId: string; quantity: number; unit: string; optional: boolean; note: string | null }> = []

  const existingSteps = await prisma.recipeStep.findMany({ select: { recipeId: true, stepNumber: true } })
  const stepKeys = new Set(existingSteps.map(row => `${row.recipeId}:${row.stepNumber}`))
  const stepRows: Array<{ recipeId: string; stepNumber: number; instruction: string; durationMin: number | null; temperature: string | null; technique: string | null }> = []

  for (const recipe of recipes as RecipeInput[]) {
    const recipeId = recipeBySlug.get(slugify(recipe.title))
    if (!recipeId) continue
    for (const item of recipe.ingredients) {
      const ingredientId = ingredientBySlug.get(item.ingredientSlug)
      if (!ingredientId || ingredientKeys.has(`${recipeId}:${ingredientId}`)) continue
      ingredientKeys.add(`${recipeId}:${ingredientId}`)
      ingredientRows.push({ recipeId, ingredientId, quantity: item.quantity, unit: item.unit, optional: item.optional || false, note: item.note || null })
    }
    for (const step of recipe.steps) {
      if (stepKeys.has(`${recipeId}:${step.stepNumber}`)) continue
      stepKeys.add(`${recipeId}:${step.stepNumber}`)
      stepRows.push({ recipeId, stepNumber: step.stepNumber, instruction: step.instruction, durationMin: step.durationMin || null, temperature: step.temperature || null, technique: step.technique || null })
    }
  }

  console.log(`Adding ${ingredientRows.length} recipe ingredients and ${stepRows.length} recipe steps in bulk...`)
  await inChunks(ingredientRows, chunk => prisma.recipeIngredient.createMany({ data: chunk }).then(() => undefined))
  await inChunks(stepRows, chunk => prisma.recipeStep.createMany({ data: chunk }).then(() => undefined))
  console.log(`Total recipes in database: ${savedRecipes.length}`)
}

async function main() {
  await seedIngredients()
  await seedRolesAndPermissions()
  await seedSiteSettings()
  await seedRecipes()
}

main()
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => prisma.$disconnect())
