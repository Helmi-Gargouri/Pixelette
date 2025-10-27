# scripts/fix_0015_schema.py
import sqlite3
con = sqlite3.connect('db.sqlite3')
cur = con.cursor()
stmts = [
    "ALTER TABLE Pixelette_interaction ADD COLUMN filtered_content TEXT DEFAULT ''",
    "ALTER TABLE Pixelette_interaction ADD COLUMN moderation_details TEXT DEFAULT '{}'",
    "ALTER TABLE Pixelette_interaction ADD COLUMN moderation_reasons TEXT DEFAULT '[]'",
    "ALTER TABLE Pixelette_interaction ADD COLUMN moderation_score REAL DEFAULT 0.0",
    "ALTER TABLE Pixelette_interaction ADD COLUMN moderation_status varchar(20) DEFAULT 'pending'",
    "ALTER TABLE Pixelette_interaction ADD COLUMN reviewed_at DATETIME",
    "ALTER TABLE Pixelette_interaction ADD COLUMN reviewed_by_id INTEGER"
]
for s in stmts:
    try:
        cur.execute(s)
        print("OK:", s)
    except Exception as e:
        print("SKIP/ERR:", s, e)
con.commit()
con.close()
