'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { X, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface GroceryList {
  id: string
  name: string
  items: { id: string; name: string; quantity: number; unit: string; purchased: boolean; note: string | null }[]
}

interface InventoryItem { id: string; name: string; quantity: number; unit: string }

interface Props {
  lists: GroceryList[]
  inventory: InventoryItem[]
}

export function GroceryListClient({ lists: initialLists, inventory }: Props) {
  const [lists, setLists] = useState(initialLists)
  const [newItemName, setNewItemName] = useState('')
  const [newItemQty, setNewItemQty] = useState('1')
  const [newItemUnit, setNewItemUnit] = useState('piece')
  const [newListName, setNewListName] = useState('')

  const csrf = () => document.cookie.match(/chefmate_csrf=([^;]+)/)?.[1] ?? ''

  const togglePurchased = async (listId: string, itemId: string, current: boolean) => {
    setLists(prev => prev.map(l => l.id === listId ? {
      ...l,
      items: l.items.map(it => it.id === itemId ? { ...it, purchased: !current } : it),
    } : l))
    try {
      await fetch(`/api/grocery/item/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        credentials: 'same-origin',
        body: JSON.stringify({ purchased: !current }),
      })
    } catch {}
  }

  const deleteItem = async (listId: string, itemId: string) => {
    setLists(prev => prev.map(l => l.id === listId ? { ...l, items: l.items.filter(it => it.id !== itemId) } : l))
    try {
      await fetch(`/api/grocery/item/${itemId}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrf() },
        credentials: 'same-origin',
      })
    } catch {}
  }

  const addItem = async (listId: string) => {
    if (!newItemName.trim()) return
    try {
      const res = await fetch(`/api/grocery/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        credentials: 'same-origin',
        body: JSON.stringify({ name: newItemName, quantity: parseFloat(newItemQty) || 1, unit: newItemUnit }),
      })
      if (res.ok) {
        const d = await res.json()
        setLists(prev => prev.map(l => l.id === listId ? { ...l, items: [...l.items, d] } : l))
        setNewItemName('')
        setNewQty('1')
      } else if (res.status === 429) {
        toast.error('Too many requests. Please slow down.')
      }
    } catch {}
  }

  const deleteList = async (listId: string) => {
    setLists(prev => prev.filter(l => l.id !== listId))
    try {
      await fetch(`/api/grocery/${listId}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrf() },
        credentials: 'same-origin',
      })
    } catch {}
  }

  const createList = async () => {
    const name = newListName.trim() || 'My Grocery List'
    try {
      const res = await fetch('/api/grocery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        credentials: 'same-origin',
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        const d = await res.json()
        setLists(prev => [d, ...prev])
        setNewListName('')
      } else if (res.status === 429) {
        toast.error('Too many requests.')
      }
    } catch {}
  }

  const setNewQty = (v: string) => setNewItemQty(v)

  return (
    <div className="mt-6">
      <div className="rounded-md border border-dashed border-border p-3">
        <p className="text-sm font-medium">Create a new list</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Input value={newListName} onChange={(e) => setNewListName(e.target.value)} placeholder="My Grocery List" className="flex-1 min-w-[180px]" />
          <Button onClick={createList}><Plus className="mr-2 h-4 w-4" /> Create</Button>
        </div>
      </div>

      {lists.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No grocery lists yet. Create one above.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {lists.map(list => (
            <div key={list.id} className="rounded-md border border-border">
              <div className="flex items-center justify-between border-b border-border p-3">
                <p className="font-medium text-sm">{list.name}</p>
                <Button variant="ghost" size="icon" aria-label="Delete list" onClick={() => deleteList(list.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <ul className="max-h-72 overflow-y-auto thin-scroll">
                {list.items.length === 0 && <li className="p-3 text-xs text-muted-foreground">No items yet.</li>}
                {list.items.map(it => (
                  <li key={it.id} className="flex items-center gap-2 border-b border-border/60 p-2 text-sm last:border-b-0">
                    <Checkbox checked={it.purchased} onCheckedChange={() => togglePurchased(list.id, it.id, it.purchased)} aria-label={`Mark ${it.name} as purchased`} />
                    <span className={it.purchased ? 'line-through text-muted-foreground flex-1' : 'flex-1'}>
                      {it.quantity} {it.unit} {it.name}
                    </span>
                    <Button variant="ghost" size="icon" aria-label="Remove" onClick={() => deleteItem(list.id, it.id)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-1 border-t border-border p-2">
                <Input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Add item"
                  className="h-8 flex-1"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(list.id) } }}
                />
                <Input
                  value={newItemQty}
                  onChange={(e) => setNewQty(e.target.value)}
                  type="number"
                  step="0.1"
                  className="h-8 w-16"
                />
                <Input
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  className="h-8 w-20"
                />
                <Button variant="outline" size="icon" aria-label="Add item" onClick={() => addItem(list.id)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {inventory.length > 0 && (
        <div className="mt-8">
          <p className="text-sm font-medium">Already in your inventory ({inventory.length})</p>
          <ul className="mt-2 grid gap-1 sm:grid-cols-3">
            {inventory.map(it => (
              <li key={it.id} className="rounded-md border border-border p-2 text-xs">
                <span className="font-medium">{it.name}</span>
                <span className="ml-2 text-muted-foreground">{it.quantity} {it.unit}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
