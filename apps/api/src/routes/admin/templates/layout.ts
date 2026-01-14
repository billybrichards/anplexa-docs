/**
 * HTML Layout Template
 */

import { darkThemeStyles, footerStyles } from './styles.js';

export interface LayoutOptions {
  title: string;
  content: string;
  showNav?: boolean;
}

export function layout(options: LayoutOptions): string {
  const { title, content, showNav = true } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Anplexa Admin</title>
  <style>${darkThemeStyles}${footerStyles}</style>
</head>
<body>
  <div class="container">
    ${showNav ? `
    <nav class="nav">
      <a href="/admin/dashboard">Dashboard</a>
      <a href="/admin/dashboard/usage">Usage Analytics</a>
      <a href="/admin/users">Users</a>
      <a href="/admin/api-keys">API Keys</a>
      <a href="/admin/funnel-keys">Funnel Keys</a>
      <a href="/admin/system-prompts">System Prompts</a>
      <a href="/admin/api-reference">API Reference</a>
      <a href="/admin/logout">Logout</a>
    </nav>
    ` : ''}
    ${content}
    ${showNav ? `
    <footer class="footer-nav">
      <div class="links">
        <a href="/docs">API Docs</a>
        <a href="/">Landing Page</a>
        <a href="/api/health">Health Check</a>
      </div>
      <div class="copyright">Anplexa Admin &copy; ${new Date().getFullYear()}</div>
    </footer>
    ` : ''}
  </div>
  <script>
    (function() {
      // Handle forms with data-confirm attribute
      document.addEventListener('submit', function(e) {
        var form = e.target;
        if (form.dataset && form.dataset.confirm) {
          if (!confirm(form.dataset.confirm)) {
            e.preventDefault();
          }
        }
      });
      // Handle copy to clipboard button
      var copyBtn = document.getElementById('copyKeyBtn');
      if (copyBtn) {
        copyBtn.addEventListener('click', function() {
          var keyDisplay = document.getElementById('newKeyDisplay');
          if (keyDisplay) {
            navigator.clipboard.writeText(keyDisplay.textContent);
            copyBtn.textContent = 'Copied!';
          }
        });
      }
    })();
  </script>
</body>
</html>`;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
