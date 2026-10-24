// This script is executed ONLY inside GitHub Actions with the protected APP_PIN secret.
// Never add the generated apps-script/PrivatePin.gs to the public repository.
import {createHmac, randomBytes} from 'node:crypto';
import {writeFileSync} from 'node:fs';
const pin = process.env.APP_PIN || '';
if (!/^\d{6,12}$/.test(pin)) {
  throw new Error('APP_PIN GitHub Actions secret must contain 6 to 12 digits.');
}
const pepper = randomBytes(32).toString('hex');
const digest = createHmac('sha256', pepper).update(pin, 'utf8').digest('hex');
const content = [
  '/** Generated securely during GitHub deployment. NEVER COMMIT THIS FILE. */',
  `var PRIVATE_PIN_PEPPER = '${pepper}';`,
  `var PRIVATE_PIN_DIGEST = '${digest}';`,
  ''
].join('\n');
writeFileSync('apps-script/PrivatePin.gs', content, {mode:0o600,flag:'w'});
