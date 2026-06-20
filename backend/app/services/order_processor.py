import random
import string
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import func

from .. import models, schemas
from .inventory import adjust_stock


def generate_order_number(db: Session) -> str:
    year = datetime.utcnow().year
    count = db.query(func.count(models.Order.id)).scalar() or 0
    return f"ORD-{year}-{count + 1:04d}"


def create_order(db: Session, order_in: schemas.OrderCreate) -> models.Order:
    customer = db.query(models.Customer).filter(models.Customer.id == order_in.customer_id).first()
    if not customer:
        raise ValueError("Customer not found")

    if not order_in.items:
        raise ValueError("Order must contain at least one item")

    order = models.Order(
        order_number=generate_order_number(db),
        customer_id=customer.id,
        status="pending",
        shipping_address=order_in.shipping_address,
        total_amount=0,
    )
    db.add(order)
    db.flush()  # get order.id

    total = 0.0
    for item in order_in.items:
        # SELECT ... FOR UPDATE style row locking to prevent overselling.
        product = (
            db.query(models.Product)
            .filter(models.Product.id == item.product_id)
            .with_for_update(read=False, nowait=False)
            .first()
        )
        if not product:
            raise ValueError(f"Product {item.product_id} not found")
        if product.quantity < item.quantity:
            raise ValueError(
                f"Insufficient stock for '{product.name}': "
                f"requested {item.quantity}, available {product.quantity}"
            )

        unit_price = float(product.price)
        line_total = round(unit_price * item.quantity, 2)
        total += line_total

        order_item = models.OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=item.quantity,
            unit_price=unit_price,
            total_price=line_total,
        )
        db.add(order_item)

        adjust_stock(
            db,
            product,
            quantity_change=-item.quantity,
            change_type="order_placed",
            reference_id=order.id,
        )

    order.total_amount = round(total, 2)
    db.commit()
    db.refresh(order)
    return order


def cancel_order(db: Session, order: models.Order) -> models.Order:
    if order.status in ("shipped", "delivered", "cancelled"):
        raise ValueError(f"Cannot cancel an order with status '{order.status}'")

    for item in order.items:
        product = (
            db.query(models.Product)
            .filter(models.Product.id == item.product_id)
            .with_for_update(read=False, nowait=False)
            .first()
        )
        if product:
            adjust_stock(
                db,
                product,
                quantity_change=item.quantity,
                change_type="order_cancelled",
                reference_id=order.id,
            )

    order.status = "cancelled"
    db.commit()
    db.refresh(order)
    return order
