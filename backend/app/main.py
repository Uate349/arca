from datetime import datetime, timedelta

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from apscheduler.schedulers.background import BackgroundScheduler

from .database import engine, Base, SessionLocal
from .config import settings
from .routers import (
    auth_routes,
    users_routes,
    products_routes,
    orders_routes,
    payouts_routes,
    uploads_routes,
    commissions_routes,
    payments_routes,
)
from .services.payouts_service import gerar_payouts_periodo

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ajuste depois
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router, prefix="/auth", tags=["Auth"])
app.include_router(users_routes.router, prefix="/users", tags=["Users"])
app.include_router(products_routes.router, prefix="/products", tags=["Products"])
app.include_router(orders_routes.router, prefix="/orders", tags=["Orders"])
app.include_router(payouts_routes.router, prefix="/payouts", tags=["Payouts"])
app.include_router(uploads_routes.router, prefix="/uploads", tags=["Uploads"])
app.include_router(commissions_routes.router, prefix="/commissions", tags=["Commissions"])
app.include_router(payments_routes.router, prefix="/payments", tags=["Payments"])

# servir media (imagens)
app.mount("/media", StaticFiles(directory=settings.MEDIA_DIR), name="media")

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

scheduler.add_job(job_payouts, "interval", days=30, id="monthly_payouts", replace_existing=True)
scheduler.start()

@app.get("/")
def root():
    return {"message": "ARCA e-commerce backend online"}
