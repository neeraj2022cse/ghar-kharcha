// Write CI-only credentials outside the committed source tree; never print tokens.
import {writeFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';
const creds = process.env.CLASPRC_JSON || '';
const scriptId = process.env.SCRIPT_ID || '';
if (!creds || !scriptId) throw new Error('Set CLASPRC_JSON and SCRIPT_ID GitHub Secrets.');
const json = JSON.parse(creds);
if (!json || typeof json !== 'object') throw Error('Invalid clasp credentials JSON.');
writeFileSync(join(homedir(), '.clasprc.json'), JSON.stringify(json), {mode:0o600});
writeFileSync('.clasp.json', JSON.stringify({scriptId,rootDir:'apps-script'}), {mode:0o600});
