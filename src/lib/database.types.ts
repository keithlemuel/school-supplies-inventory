
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "categories": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"parent_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"parent_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"parent_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "categories_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                },"customers": {
                  Row: {
                    "address": string | null,"created_at": string,"id": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"created_at"?: string,"id"?: string,"name": string
                  }
                  Update: {
                    "address"?: string | null,"created_at"?: string,"id"?: string,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"delivery_receipt_lines": {
                  Row: {
                    "description": string,"id": string,"item_id": string | null,"position": number,"quantity": number,"receipt_id": string,"stock_quantity": number | null,"unit": string,"unit_price": number
                  }
                  ComputedFields: never
                  Insert: {
                    "description": string,"id"?: string,"item_id"?: string | null,"position": number,"quantity": number,"receipt_id": string,"stock_quantity"?: number | null,"unit": string,"unit_price": number
                  }
                  Update: {
                    "description"?: string,"id"?: string,"item_id"?: string | null,"position"?: number,"quantity"?: number,"receipt_id"?: string,"stock_quantity"?: number | null,"unit"?: string,"unit_price"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "delivery_receipt_lines_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "item_stock"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "delivery_receipt_lines_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "delivery_receipt_lines_receipt_id_fkey"
      columns: ["receipt_id"]
isOneToOne: false
      referencedRelation: "delivery_receipts"
      referencedColumns: ["id"]
    }
                  ]
                },"delivery_receipts": {
                  Row: {
                    "created_at": string,"created_by": string | null,"customer_address": string | null,"customer_id": string | null,"customer_name": string,"delivered_on": string,"id": string,"number": string,"total": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"customer_address"?: string | null,"customer_id"?: string | null,"customer_name": string,"delivered_on": string,"id"?: string,"number": string,"total"?: number
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"customer_address"?: string | null,"customer_id"?: string | null,"customer_name"?: string,"delivered_on"?: string,"id"?: string,"number"?: string,"total"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "delivery_receipts_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "delivery_receipts_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    }
                  ]
                },"item_units": {
                  Row: {
                    "contains": number,"created_at": string,"id": string,"item_id": string,"name": string,"selling_price": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "contains": number,"created_at"?: string,"id"?: string,"item_id": string,"name": string,"selling_price"?: number | null
                  }
                  Update: {
                    "contains"?: number,"created_at"?: string,"id"?: string,"item_id"?: string,"name"?: string,"selling_price"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "item_units_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "item_stock"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "item_units_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id"]
    }
                  ]
                },"items": {
                  Row: {
                    "category_id": string | null,"created_at": string,"id": string,"is_archived": boolean,"name": string,"notes": string | null,"reorder_level": number,"selling_price": number | null,"sku": string | null,"unit": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id"?: string | null,"created_at"?: string,"id"?: string,"is_archived"?: boolean,"name": string,"notes"?: string | null,"reorder_level"?: number,"selling_price"?: number | null,"sku"?: string | null,"unit"?: string,"updated_at"?: string
                  }
                  Update: {
                    "category_id"?: string | null,"created_at"?: string,"id"?: string,"is_archived"?: boolean,"name"?: string,"notes"?: string | null,"reorder_level"?: number,"selling_price"?: number | null,"sku"?: string | null,"unit"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "items_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"email": string,"full_name": string,"id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email": string,"full_name": string,"id": string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"full_name"?: string,"id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"settings": {
                  Row: {
                    "aging_after_days": number,"id": boolean,"old_after_days": number
                  }
                  ComputedFields: never
                  Insert: {
                    "aging_after_days"?: number,"id"?: boolean,"old_after_days"?: number
                  }
                  Update: {
                    "aging_after_days"?: number,"id"?: boolean,"old_after_days"?: number
                  }
                  Relationships: [
                    
                  ]
                },"stock_batches": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"item_id": string,"note": string | null,"quantity_received": number,"quantity_remaining": number,"received_on": string,"supplier": string | null,"unit_cost": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"item_id": string,"note"?: string | null,"quantity_received": number,"quantity_remaining": number,"received_on": string,"supplier"?: string | null,"unit_cost"?: number | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"item_id"?: string,"note"?: string | null,"quantity_received"?: number,"quantity_remaining"?: number,"received_on"?: string,"supplier"?: string | null,"unit_cost"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "stock_batches_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stock_batches_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "item_stock"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stock_batches_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id"]
    }
                  ]
                },"stock_movements": {
                  Row: {
                    "batch_id": string,"created_at": string,"created_by": string | null,"direction": string,"id": string,"item_id": string,"note": string | null,"occurred_on": string,"quantity": number,"reason": string
                  }
                  ComputedFields: never
                  Insert: {
                    "batch_id": string,"created_at"?: string,"created_by"?: string | null,"direction": string,"id"?: string,"item_id": string,"note"?: string | null,"occurred_on": string,"quantity": number,"reason": string
                  }
                  Update: {
                    "batch_id"?: string,"created_at"?: string,"created_by"?: string | null,"direction"?: string,"id"?: string,"item_id"?: string,"note"?: string | null,"occurred_on"?: string,"quantity"?: number,"reason"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "stock_movements_batch_id_fkey"
      columns: ["batch_id"]
isOneToOne: false
      referencedRelation: "batch_ages"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stock_movements_batch_id_fkey"
      columns: ["batch_id"]
isOneToOne: false
      referencedRelation: "stock_batches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stock_movements_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stock_movements_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "item_stock"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stock_movements_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "batch_ages": {
                  Row: {
                    "age_band": string | null,"age_days": number | null,"created_at": string,"id": string,"is_archived": boolean,"item_id": string,"item_name": string,"note": string | null,"quantity_received": number,"quantity_remaining": number,"received_on": string,"remaining_value": number | null,"supplier": string | null,"unit": string,"unit_cost": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "stock_batches_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "item_stock"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stock_batches_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id"]
    }
                  ]
                },"item_stock": {
                  Row: {
                    "aging_quantity": number | null,"category_id": string | null,"category_name": string | null,"id": string,"is_archived": boolean,"is_low": boolean | null,"name": string,"notes": string | null,"old_quantity": number | null,"oldest_age_days": number | null,"oldest_received_on": string | null,"on_hand": number | null,"open_batches": number | null,"parent_category_id": string | null,"parent_category_name": string | null,"reorder_level": number,"selling_price": number | null,"sku": string | null,"stock_value": number | null,"unit": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "categories_parent_id_fkey"
      columns: ["parent_category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "items_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "create_delivery_receipt":
{ Args: { "p_customer_address": string,"p_customer_name": string,"p_delivered_on": string,"p_lines": Json,"p_number": string }; Returns: string
                           },
"receive_stock":
{ Args: { "p_item_id": string,"p_note"?: string,"p_quantity": number,"p_reason"?: string,"p_received_on"?: string,"p_supplier"?: string,"p_unit_cost"?: number }; Returns: string
                           },
"remove_stock":
{ Args: { "p_batch_id"?: string,"p_item_id": string,"p_note"?: string,"p_occurred_on"?: string,"p_quantity": number,"p_reason": string }; Returns: undefined
                           },
"set_item_units":
{ Args: { "p_item_id": string,"p_units": Json }; Returns: undefined
                           },
"today":
{ Args: Record<PropertyKey, never>; Returns: string
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
