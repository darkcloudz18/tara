import { supabase } from '@/lib/supabase'

export interface Expense {
  id: string
  itinerary_id: string
  activity_id?: string
  title: string
  amount: number
  category: 'transport' | 'food' | 'accommodation' | 'activities' | 'shopping' | 'other'
  notes?: string
  date: string
  created_at: string
}

export interface BudgetSummary {
  totalEstimated: number
  totalActual: number
  byCategory: Record<string, { estimated: number; actual: number }>
  remaining: number
  percentUsed: number
}

export const budgetService = {
  /**
   * Get all expenses for an itinerary
   */
  async getExpenses(itineraryId: string): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('trip_expenses')
      .select('*')
      .eq('itinerary_id', itineraryId)
      .order('date', { ascending: true })

    if (error) {
      console.error('Error fetching expenses:', error)
      return []
    }

    return data || []
  },

  /**
   * Add a new expense
   */
  async addExpense(expense: Omit<Expense, 'id' | 'created_at'>): Promise<Expense | null> {
    const { data, error } = await supabase
      .from('trip_expenses')
      .insert(expense)
      .select()
      .single()

    if (error) {
      console.error('Error adding expense:', error)
      return null
    }

    // Update itinerary actual_spent
    await this.updateActualSpent(expense.itinerary_id)

    return data
  },

  /**
   * Update an expense
   */
  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null> {
    const { data, error } = await supabase
      .from('trip_expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating expense:', error)
      return null
    }

    if (data) {
      await this.updateActualSpent(data.itinerary_id)
    }

    return data
  },

  /**
   * Delete an expense
   */
  async deleteExpense(id: string, itineraryId: string): Promise<boolean> {
    const { error } = await supabase
      .from('trip_expenses')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting expense:', error)
      return false
    }

    await this.updateActualSpent(itineraryId)
    return true
  },

  /**
   * Update the actual_spent on the itinerary
   */
  async updateActualSpent(itineraryId: string): Promise<void> {
    const expenses = await this.getExpenses(itineraryId)
    const total = expenses.reduce((sum, e) => sum + e.amount, 0)

    await supabase
      .from('itineraries')
      .update({ actual_spent: total })
      .eq('id', itineraryId)
  },

  /**
   * Get budget summary for an itinerary
   */
  async getBudgetSummary(
    itineraryId: string,
    activities: { estimated_cost?: number; place_type?: string }[],
    totalBudget?: number
  ): Promise<BudgetSummary> {
    const expenses = await this.getExpenses(itineraryId)

    // Calculate estimated by category from activities
    const estimatedByCategory: Record<string, number> = {}
    let totalEstimated = 0

    for (const activity of activities) {
      const category = activity.place_type || 'other'
      const cost = activity.estimated_cost || 0
      estimatedByCategory[category] = (estimatedByCategory[category] || 0) + cost
      totalEstimated += cost
    }

    // Use total_budget if provided, otherwise use sum of activity costs
    const budgetTotal = totalBudget || totalEstimated

    // Calculate actual by category from expenses
    const actualByCategory: Record<string, number> = {}
    let totalActual = 0

    for (const expense of expenses) {
      actualByCategory[expense.category] = (actualByCategory[expense.category] || 0) + expense.amount
      totalActual += expense.amount
    }

    // Combine into byCategory
    const allCategories = new Set([
      ...Object.keys(estimatedByCategory),
      ...Object.keys(actualByCategory),
    ])

    const byCategory: Record<string, { estimated: number; actual: number }> = {}
    for (const cat of allCategories) {
      byCategory[cat] = {
        estimated: estimatedByCategory[cat] || 0,
        actual: actualByCategory[cat] || 0,
      }
    }

    return {
      totalEstimated: budgetTotal,
      totalActual,
      byCategory,
      remaining: budgetTotal - totalActual,
      percentUsed: budgetTotal > 0 ? (totalActual / budgetTotal) * 100 : 0,
    }
  },
}
