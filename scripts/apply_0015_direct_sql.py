import sqlite3
from datetime import datetime

DB = 'db.sqlite3'
con = sqlite3.connect(DB)
cur = con.cursor()

# helper to check column
cur.execute("PRAGMA table_info('Pixelette_interaction')")
existing = [c[1] for c in cur.fetchall()]
print('existing columns:', existing)

to_add = [
    ("filtered_content", "TEXT", "''"),
    ("moderation_details", "TEXT", "'{}'"),
    ("moderation_reasons", "TEXT", "''"),
    ("moderation_score", "REAL", "0.0"),
    ("moderation_status", "varchar(20)", "'pending'"),
    ("reviewed_at", "DATETIME", "NULL"),
    ("reviewed_by", "INTEGER", "NULL"),
]

added = []
for name, typ, default in to_add:
    if name in existing:
        print(f"Column {name} already exists")
        continue
    sql = f"ALTER TABLE Pixelette_interaction ADD COLUMN {name} {typ}"
    # For SQLite, specifying DEFAULT with quotes for text
    if default != 'NULL':
        sql += f" DEFAULT {default}"
    print('Executing:', sql)
    cur.execute(sql)
    added.append(name)

con.commit()
print('Added columns:', added)

# Ensure migration record exists
cur.execute("SELECT COUNT(*) FROM django_migrations WHERE app='Pixelette' AND name='0015_interaction_filtered_content_and_more'")
count = cur.fetchone()[0]
if count == 0:
    applied = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
    cur.execute("INSERT INTO django_migrations (app, name, applied) VALUES (?, ?, ?)", ('Pixelette', '0015_interaction_filtered_content_and_more', applied))
    con.commit()
    print('Inserted migration record for 0015')
else:
    print('Migration record for 0015 already present')

# Show schema after
cur.execute("PRAGMA table_info('Pixelette_interaction')")
print('\nFinal schema:')
for c in cur.fetchall():
    print(c)

# Show Pixelette migrations
cur.execute("SELECT name, applied FROM django_migrations WHERE app='Pixelette' ORDER BY id")
print('\nMigration rows for Pixelette:')
for r in cur.fetchall():
    print(r)

con.close()
