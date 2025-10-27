import requests

s = requests.Session()
BASE='http://127.0.0.1:8000'
login_url = BASE + '/api/utilisateurs/login/'
stat_compute = BASE + '/api/saved-stats/5/compute/'
print('login...')
resp = s.post(login_url, json={'email':'taha.bellotef@esprit.tn','password':'Taha123@'})
print('login', resp.status_code, resp.text)
print('whoami', s.get(BASE + '/api/whoami/').status_code, s.get(BASE + '/api/whoami/').text)
print('compute', s.get(stat_compute).status_code, s.get(stat_compute).text)
