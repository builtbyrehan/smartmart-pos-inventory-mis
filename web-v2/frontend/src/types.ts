export type Role = 'Admin' | 'Manager' | 'Cashier' | 'Inventory Officer' | 'Purchase Officer' | 'Sales Executive'

export interface User { id: number; username: string; full_name: string; role: Role; is_active: boolean; created_at?: string }
export interface Category { id: number; name: string }
export interface Customer { id: number; name: string; phone: string; email?: string | null; address?: string | null }
export interface Supplier extends Customer { contact_person?: string | null }
export interface Product { id: number; name: string; category_id: number; category_name: string; supplier_id: number; supplier_name: string; barcode: string; purchase_price: string; selling_price: string; stock_quantity: number; reorder_level: number; is_active: boolean }
export interface SaleLine { product_id: number; product_name: string; quantity: number; selling_price: string; line_total: string }
export interface Sale { id: number; invoice_number: string; sale_date: string; customer_id: number; customer_name: string; user_id: number; cashier_name: string; total_amount: string; items: SaleLine[] }
export interface PurchaseLine { product_id: number; product_name: string; quantity: number; purchase_price: string; line_total: string }
export interface Purchase { id: number; invoice_number: string; purchase_date: string; supplier_id: number; supplier_name: string; total_amount: string; items: PurchaseLine[] }

