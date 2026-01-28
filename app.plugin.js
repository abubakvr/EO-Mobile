const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withNetworkSecurityConfig(config) {
  // Ensure network security config file exists
  const networkSecurityConfigPath = path.join(
    config.modRequest?.platformProjectRoot || 'android',
    'app/src/main/res/xml/network_security_config.xml'
  );
  
  const networkSecurityConfigDir = path.dirname(networkSecurityConfigPath);
  if (!fs.existsSync(networkSecurityConfigDir)) {
    fs.mkdirSync(networkSecurityConfigDir, { recursive: true });
  }
  
  const networkSecurityConfig = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">tile.openstreetmap.org</domain>
        <domain includeSubdomains="true">unpkg.com</domain>
        <domain includeSubdomains="true">cdnjs.cloudflare.com</domain>
        <domain includeSubdomains="true">images.unsplash.com</domain>
    </domain-config>
</network-security-config>`;
  
  if (config.modRequest?.platformProjectRoot) {
    fs.writeFileSync(networkSecurityConfigPath, networkSecurityConfig);
  }

  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const { manifest } = androidManifest;

    if (!manifest.application) {
      manifest.application = [{}];
    }

    const application = manifest.application[0];
    if (!application.$) {
      application.$ = {};
    }
    application.$['android:usesCleartextTraffic'] = 'true';
    application.$['android:networkSecurityConfig'] = '@xml/network_security_config';

    return config;
  });
};
