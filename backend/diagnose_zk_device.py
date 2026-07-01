#!/usr/bin/env python3
"""
ZKTeco device connectivity diagnostic.

Run inside the backend container (same network path as auto-sync):
  python diagnose_zk_device.py

Or from the host with env vars set:
  ZK_DEVICE_IP=192.168.100.5 python backend/diagnose_zk_device.py
"""
from __future__ import annotations

import socket
import sys

from config import Config
from zk import ZK
from zk.exception import ZKError, ZKErrorConnection


def tcp_probe(host: str, port: int, timeout: float = 5.0) -> tuple[bool, str]:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    try:
        sock.connect((host, port))
        return True, 'TCP port is open'
    except OSError as exc:
        return False, str(exc)
    finally:
        sock.close()


def pyzk_probe(host: str, port: int, *, force_udp: bool, password: int, timeout: int) -> tuple[bool, str]:
    label = 'UDP' if force_udp else 'TCP'
    zk = ZK(host, port=port, timeout=timeout, password=password, force_udp=force_udp, ommit_ping=True)
    conn = None
    try:
        conn = zk.connect()
        info = {
            'serial': getattr(conn, 'get_serialnumber', lambda: '?')(),
            'users': len(conn.get_users() or []),
            'logs': len(conn.get_attendance() or []),
        }
        return True, f'{label} OK — serial={info["serial"]}, users={info["users"]}, logs={info["logs"]}'
    except ZKErrorConnection as exc:
        return False, f'{label} connection error: {exc}'
    except ZKError as exc:
        return False, f'{label} ZK error: {exc}'
    except Exception as exc:
        return False, f'{label} unexpected: {exc}'
    finally:
        if conn:
            try:
                conn.enable_device()
            except Exception:
                pass
            try:
                conn.disconnect()
            except Exception:
                pass


def main() -> int:
    host = Config.ZK_DEVICE_IP
    port = Config.ZK_DEVICE_PORT
    timeout = Config.ZK_DEVICE_TIMEOUT
    password = Config.ZK_DEVICE_PASSWORD

    print('=' * 72)
    print('ZKTeco device diagnostic')
    print('=' * 72)
    print(f'  Target:     {host}:{port}')
    print(f'  Timeout:    {timeout}s')
    print(f'  Comm key:   {password} (0 = no password)')
    print()

    ok, msg = tcp_probe(host, port, timeout=float(timeout))
    print(f'[1] TCP socket {host}:{port} ... {"OK" if ok else "FAIL"}')
    print(f'    {msg}')
    if not ok:
        print()
        print('Ping from your PC is NOT enough. The backend must reach TCP port 4370.')
        print('If this fails inside the container but works on the server host, use')
        print('network_mode: host for the backend service in Portainer.')
        return 1

    for force_udp in (False, True):
        label = 'UDP' if force_udp else 'TCP'
        print(f'[2] pyzk {label} handshake ...')
        ok, msg = pyzk_probe(host, port, force_udp=force_udp, password=password, timeout=timeout)
        print(f'    {"OK" if ok else "FAIL"} — {msg}')
        if ok:
            print()
            print('Device is reachable with the same settings the sync service uses.')
            return 0

    print()
    print('TCP port is open but pyzk handshake failed. Check:')
    print('  - Close ZKTime / BioTime / any other software connected to the device')
    print('  - Device menu → Comm → set/check Communication Password (ZK_DEVICE_PASSWORD)')
    print('  - Device IP still 192.168.100.5 (DHCP may have changed it)')
    print('  - Only one client can connect at a time — wait 30s and retry')
    return 2


if __name__ == '__main__':
    sys.exit(main())
