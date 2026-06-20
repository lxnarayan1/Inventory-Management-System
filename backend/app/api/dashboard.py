from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=schemas.DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    total_products = db.query(func.count(models.Product.id)).filter(models.Product.is_active == True).scalar() or 0  # noqa: E712
    total_customers = db.query(func.count(models.Customer.id)).filter(models.Customer.is_active == True).scalar() or 0  # noqa: E712
    total_orders = db.query(func.count(models.Order.id)).scalar() or 0
    total_revenue = (
        db.query(func.coalesce(func.sum(models.Order.total_amount), 0))
        .filter(models.Order.status != "cancelled")
        .scalar()
        or 0
    )
    low_stock_count = (
        db.query(func.count(models.Product.id))
        .filter(models.Product.is_active == True, models.Product.quantity < models.Product.reorder_level)  # noqa: E712
        .scalar()
        or 0
    )
    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "total_revenue": float(total_revenue),
        "low_stock_count": low_stock_count,
    }


@router.get("/recent-orders")
def recent_orders(db: Session = Depends(get_db)):
    orders = (
        db.query(models.Order)
        .options(joinedload(models.Order.customer))
        .order_by(models.Order.order_date.desc())
        .limit(5)
        .all()
    )
    return [
        {
            "id": o.id,
            "order_number": o.order_number,
            "customer_name": o.customer.full_name if o.customer else None,
            "order_date": o.order_date,
            "status": o.status,
            "total_amount": float(o.total_amount),
        }
        for o in orders
    ]


@router.get("/low-stock", response_model=list[schemas.ProductOut])
def low_stock(db: Session = Depends(get_db)):
    return (
        db.query(models.Product)
        .filter(models.Product.is_active == True, models.Product.quantity < models.Product.reorder_level)  # noqa: E712
        .order_by(models.Product.quantity.asc())
        .all()
    )
