from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..database import get_db
from ..services.order_processor import create_order as create_order_service
from ..services.order_processor import cancel_order as cancel_order_service

router = APIRouter(prefix="/api/v1/orders", tags=["orders"])

VALID_TRANSITIONS = {
    "pending": {"processing", "cancelled"},
    "processing": {"shipped", "cancelled"},
    "shipped": {"delivered"},
    "delivered": set(),
    "cancelled": set(),
}


def _serialize_order(order: models.Order) -> dict:
    return {
        "id": order.id,
        "order_number": order.order_number,
        "customer_id": order.customer_id,
        "customer_name": order.customer.full_name if order.customer else None,
        "order_date": order.order_date,
        "status": order.status,
        "total_amount": float(order.total_amount),
        "shipping_address": order.shipping_address,
        "payment_status": order.payment_status,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product.name if item.product else None,
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
                "total_price": float(item.total_price),
            }
            for item in order.items
        ],
    }


@router.post("", response_model=schemas.OrderOut, status_code=201)
def create_order(order_in: schemas.OrderCreate, db: Session = Depends(get_db)):
    try:
        order = create_order_service(db, order_in)
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return _serialize_order(order)


@router.get("", response_model=schemas.OrderList)
def list_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    customer_id: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Order).options(
        joinedload(models.Order.customer), joinedload(models.Order.items).joinedload(models.OrderItem.product)
    )
    if customer_id:
        query = query.filter(models.Order.customer_id == customer_id)
    if status:
        query = query.filter(models.Order.status == status)
    if search:
        query = query.join(models.Customer).filter(
            (models.Order.order_number.ilike(f"%{search}%"))
            | (models.Customer.full_name.ilike(f"%{search}%"))
        )

    total = query.count()
    orders = query.order_by(models.Order.order_date.desc()).offset((page - 1) * limit).limit(limit).all()
    return {"items": [_serialize_order(o) for o in orders], "total": total, "page": page, "limit": limit}


@router.get("/{order_id}", response_model=schemas.OrderOut)
def get_order(order_id: str, db: Session = Depends(get_db)):
    order = (
        db.query(models.Order)
        .options(joinedload(models.Order.customer), joinedload(models.Order.items).joinedload(models.OrderItem.product))
        .filter(models.Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return _serialize_order(order)


@router.patch("/{order_id}/status", response_model=schemas.OrderOut)
def update_order_status(order_id: str, status_in: schemas.OrderStatusUpdate, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    allowed = VALID_TRANSITIONS.get(order.status, set())
    if status_in.status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition order from '{order.status}' to '{status_in.status}'",
        )

    order.status = status_in.status
    order.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(order)
    return _serialize_order(order)


@router.delete("/{order_id}", status_code=200, response_model=schemas.OrderOut)
def cancel_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    try:
        order = cancel_order_service(db, order)
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return _serialize_order(order)
