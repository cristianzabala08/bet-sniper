import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('159.223.141.122', username='root', password='tyvbim-8Succy-sovvuh', timeout=15)

def run(cmd, timeout=30):
    print(f'--- {cmd[:80]} ---')
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    if out: print(out[-2000:])
    if err: print('[ERR]', err[-300:])

run('cd /opt/bet-sniper && docker compose logs --tail=30 backend 2>&1')
run('curl -sk https://betsniper.xyz -o /dev/null -w "%{http_code}"')

client.close()
