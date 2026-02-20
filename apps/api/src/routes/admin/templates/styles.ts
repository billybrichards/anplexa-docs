/**
 * CSS Styles for Admin UI
 */

export const darkThemeStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Courier New', monospace;
    background: #0a0a0a;
    color: #e0e0e0;
    min-height: 100vh;
    padding: 20px;
  }
  .container { max-width: 1200px; margin: 0 auto; }
  h1 { color: #ff6b35; margin-bottom: 20px; border-bottom: 1px solid #333; padding-bottom: 10px; }
  h2 { color: #ff6b35; margin: 20px 0 15px 0; }
  a { color: #ff6b35; text-decoration: none; }
  a:hover { text-decoration: underline; }
  .nav { margin-bottom: 30px; padding: 15px; background: #1a1a1a; border-radius: 5px; }
  .nav a { margin-right: 20px; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th, td { padding: 12px; text-align: left; border-bottom: 1px solid #333; }
  th { background: #1a1a1a; color: #ff6b35; }
  tr:hover { background: #1a1a1a; }
  .btn {
    display: inline-block;
    padding: 8px 16px;
    background: #ff6b35;
    color: #0a0a0a;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    text-decoration: none;
  }
  .btn:hover { background: #ff8c5a; text-decoration: none; }
  .btn-danger { background: #dc3545; color: white; }
  .btn-danger:hover { background: #c82333; }
  .btn-sm { padding: 4px 10px; font-size: 12px; }
  input, select {
    padding: 10px;
    background: #1a1a1a;
    border: 1px solid #333;
    color: #e0e0e0;
    border-radius: 4px;
    font-family: inherit;
    width: 100%;
    max-width: 300px;
  }
  input:focus, select:focus { outline: none; border-color: #ff6b35; }
  .form-group { margin-bottom: 15px; }
  label { display: block; margin-bottom: 5px; color: #888; }
  .card { background: #1a1a1a; padding: 20px; border-radius: 5px; margin: 20px 0; }
  .success { color: #28a745; padding: 10px; background: #1a1a1a; border-left: 3px solid #28a745; margin: 10px 0; }
  .error { color: #dc3545; padding: 10px; background: #1a1a1a; border-left: 3px solid #dc3545; margin: 10px 0; }
  .api-key-display {
    background: #2a2a2a;
    padding: 15px;
    border-radius: 5px;
    font-family: monospace;
    word-break: break-all;
    border: 2px solid #28a745;
  }
  .badge {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 3px;
    font-size: 12px;
  }
  .badge-success { background: #28a745; color: white; }
  .badge-warning { background: #ffc107; color: #000; }
  .badge-secondary { background: #6c757d; color: white; }
  .badge-api { background: #ff6b35; color: white; }
  .filter-tabs { margin-bottom: 20px; display: flex; gap: 10px; }
  .filter-tab {
    padding: 8px 16px;
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 4px;
    color: #e0e0e0;
    text-decoration: none;
  }
  .filter-tab:hover { border-color: #ff6b35; text-decoration: none; }
  .filter-tab.active { background: #ff6b35; color: #0a0a0a; border-color: #ff6b35; }
`;

export const footerStyles = `
  .footer-nav {
    margin-top: 60px;
    padding: 20px 0;
    border-top: 1px solid #333;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 15px;
    font-size: 13px;
  }
  .footer-nav .links a {
    color: #888;
    margin-right: 20px;
  }
  .footer-nav .links a:hover { color: #ff6b35; }
  .footer-nav .copyright { color: #555; }
`;
