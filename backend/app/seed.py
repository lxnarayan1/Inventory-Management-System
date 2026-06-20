"""Seed the database with demo data matching the UI mockup.

Run with: python -m app.seed
"""
from datetime import datetime

from .database import SessionLocal, engine, Base
from . import models

Base.metadata.create_all(bind=engine)


def seed():
    db = SessionLocal()
    try:
        if db.query(models.Product).count() > 0:
            print("Database already has data, skipping seed.")
            return

        products = [
            models.Product(name="Wireless Mouse", sku="WM-001", price=29.99, quantity=120, reorder_level=20, category="Electronics"),
            models.Product(name="Mechanical Keyboard", sku="MK-002", price=79.99, quantity=8, reorder_level=10, category="Electronics"),
            models.Product(name="USB-C Hub", sku="UH-003", price=39.99, quantity=45, reorder_level=15, category="Electronics"),
            models.Product(name="Laptop Stand", sku="LS-004", price=24.99, quantity=3, reorder_level=10, category="Accessories"),
        ]
        db.add_all(products)
        db.flush()

        customers = [
            models.Customer(full_name="Ankit Sharma", email="ankit56@example.com"),
            models.Customer(full_name="Jatin Kumar", email="jatinkumar123@example.com"),
            models.Customer(full_name="Priya Kapoor", email="priya.kapoor@example.com"),
            models.Customer(full_name="Chetna Kumari", email="chetna123@example.com"),
        ]
        db.add_all(customers)
        db.flush()

        def make_order(number, customer, status, items, date):
            total = sum(i["unit_price"] * i["quantity"] for i in items)
            order = models.Order(
                order_number=number,
                customer_id=customer.id,
                status=status,
                total_amount=round(total, 2),
                order_date=date,
                payment_status="paid" if status in ("completed", "processing") else "unpaid",
            )
            db.add(order)
            db.flush()
            for i in items:
                db.add(models.OrderItem(
                    order_id=order.id,
                    product_id=i["product"].id,
                    quantity=i["quantity"],
                    unit_price=i["unit_price"],
                    total_price=round(i["unit_price"] * i["quantity"], 2),
                ))
            return order

        make_order("ORD-2026-0001", customers[0], "completed",
                    [{"product": products[0], "quantity": 1, "unit_price": 29.99},
                     {"product": products[1], "quantity": 1, "unit_price": 79.99},
                     {"product": products[3], "quantity": 2, "unit_price": 24.99}],
                    datetime(2026, 6, 14))

        make_order("ORD-2026-0002", customers[1], "processing",
                    [{"product": products[1], "quantity": 1, "unit_price": 79.99}],
                    datetime(2026, 6, 16))

        make_order("ORD-2026-0003", customers[2], "pending",
                    [{"product": products[0], "quantity": 2, "unit_price": 29.99},
                     {"product": products[2], "quantity": 2, "unit_price": 39.99}],
                    datetime(2026, 6, 18))

        make_order("ORD-2026-0004", customers[3], "cancelled",
                    [{"product": products[0], "quantity": 1, "unit_price": 29.99}],
                    datetime(2026, 6, 17))

        db.commit()
        print("Seed data created.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
