from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/v1/products", tags=["products"])


@router.post("", response_model=schemas.ProductOut, status_code=201)
def create_product(product_in: schemas.ProductCreate, db: Session = Depends(get_db)):
    product = models.Product(**product_in.model_dump())
    db.add(product)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A product with this SKU already exists")
    db.refresh(product)
    return product


@router.get("", response_model=schemas.ProductList)
def list_products(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    low_stock: bool = False,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Product).filter(models.Product.is_active == True)  # noqa: E712
    if category:
        query = query.filter(models.Product.category == category)
    if low_stock:
        query = query.filter(models.Product.quantity < models.Product.reorder_level)
    if search:
        query = query.filter(models.Product.name.ilike(f"%{search}%"))

    total = query.count()
    items = query.order_by(models.Product.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return {"items": items, "total": total, "page": page, "limit": limit}


@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=schemas.ProductOut)
def update_product(product_id: str, product_in: schemas.ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for field, value in product_in.model_dump(exclude_unset=True).items():
        setattr(product, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A product with this SKU already exists")
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=204)
def delete_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    in_use = db.query(models.OrderItem).filter(models.OrderItem.product_id == product_id).first()
    if in_use:
        raise HTTPException(status_code=403, detail="Cannot delete a product referenced by existing orders")

    db.delete(product)
    db.commit()
    return None


@router.get("/{product_id}/history", response_model=list[schemas.InventoryTransactionOut])
def product_history(product_id: str, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return (
        db.query(models.InventoryTransaction)
        .filter(models.InventoryTransaction.product_id == product_id)
        .order_by(models.InventoryTransaction.created_at.desc())
        .all()
    )
