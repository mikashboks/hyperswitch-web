#!/usr/bin/env python3
"""Repository-owned, Linux-only hosted setup. No Git writes or provider calls."""
from pathlib import Path
import argparse
import hashlib
import json
import os
import platform
import shutil
import subprocess
import sys
import tarfile
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
CONFIG = ROOT / 'tools/hosted/profile.json'

def run(argv, cwd=ROOT, env=None):
    print('+', ' '.join(argv), flush=True)
    subprocess.run(argv, cwd=cwd, env=env, check=True)

def digest(paths):
    h = hashlib.sha256()
    for p in sorted(paths):
        h.update(str(p.relative_to(ROOT)).encode())
        h.update(p.read_bytes())
    return h.hexdigest()

def instructions():
    for name in ['AGENTS.md', 'CLAUDE.md', 'docs/HOSTED_DEVELOPMENT.md', 'tools/hosted/profile.json']:
        p = ROOT / name
        if not p.is_file():
            raise RuntimeError('Missing repository-owned setup instruction: ' + name)
    for name in ['AGENTS.md', 'CLAUDE.md']:
        if 'docs/HOSTED_DEVELOPMENT.md' not in (ROOT/name).read_text():
            raise RuntimeError(name + ' does not point to hosted setup instructions')
    print('Setup instructions: AGENTS.md, CLAUDE.md, docs/HOSTED_DEVELOPMENT.md', flush=True)

def node_environment(version, cache, env):
    if not version:
        return env
    try:
        actual = subprocess.check_output(['node', '--version'], env=env, text=True).strip()
    except (FileNotFoundError, subprocess.CalledProcessError):
        actual = ''
    if actual == 'v' + version:
        return env
    arch = {'x86_64': 'x64', 'aarch64': 'arm64', 'arm64': 'arm64'}.get(platform.machine())
    if not arch:
        raise RuntimeError('Unsupported Linux Node architecture: ' + platform.machine())
    name = f'node-v{version}-linux-{arch}'
    destination = cache / 'runtimes' / name
    binary = destination / 'bin/node'
    if not binary.exists():
        if destination.exists():
            raise RuntimeError('Existing Node cache is incomplete; preserve it for review: '+str(destination))
        parent = destination.parent
        parent.mkdir(parents=True, exist_ok=True)
        archive_name = name + '.tar.xz'
        base = f'https://nodejs.org/dist/v{version}/'
        with urllib.request.urlopen(base+'SHASUMS256.txt', timeout=60) as response:
            checksums = response.read().decode()
        matches = [line.split()[0] for line in checksums.splitlines() if line.split()[-1] == archive_name]
        if len(matches) != 1:
            raise RuntimeError('No published checksum for ' + archive_name)
        archive = parent / archive_name
        with urllib.request.urlopen(base+archive_name, timeout=120) as response, archive.open('wb') as output:
            shutil.copyfileobj(response, output)
        if hashlib.sha256(archive.read_bytes()).hexdigest() != matches[0]:
            raise RuntimeError('Node archive checksum failed; archive preserved for inspection')
        with tarfile.open(archive) as tar:
            if hasattr(tarfile,'data_filter'):
                tar.extractall(parent, filter='data')
            else:
                # Older preinstalled Python versions lack tarfile's data filter.
                # Official Node archives contain files, dirs and internal links.
                for member in tar.getmembers():
                    target=(parent/member.name).resolve()
                    if not target.is_relative_to(destination.resolve()):
                        raise RuntimeError('Node archive member escapes its runtime directory')
                    if not (member.isfile() or member.isdir() or member.issym() or member.islnk()):
                        raise RuntimeError('Unsupported Node archive member type')
                    if member.issym() or member.islnk():
                        link=((target.parent/member.linkname) if member.issym() else (parent/member.linkname)).resolve()
                        if not link.is_relative_to(destination.resolve()):
                            raise RuntimeError('Node archive link escapes its runtime directory')
                tar.extractall(parent)
    env['PATH'] = str(destination/'bin') + os.pathsep + env.get('PATH', '')
    actual = subprocess.check_output([str(binary), '--version'], env=env, text=True).strip()
    if actual != 'v' + version:
        raise RuntimeError('Selected Node runtime does not match profile')
    return env

