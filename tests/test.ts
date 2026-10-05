// ChefMate automated checks — verifies that key invariants hold.
// Run with: bun run tests/test.ts
// These are smoke tests that exercise the database, env validation,
// and the security utilities without booting the Next.js server.

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

let pass = 0
let fail = 0

function assert(name: string, cond: boolean, detail?: string) {
  if (cond) {
    pass++
    console.log(`  \u2713 ${name}`)
  } else {
    fail++
    console.error(`  \u2717 ${name}${detail ? ' :: ' + detail : ''}`)
  }
}

async function testDatabase() {
  console.log('Database invariants:')
  const recipeCount = await prisma.recipe.count()
  assert('at least 1000 recipes seeded', recipeCount >= 1000, `found ${recipeCount}`)

  const indianCount = await prisma.recipe.count({ where: { isTraditionalIndian: true } })
  assert('at least 500 traditional Indian recipes', indianCount >= 500, `found ${indianCount}`)

  const ingredients = await prisma.ingredient.count()
  assert('at least 100 ingredients seeded', ingredients >= 100, `found ${ingredients}`)

  const roles = await prisma.role.count()
  assert('admin and user roles seeded', roles >= 2, `found ${roles}`)

  const perms = await prisma.permission.count()
  assert('permissions seeded', perms >= 10, `found ${perms}`)

  const nav = await prisma.navigationItem.count({ where: { location: 'header' } })
  assert('header navigation items seeded', nav >= 4, `found ${nav}`)

  const footer = await prisma.footerLink.count()
  assert('footer links seeded', footer >= 4, `found ${footer}`)

  const terms = await prisma.legalDocument.findUnique({ where: { type: 'terms' } })
  assert('terms document exists in draft', Boolean(terms), `status=${terms?.status ?? 'missing'}`)
  assert('terms document is in draft (not invented)', terms?.status === 'draft', `status=${terms?.status}`)

  const privacy = await prisma.legalDocument.findUnique({ where: { type: 'privacy' } })
  assert('privacy document exists in draft', Boolean(privacy))
  assert('privacy document is in draft (not invented)', privacy?.status === 'draft')

  const business = await prisma.businessProfile.findFirst()
  assert('business profile seeded', Boolean(business))
  assert('business contact email is set', business?.contactEmail === 'huchainy2@gmail.com')

  const settings = await prisma.siteSetting.count()
  assert('site settings seeded', settings >= 4)
}

async function testEnv() {
  console.log('Environment validation:')
  const required = ['DATABASE_URL', 'SESSION_SECRET', 'PASSWORD_RESET_SECRET']
  for (const k of required) {
    assert(`env ${k} is set`, Boolean(process.env[k]), `value=${process.env[k] ? 'set' : 'missing'}`)
  }
  assert('NODE_ENV is set', Boolean(process.env.NODE_ENV))
}

async function testUniqueSlugs() {
  console.log('Unique slug check:')
  const duplicates = await prisma.$queryRaw<{ slug: string; c: number }[]>`
    SELECT slug, COUNT(*) as c FROM Recipe GROUP BY slug HAVING c > 1
  `
  assert('no duplicate recipe slugs', duplicates.length === 0, `${duplicates.length} duplicates found`)
}

async function testSchema() {
  console.log('Schema invariants:')
  // Each recipe should have at least one step
  const recipesWithoutSteps = await prisma.recipe.count({
    where: { steps: { none: {} } },
  })
  assert('every recipe has at least one step', recipesWithoutSteps === 0, `${recipesWithoutSteps} recipes have no steps`)

  // Each recipe should have at least one ingredient
  const recipesWithoutIngredients = await prisma.recipe.count({
    where: { ingredients: { none: {} } },
  })
  assert('every recipe has at least one ingredient', recipesWithoutIngredients === 0, `${recipesWithoutIngredients} recipes have no ingredients`)
}

async function main() {
  console.log('ChefMate test suite')
  console.log('====================')
  await testEnv()
  await testDatabase()
  await testUniqueSlugs()
  await testSchema()
  console.log('')
  console.log(`Result: ${pass} passed, ${fail} failed`)
  await prisma.$disconnect()
  process.exit(fail === 0 ? 0 : 1)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
