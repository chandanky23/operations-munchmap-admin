export enum ShopStatus {
  COMING_SOON = 'COMING_SOON',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  CLOSED_FOREVER = 'CLOSED_FOREVER',
}

export enum Verification {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED',
  FRAUD = 'FRAUD',
}

export enum WeekDays {
  MONDAY = 'Monday',
  TUESDAY = 'Tuesday',
  WEDNESDAY = 'Wednesday',
  THURSDAY = 'Thursday',
  FRIDAY = 'Friday',
  SATURDAY = 'Saturday',
  SUNDAY = 'Sunday',
}

export type RestaurantServiceHour = {
  day: WeekDays
  start_at: string
  end_at: string
}

export type Shop = {
  id: string
  name: string
  branch?: string
  owner_id?: string
  email: string
  phone_number: string
  status: ShopStatus
  verification_status: Verification
  is_email_verified: boolean
  is_phone_number_verified: boolean
  has_dine_in: boolean
  has_pick_up: boolean
  has_table: boolean
  accept_card?: boolean
  cuisines: string[]
  avg_service_time_in_seconds?: number
  image_url?: string
  service_hour: RestaurantServiceHour[]
  address_id?: string
  shop_latitude?: number
  shop_longitude?: number
  platform_fee_percent: number
  cuisine_types?: string[]
  price_range?: string
  dietary_options?: string[]
  has_outdoor_seating?: boolean
  accepts_takeaway?: boolean
  delivery_radius_km?: number
  menu_ready?: boolean
  created_at: string
  updated_at: string
}

export interface GetShopsParams {
  page?: number
  page_size?: number
  verification_status?: Verification | Verification[]
  status?: ShopStatus | ShopStatus[]
  show_new_restaurant?: boolean
}

export interface ShopListResponse {
  success: boolean
  data: Shop[]
  pagination: {
    page: number
    page_size: number
    total_items: number
    total_pages: number
  }
}

export interface ShopDetailResponse {
  success: boolean
  data: Shop
}

export interface ApproveShopRequest {
  notes?: string
}

export interface RejectShopRequest {
  reason?: string
}

export interface UpdateVerificationStatusRequest {
  verification_status: Verification
  notes?: string
}

export interface ShopActionResponse {
  success: boolean
  message: string
  data: Shop
}
