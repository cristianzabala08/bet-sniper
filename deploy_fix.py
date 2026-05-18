import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('159.223.141.122', username='root', password='tyvbim-8Succy-sovvuh', timeout=15)

def run(cmd, timeout=60):
    print(f'--- {cmd[:80]} ---')
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out: print(out[-1500:])
    if err: print('[ERR]', err[-300:])

# Leer .env actual y agregar RESEND_API_KEY placeholder
stdin, stdout, stderr = client.exec_command('cat /opt/bet-sniper/.env')
env = stdout.read().decode()

# Agregar las variables faltantes si no están
additions = []
if 'RESEND_API_KEY' not in env:
    additions.append('RESEND_API_KEY=re_placeholder_configure_later')
if 'FRONTEND_URL' not in env:
    additions.append('FRONTEND_URL=https://betsniper.xyz')
if 'SMTP_HOST' not in env:
    additions.append('SMTP_HOST=smtp.gmail.com')
    additions.append('SMTP_PORT=587')
    additions.append('SMTP_USER=admin@betsniper.xyz')
    additions.append('SMTP_PASS=placeholder')
    additions.append('SMTP_FROM=admin@betsniper.xyz')
if 'GENESIS_SOCKET_URL' not in env:
    additions.append('GENESIS_SOCKET_URL=')
    additions.append('GENESIS_SOCKET_TOKEN=')

if additions:
    env = env.rstrip() + '\n' + '\n'.join(additions) + '\n'
    sftp = client.open_sftp()
    with sftp.open('/opt/bet-sniper/.env', 'w') as f:
        f.write(env)
    sftp.close()
    print('Variables agregadas al .env')

# Reiniciar backend
run('cd /opt/bet-sniper && docker compose restart backend 2>&1')

import time
time.sleep(8)

run('cd /opt/bet-sniper && docker compose ps')
run('cd /opt/bet-sniper && docker compose logs --tail=15 backend 2>&1')

client.close()
print('DONE')
