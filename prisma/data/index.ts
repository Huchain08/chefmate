import { readFileSync } from 'fs'
import { join } from 'path'

const dataDir = join(process.cwd(), 'prisma', 'data')
export const IndianRecipes = JSON.parse(readFileSync(join(dataDir, 'indian-recipes.json'), 'utf-8'))
export const GlobalRecipes = JSON.parse(readFileSync(join(dataDir, 'global-recipes.json'), 'utf-8'))
export const CommonIngredients = JSON.parse(readFileSync(join(dataDir, 'ingredients.json'), 'utf-8'))
