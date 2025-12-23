from datetime import datetime, timedelta

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from apscheduler.schedulers.background import BackgroundScheduler

from .database import engine, Base, SessionLocal
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
    admin,  # ✅ importado
)
from .services.payouts_service import gerar_payouts_periodo


# cria tabelas
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)


# 🔐 BOOTSTRAP DO ADMIN
@app.on_event("startup")
def startup():
    db = SessionLocal()
    try:
        ensure_admin_exists(db)
        db.commit()
    finally:
        db.close()


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ajuste depois
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# routers
app.include_router(auth_routes.router, prefix="/auth", tags=["Auth"])
app.include_router(users_routes.router, prefix="/users", tags=["Users"])
app.include_router(products_routes.router, prefix="/products", tags=["Products"])
app.include_router(orders_routes.router, prefix="/orders", tags=["Orders"])
app.include_router(payouts_routes.router, prefix="/payouts", tags=["Payouts"])
app.include_router(uploads_routes.router, prefix="/uploads", tags=["Uploads"])
app.include_router(commissions_routes.router, prefix="/commissions", tags=["Commissions"])
app.include_router(payments_routes.router, prefix="/payments", tags=["Payments"])
app.include_router(admin.router)  # ✅ Admin endpoints


# servir media (imagens)
app.mount("/media", StaticFiles(directory=settings.MEDIA_DIR), name="media")


# -----------------------------
# scheduler de payouts (ATIVO)
# -----------------------------
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


@app.on_event("startup")
def start_scheduler():
    # roda a cada 24 horas (podes ajustar depois)
    scheduler.add_job(job_payouts, "interval", hours=24, id="job_payouts", replace_existing=True)
    scheduler.start()


@app.on_event("shutdown")
def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)