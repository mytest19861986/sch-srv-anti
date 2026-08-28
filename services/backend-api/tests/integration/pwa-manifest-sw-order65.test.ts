import { describe, it, expect } from 'bun:test';

describe('Order #65 Quality Gate: Driver & Parent PWA Engines', () => {
  it('should verify Driver PWA manifest, service worker, and web assets on port 3003', async () => {
    const resManifest = await fetch('http://localhost:3003/manifest.json');
    expect(resManifest.status).toBe(200);
    const manifest = await resManifest.json();
    expect(manifest.short_name).toBe('سرویس‌یار راننده');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);

    const resSw = await fetch('http://localhost:3003/sw.js');
    expect(resSw.status).toBe(200);
    const swText = await resSw.text();
    expect(swText).toContain('CACHE_NAME');

    const resHtml = await fetch('http://localhost:3003/');
    expect(resHtml.status).toBe(200);
    const html = await resHtml.text();
    expect(html).toContain('سرویس یار — پنل راننده');
    expect(html).toContain('pwa-install-banner');
  });

  it('should verify Parent PWA manifest, service worker, and web assets on port 3004', async () => {
    const resManifest = await fetch('http://localhost:3004/manifest.json');
    expect(resManifest.status).toBe(200);
    const manifest = await resManifest.json();
    expect(manifest.short_name).toBe('سرویس‌یار والدین');
    expect(manifest.display).toBe('standalone');

    const resSw = await fetch('http://localhost:3004/sw.js');
    expect(resSw.status).toBe(200);

    const resHtml = await fetch('http://localhost:3004/');
    expect(resHtml.status).toBe(200);
    const html = await resHtml.text();
    expect(html).toContain('سرویس یار — پنل اولیا');
  });
});
