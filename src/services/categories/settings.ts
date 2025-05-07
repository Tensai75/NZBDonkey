export const categoriesDefaultSettings: CategoriesSettings = {
  useCategories: false,
  type: 'manual',
  fallback: 'none',
  categories: [],
}

export type CategoriesSettings = {
  useCategories: boolean
  type: 'automatic' | 'manual' | 'fixed'
  fallback: 'none' | 'manual' | 'fixed'
  categories: CategorySettings[]
}

export const categoryDefaultSettings: CategorySettings = {
  active: true,
  isDefault: false,
  name: '',
  regexp: '',
  isTargetCategory: false,
}

export type CategorySettings = {
  active: boolean
  isDefault: boolean
  name: string
  regexp: string
  isTargetCategory: boolean
}
