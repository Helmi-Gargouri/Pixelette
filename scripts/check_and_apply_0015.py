import sqlite3
import subprocess
import sys

DB = 'db.sqlite3'
print('Using DB:', DB)
con = sqlite3.connect(DB)
cur = con.cursor()
cur.execute("SELECT name FROM django_migrations WHERE app='Pixelette'")
migs = [r[0] for r in cur.fetchall()]
print('migrations for Pixelette before:', migs)
cur.execute("PRAGMA table_info('Pixelette_interaction')")
cols = cur.fetchall()
print('schema before:', cols)
if '0015_interaction_filtered_content_and_more' in migs:
    print('0015 is recorded in django_migrations -> deleting record so Django can re-apply it')
    cur.execute("DELETE FROM django_migrations WHERE app='Pixelette' AND name='0015_interaction_filtered_content_and_more'")
    con.commit()
    print('deleted rows:', cur.rowcount)
else:
    print('0015 not recorded; proceeding to migrate')
con.close()

print('\nRunning: python manage.py migrate Pixelette --noinput')
res = subprocess.run([sys.executable, 'manage.py', 'migrate', 'Pixelette', '--noinput'], capture_output=True, text=True)
print('migrate stdout:\n', res.stdout)
if res.stderr:
    print('migrate stderr:\n', res.stderr, file=sys.stderr)

con = sqlite3.connect(DB)
cur = con.cursor()
cur.execute("PRAGMA table_info('Pixelette_interaction')")
cols_after = cur.fetchall()
print('\nschema after:', cols_after)
cur.execute("SELECT name FROM django_migrations WHERE app='Pixelette'")
print('migrations for Pixelette after:', [r[0] for r in cur.fetchall()])
con.close()