def install(profile, cache, env):
    if profile.get('install_blockers'):
        raise RuntimeError('Setup requires review: ' + '; '.join(profile['install_blockers']))
    for tool in profile.get('required_tools', []):
        if not shutil.which(tool, path=env.get('PATH')):
            raise RuntimeError('Provision missing tool in hosted environment: ' + tool)
    for command in profile.get('prepare_commands', []):
        run(command,env=env)
    for unit in profile.get('node_units', []):
        folder = ROOT/unit['directory']
        manifest = folder/'package.json'
        lock = folder/unit['lockfile']
        if not manifest.is_file() or not lock.is_file():
            raise RuntimeError('Manifest/lockfile missing: ' + unit['directory'])
        stamp = cache / ('node-' + unit['directory'].replace('/', '_') + '.json')
        tracked_inputs = [manifest, CONFIG] + [folder/name for name in
            ['package-lock.json', 'npm-shrinkwrap.json', 'yarn.lock', 'pnpm-lock.yaml', '.yarnrc.yml']
            if (folder/name).is_file()]
        fingerprint = digest(tracked_inputs)
        current = json.loads(stamp.read_text()) if stamp.exists() else {}
        artifacts_ready=(folder/'node_modules').is_dir() or (unit['manager'].startswith('yarn@') and (folder/'.pnp.cjs').is_file())
        if current.get('fingerprint') == fingerprint and artifacts_ready:
            print('Frozen dependency cache is current:', unit['directory'], flush=True)
            continue
        if artifacts_ready:
            raise RuntimeError('Existing dependency files require refresh; preserve them and review before reinstalling: '+str(folder))
        if unit['manager'] == 'npm':
            command = ['npm','ci','--ignore-scripts','--no-audit','--no-fund']
        elif unit['manager'] == 'yarn-classic':
            command = ['npm','exec','--yes','--package=yarn@1.22.22','--','yarn','install','--frozen-lockfile','--ignore-scripts','--non-interactive']
        elif unit['manager'].startswith('pnpm@'):
            command = ['npm','exec','--yes','--package='+unit['manager'],'--','pnpm','install','--frozen-lockfile','--ignore-scripts']
        elif unit['manager'].startswith('yarn@'):
            command = ['corepack','yarn','install','--immutable','--mode=skip-build']
        else:
            raise RuntimeError('Unsupported reviewed package manager: '+unit['manager'])
        run(command, cwd=folder, env=env)
        if digest(tracked_inputs) != fingerprint:
            raise RuntimeError('Install changed a source manifest or lockfile; changes retained for review')
        stamp.write_text(json.dumps({'fingerprint':fingerprint,'node':profile.get('node_version')}))
    for command in profile.get('install_commands', []):
        if command[:2] == ['uv','venv'] and (ROOT/command[-1]).exists():
            python=ROOT/command[-1]/'bin/python'
            if not python.is_file():
                raise RuntimeError('Existing virtual environment is unusable; preserve and review it')
            actual=subprocess.check_output([str(python),'-c','import sys; print(".".join(map(str,sys.version_info[:2])))'],text=True).strip()
            expected=command[command.index('--python')+1]
            if actual != expected:
                raise RuntimeError('Existing virtual environment uses Python '+actual+'; expected '+expected+'. Preserve and review it.')
            print('Reusing existing Python '+actual+' virtual environment',flush=True)
            continue
        run(command, env=env)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('action', choices=['plan','verify-instructions','install','check','claude-start'])
    args = parser.parse_args()
    if args.action == 'claude-start' and os.environ.get('CLAUDE_CODE_REMOTE') != 'true':
        print('Hosted hook: local session; no installation performed.')
        return
    profile = json.loads(CONFIG.read_text())
    instructions()
    if args.action == 'verify-instructions':
        return
    if args.action == 'plan':
        print(json.dumps(profile, indent=2))
        return
    if platform.system() != 'Linux':
        raise RuntimeError('Hosted installation/checks require Linux. Use the separate laptop launch guide locally.')
    if os.environ.get('MKB_HOSTED') != 'true' and os.environ.get('CLAUDE_CODE_REMOTE') != 'true':
        raise RuntimeError('Set MKB_HOSTED=true in the hosted environment configuration')
    cache = Path(os.environ.get('MKB_HOSTED_CACHE', str(Path.home()/'.cache/mikashboks-hosted'))) / profile['repository'].replace('/','-')
    cache.mkdir(parents=True,exist_ok=True)
    env = dict(os.environ)
    tool_metadata=Path('/opt/mikashboks-hosted-tools/runtime.json')
    if tool_metadata.is_file():
        tools=json.loads(tool_metadata.read_text())
        env['PATH']=tools['uv_bin']+os.pathsep+env.get('PATH','')
        if profile.get('java_version'):
            env['JAVA_HOME']=tools['java_home']
            env['PATH']=str(Path(tools['java_home'])/'bin')+os.pathsep+env['PATH']
    env.update(profile.get('tool_environment',{}))
    env['CI'] = '1'
    env['EXPO_NO_TELEMETRY'] = '1'
    env['COREPACK_ENABLE_AUTO_PIN'] = '0'
    env = node_environment(profile.get('node_version'), cache, env)
    if args.action in ['install','claude-start']:
        install(profile, cache, env)
    if args.action == 'claude-start':
        print('Read docs/HOSTED_DEVELOPMENT.md before working. Background services must be started for this session; the environment cache does not preserve them.')
    if args.action == 'check':
        if not profile.get('check_commands'):
            raise RuntimeError('No automated smoke check approved for this repository; follow its hosted development guide')
        for step in profile['check_commands']:
            run(step['argv'],cwd=ROOT/step.get('directory','.'),env=env)

if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, subprocess.CalledProcessError, OSError) as error:
        print('Hosted setup failed:',str(error),file=sys.stderr)
        sys.exit(1)
