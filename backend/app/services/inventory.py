from sqlalchemy.orm import Session

from .. import models


def adjust_stock(
    db: Session,
    product: models.Product,
    quantity_change: int,
    change_type: str,
    reference_id: str | None = None,
):
    """Apply a stock change to a product and record an audit trail entry.

    Caller is responsible for the surrounding transaction / locking.
    Raises ValueError if the change would drive quantity negative.
    """
    old_quantity = product.quantity
    new_quantity = old_quantity + quantity_change

    if new_quantity < 0:
        raise ValueError(
            f"Insufficient stock for product '{product.name}': "
            f"have {old_quantity}, need {-quantity_change}"
        )

    product.quantity = new_quantity

    txn = models.InventoryTransaction(
        product_id=product.id,
        change_type=change_type,
        quantity_change=quantity_change,
        old_quantity=old_quantity,
        new_quantity=new_quantity,
        reference_id=reference_id,
    )
    db.add(txn)
    return txn
