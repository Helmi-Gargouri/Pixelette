import sqlite3
DB = 'db.sqlite3'
con = sqlite3.connect(DB)
cur = con.cursor()
cur.execute("PRAGMA table_info('Pixelette_interaction')")
cols = [c[1] for c in cur.fetchall()]
if 'reviewed_by_id' in cols:
    print('reviewed_by_id already exists')
else:
    print('Adding reviewed_by_id INTEGER column')
    cur.execute('ALTER TABLE Pixelette_interaction ADD COLUMN reviewed_by_id INTEGER')
    con.commit()
    print('added reviewed_by_id')
cur.execute("PRAGMA table_info('Pixelette_interaction')")
for c in cur.fetchall():
    print(c)
con.close()
