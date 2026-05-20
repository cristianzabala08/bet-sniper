import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('159.223.141.122', username='root', password='tyvbim-8Succy-sovvuh', timeout=15)

def run(cmd, timeout=30):
    print(f'--- {cmd} ---')
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out: print(out)
    if err: print('[ERR]', err[-200:])

# Leer .env actual
stdin, stdout, stderr = client.exec_command('cat /opt/bet-sniper/.env')
env = stdout.read().decode('utf-8', errors='replace')

# Reemplazar las variables vacías con los valores correctos
env = env.replace('GENESIS_SOCKET_URL=\n', 'GENESIS_SOCKET_URL=https://appserver.winxplay.io:8001\n')
env = env.replace('GENESIS_SOCKET_TOKEN=\n', 'GENESIS_SOCKET_TOKEN=EmpresaExterna123\n')

# Agregar THIRD_PARTY_API_KEY si no existe
if 'THIRD_PARTY_API_KEY' not in env:
    env = env.rstrip() + '\nTHIRD_PARTY_API_KEY=EmpresaExterna123\n'

sftp = client.open_sftp()
with sftp.open('/opt/bet-sniper/.env', 'w') as f:
    f.write(env)
sftp.close()

print('=== Variables actualizadas ===')
run('grep -E "GENESIS|THIRD_PARTY|SOCKET" /opt/bet-sniper/.env')

# Recrear backend para cargar las nuevas variables
run('cd /opt/bet-sniper && docker compose up -d --force-recreate backend 2>&1')

import time
time.sleep(12)

# Verificar que el backend arrancó y conectó al socket
run('cd /opt/bet-sniper && docker compose ps backend')
run('cd /opt/bet-sniper && docker compose logs --tail=20 backend 2>&1 | grep -iE "genesis|socket|connected|warn|error|started"')

client.close()
print('DONE')
