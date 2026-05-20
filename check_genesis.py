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
    if err: print('[ERR]', err[-300:])

# Ver variables relacionadas con Genesis y Third Party
run('grep -E "GENESIS|THIRD_PARTY|SOCKET" /opt/bet-sniper/.env')

# Ver logs del backend relacionados con genesis
run('cd /opt/bet-sniper && docker compose logs --tail=50 backend 2>&1 | grep -iE "genesis|socket|third|signal|warn|error"')

client.close()
