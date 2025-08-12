#!/usr/bin/env node

/**
 * Development HTTPS Server
 * Runs the Next.js app with HTTPS for voice input functionality
 */

const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Generate self-signed certificate for development
const generateCertificate = () => {
  const forge = require('node-forge');
  
  // Generate a keypair
  const keys = forge.pki.rsa.generateKeyPair(2048);
  
  // Create a certificate
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
  
  const attrs = [{
    name: 'commonName',
    value: 'localhost'
  }, {
    name: 'countryName',
    value: 'US'
  }, {
    shortName: 'ST',
    value: 'Virginia'
  }, {
    name: 'localityName',
    value: 'Blacksburg'
  }, {
    name: 'organizationName',
    value: 'Test'
  }, {
    shortName: 'OU',
    value: 'Test'
  }];
  
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.setExtensions([{
    name: 'basicConstraints',
    cA: true
  }, {
    name: 'keyUsage',
    keyCertSign: true,
    digitalSignature: true,
    nonRepudiation: true,
    keyEncipherment: true,
    dataEncipherment: true
  }, {
    name: 'extKeyUsage',
    serverAuth: true,
    clientAuth: true,
    codeSigning: true,
    emailProtection: true,
    timeStamping: true
  }, {
    name: 'nsCertType',
    client: true,
    server: true,
    email: true,
    objsign: true,
    sslCA: true,
    emailCA: true,
    objCA: true
  }, {
    name: 'subjectAltName',
    altNames: [{
      type: 2, // DNS
      value: 'localhost'
    }, {
      type: 7, // IP
      ip: '127.0.0.1'
    }]
  }, {
    name: 'subjectKeyIdentifier'
  }]);
  
  // Self-sign certificate
  cert.sign(keys.privateKey);
  
  // Convert to PEM format
  const certPem = forge.pki.certificateToPem(cert);
  const keyPem = forge.pki.privateKeyToPem(keys.privateKey);
  
  return { cert: certPem, key: keyPem };
};

// Check if certificates exist, if not generate them
const certDir = path.join(__dirname, '..', '.certs');
const certPath = path.join(certDir, 'localhost.crt');
const keyPath = path.join(certDir, 'localhost.key');

let httpsOptions;

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  // Use existing certificates
  httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
  console.log('📜 Using existing SSL certificates');
} else {
  // Generate new certificates
  console.log('🔐 Generating SSL certificates for development...');
  
  try {
    const { cert, key } = generateCertificate();
    
    // Create .certs directory if it doesn't exist
    if (!fs.existsSync(certDir)) {
      fs.mkdirSync(certDir, { recursive: true });
    }
    
    // Save certificates
    fs.writeFileSync(certPath, cert);
    fs.writeFileSync(keyPath, key);
    
    httpsOptions = { key, cert };
    console.log('✅ SSL certificates generated successfully');
  } catch (error) {
    console.error('❌ Failed to generate SSL certificates:', error.message);
    console.log('📝 Falling back to manual certificate instructions...');
    
    console.log(`
🔧 Manual Setup Instructions:

1. Install mkcert (one-time setup):
   - macOS: brew install mkcert
   - Windows: choco install mkcert
   - Linux: Follow instructions at https://github.com/FiloSottile/mkcert

2. Create certificates:
   mkdir -p .certs
   cd .certs
   mkcert -install
   mkcert localhost 127.0.0.1

3. Rename the generated files:
   mv localhost+1.pem localhost.crt
   mv localhost+1-key.pem localhost.key

4. Run the development server again: npm run dev:https
`);
    process.exit(1);
  }
}

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
  .once('error', (err) => {
    console.error(err);
    process.exit(1);
  })
  .listen(port, () => {
    console.log(`
🚀 Ready on https://${hostname}:${port}
🎤 Voice input is now available!

⚠️  You may see a security warning in your browser.
   Click "Advanced" → "Proceed to localhost (unsafe)" to continue.
   This is normal for development with self-signed certificates.
`);
  });
});