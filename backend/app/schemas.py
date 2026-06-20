from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ---------- Products ----------

class ProductBase(BaseModel):
    name: str
    sku: str
    description: Optional[str] = None
    price: float = Field(ge=0)
    quantity: int = Field(ge=0, default=0)
    reorder_level: int = Field(default=5, ge=0)
    category: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(default=None, ge=0)
    quantity: Optional[int] = Field(default=None, ge=0)
    reorder_level: Optional[int] = Field(default=None, ge=0)
    category: Optional[str] = None


class ProductOut(ProductBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ProductList(BaseModel):
    items: List[ProductOut]
    total: int
    page: int
    limit: int


# ---------- Customers ----------

class CustomerBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class CustomerOut(CustomerBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    is_active: bool
    created_at: datetime


class CustomerList(BaseModel):
    items: List[CustomerOut]
    total: int
    page: int
    limit: int


# ---------- Orders ----------

class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(gt=0)


class OrderCreate(BaseModel):
    customer_id: str
    items: List[OrderItemCreate]
    shipping_address: Optional[str] = None


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    product_id: str
    product_name: Optional[str] = None
    quantity: int
    unit_price: float
    total_price: float


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    order_number: str
    customer_id: str
    customer_name: Optional[str] = None
    order_date: datetime
    status: str
    total_amount: float
    shipping_address: Optional[str] = None
    payment_status: str
    items: List[OrderItemOut] = []


class OrderList(BaseModel):
    items: List[OrderOut]
    total: int
    page: int
    limit: int


class OrderStatusUpdate(BaseModel):
    status: str


# ---------- Dashboard ----------

class DashboardStats(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    total_revenue: float
    low_stock_count: int


class InventoryTransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    product_id: str
    change_type: str
    quantity_change: int
    old_quantity: int
    new_quantity: int
    reference_id: Optional[str] = None
    created_at: datetime
