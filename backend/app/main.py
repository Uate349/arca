from datetime import datetime, timedelta

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from apscheduler.schedulers.background import BackgroundScheduler

from .database import SessionLocal
from .config import settings
from .bootstrap_admin import ensure_admin_exists
from .routers import (
    auth_routes,
    users_routes,
    products_routes,
    orders_routes,
    payouts_routes,
    uploads_routes,
    commissions_routes,
    payments_routes,
    admin,
)
from .services.payouts_service import gerar_payouts_periodo


app = FastAPI(title=settings.PROJECT_NAME)

# =========================================================
# ✅ CORS (CORRIGIDO – LOCAL + RENDER)
# =========================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        # quando tiveres frontend em produção, adicionas aqui
        # "https://teu-frontend.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# Routers
# =========================================================
app.include_router(auth_routes.router, prefix="/auth", tags=["Auth"])
app.include_router(users_routes.router, prefix="/users", tags=["Users"])
app.include_router(products_routes.router, prefix="/products", tags=["Products"])
app.include_router(orders_routes.router, prefix="/orders", tags=["Orders"])

# payouts (prefix definido dentro do router)
app.include_router(payouts_routes.router)
if hasattr(payouts_routes, "admin_router"):
    app.include_router(payouts_routes.admin_router)

app.include_router(uploads_routes.router, prefix="/uploads", tags=["Uploads"])
app.include_router(commissions_routes.router, prefix="/commissions", tags=["Commissions"])
app.include_router(payments_routes.router, prefix="/payments", tags=["Payments"])

# admin geral
app.include_router(admin.router)

# =========================================================
# Media
# =========================================================
app.mount("/media", StaticFiles(directory=settings.MEDIA_DIR), name="media")

# =========================================================
# Scheduler
# =========================================================
scheduler = BackgroundScheduler()


def job_payouts():
    db = SessionLocal()
    try:
        period_end = datetime.utcnow()
        period_start = period_end - timedelta(days=30)
        gerar_payouts_periodo(db, period_start, period_end)
        db.commit()
    finally:
        db.close()


# =========================================================
# Startup / Shutdown
# =========================================================
@app.on_event("startup")
def startup():
    # --- bootstrap admin ---
    db = SessionLocal()
    try:
        ensure_admin_exists(db)
        db.commit()
    finally:
        db.close()

    # --- scheduler ---
    scheduler.add_job(
        job_payouts,
        "interval",
        hours=24,
        id="job_payouts",
        replace_existing=True,
    )
    scheduler.start()


@app.on_event("shutdown")
def shutdown():
    if scheduler.running:
        scheduler.shutdown(wait=False)