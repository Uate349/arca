import os
from sqlalchemy import create_engine, text

# Lê DATABASE_URL do ambiente (preferido) ou do teu .env (se carregares manualmente)
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise SystemExit("DATABASE_URL não está definido nas variáveis de ambiente.")

engine = create_engine(DATABASE_URL, future=True)

SQL_FIX_DESC = """
UPDATE products
SET description = convert_from(convert_to(description, 'LATIN1'), 'UTF8')
WHERE description LIKE '%Ã%';
"""

SQL_FIX_NAME = """
UPDATE products
SET name = convert_from(convert_to(name, 'LATIN1'), 'UTF8')
WHERE name LIKE '%Ã%';
"""

SQL_FIX_CATEGORY = """
UPDATE products
SET category = convert_from(convert_to(category, 'LATIN1'), 'UTF8')
WHERE category LIKE '%Ã%';
"""

def main():
    with engine.begin() as conn:
        r1 = conn.execute(text(SQL_FIX_DESC))
        r2 = conn.execute(text(SQL_FIX_NAME))
        r3 = conn.execute(text(SQL_FIX_CATEGORY))

    # rowcount pode ser -1 em alguns drivers; mesmo assim a query roda.
    print("OK: limpeza executada.")
    print("description rows:", r1.rowcount)
    print("name rows:", r2.rowcount)
    print("category rows:", r3.rowcount)

if __name__ == "__main__":
    main()