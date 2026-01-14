/**
 * CRM Template Rendering Functions
 *
 * HTML rendering utilities for CRM pages
 * Provides consistent styling and layout across all CRM views
 */

const ANPLEXA_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: #121212;
    color: #E0E1DD;
    min-height: 100vh;
  }
  .container { max-width: 1400px; margin: 0 auto; padding: 24px; }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
    padding-bottom: 20px;
    border-bottom: 1px solid #333;
  }
  .logo { color: #7B2CBF; font-size: 24px; font-weight: 300; letter-spacing: 2px; }
  .nav { display: flex; gap: 16px; }
  .nav a {
    color: #9CA3AF;
    text-decoration: none;
    padding: 8px 16px;
    border-radius: 6px;
    transition: all 0.2s;
  }
  .nav a:hover, .nav a.active { color: #E0E1DD; background: #1a1a1a; }
  h1 { font-size: 24px; font-weight: 500; margin-bottom: 24px; }
  h2 { font-size: 18px; font-weight: 500; margin-bottom: 16px; color: #9CA3AF; }
  .card {
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
  }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
  .stat {
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 12px;
    padding: 20px;
    text-align: center;
  }
  .stat-value { font-size: 32px; font-weight: 600; color: #7B2CBF; }
  .stat-label { font-size: 14px; color: #9CA3AF; margin-top: 8px; }
  table { width: 100%; border-collapse: collapse; }
  th, td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid #333;
  }
  th {
    color: #9CA3AF;
    font-weight: 500;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  tr:hover { background: rgba(123, 44, 191, 0.05); }
  .badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
  }
  .badge-waitlist { background: rgba(123, 44, 191, 0.2); color: #7B2CBF; }
  .badge-direct { background: rgba(39, 174, 96, 0.2); color: #27ae60; }
  .badge-new { background: rgba(52, 152, 219, 0.2); color: #3498db; }
  .badge-invited { background: rgba(241, 196, 15, 0.2); color: #f1c40f; }
  .badge-converted { background: rgba(39, 174, 96, 0.2); color: #27ae60; }
  .badge-dormant { background: rgba(149, 165, 166, 0.2); color: #95a5a6; }
  .badge-pending { background: rgba(241, 196, 15, 0.2); color: #f1c40f; }
  .badge-sent { background: rgba(39, 174, 96, 0.2); color: #27ae60; }
  .badge-failed { background: rgba(231, 76, 60, 0.2); color: #e74c3c; }
  .btn {
    display: inline-block;
    background: #7B2CBF;
    color: #fff;
    text-decoration: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 500;
    border: none;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }
  .btn:hover { background: #6a24a8; }
  .btn-secondary {
    background: transparent;
    border: 1px solid #7B2CBF;
    color: #7B2CBF;
  }
  .btn-secondary:hover { background: rgba(123, 44, 191, 0.1); }
  .btn-sm { padding: 6px 12px; font-size: 12px; }
  .filters {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  .filter-select {
    background: #1a1a1a;
    border: 1px solid #333;
    color: #E0E1DD;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
  }
  .funnel-flow {
    display: flex;
    gap: 24px;
    padding: 24px 0;
    overflow-x: auto;
  }
  .funnel-step {
    min-width: 200px;
    text-align: center;
    position: relative;
  }
  .funnel-step::after {
    content: '→';
    position: absolute;
    right: -18px;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
  }
  .funnel-step:last-child::after { display: none; }
  .funnel-box {
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 8px;
    padding: 20px;
  }
  .funnel-box.waitlist { border-color: #7B2CBF; }
  .funnel-box.direct { border-color: #27ae60; }
  .funnel-count { font-size: 24px; font-weight: 600; color: #7B2CBF; }
  .funnel-label { font-size: 13px; color: #9CA3AF; margin-top: 4px; }
`;

export function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function wrapPage(title: string, content: string, activeTab: string = 'contacts'): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Anplexa CRM</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>${ANPLEXA_STYLES}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">anplexa <span style="color: #9CA3AF; font-size: 14px; margin-left: 8px;">CRM</span></div>
      <nav class="nav">
        <a href="/crm" class="${activeTab === 'contacts' ? 'active' : ''}">Contacts</a>
        <a href="/crm/emails" class="${activeTab === 'emails' ? 'active' : ''}">Email Queue</a>
        <a href="/crm/templates" class="${activeTab === 'templates' ? 'active' : ''}">Email Templates</a>
        <a href="/crm/funnel" class="${activeTab === 'funnel' ? 'active' : ''}">Funnel View</a>
        <a href="/admin/dashboard" style="border-left: 1px solid #333; margin-left: 8px; padding-left: 24px;">Admin Dashboard</a>
      </nav>
    </div>
    ${content}
  </div>
</body>
</html>
  `;
}

export function renderContactsPage(data: {
  contacts: any[];
  stats: any;
  filters: any;
}): string {
  const { contacts, stats, filters } = data;

  const usersHtml = contacts
    .map(
      (user: any) => `
      <tr>
        <td>${escapeHtml(user.email)}</td>
        <td>${escapeHtml(user.displayName)}</td>
        <td><span class="badge badge-${user.funnelType || 'direct'}">${user.funnelType || 'direct'}</span></td>
        <td><span class="badge badge-${user.stage || 'new'}">${user.stage || 'new'}</span></td>
        <td>${escapeHtml(user.persona) || '-'}</td>
        <td>${escapeHtml(user.entrySource) || '-'}</td>
        <td>${user.subscriptionStatus === 'subscribed' ? '✓' : '-'}</td>
        <td>${user.usedFreeMessages || 0}</td>
        <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="viewContact('${user.id}')">View</button>
        </td>
      </tr>
    `
    )
    .join('');

  const content = `
    <h1>CRM - Contact Management</h1>

    <div class="stats">
      <div class="stat">
        <div class="stat-value">${stats.total}</div>
        <div class="stat-label">Total Contacts</div>
      </div>
      <div class="stat">
        <div class="stat-value">${stats.waitlist}</div>
        <div class="stat-label">Waitlist</div>
      </div>
      <div class="stat">
        <div class="stat-value">${stats.direct}</div>
        <div class="stat-label">Direct Signups</div>
      </div>
      <div class="stat">
        <div class="stat-value">${stats.converted}</div>
        <div class="stat-label">Converted</div>
      </div>
    </div>

    <div class="filters">
      <select class="filter-select" id="funnelFilter" onchange="applyFilters()">
        <option value="">All Funnels</option>
        <option value="waitlist" ${filters.funnelFilter === 'waitlist' ? 'selected' : ''}>Waitlist</option>
        <option value="direct" ${filters.funnelFilter === 'direct' ? 'selected' : ''}>Direct</option>
      </select>
      <select class="filter-select" id="stageFilter" onchange="applyFilters()">
        <option value="">All Stages</option>
        <option value="new" ${filters.stageFilter === 'new' ? 'selected' : ''}>New</option>
        <option value="waitlist" ${filters.stageFilter === 'waitlist' ? 'selected' : ''}>Waitlist</option>
        <option value="invited" ${filters.stageFilter === 'invited' ? 'selected' : ''}>Invited</option>
        <option value="converted" ${filters.stageFilter === 'converted' ? 'selected' : ''}>Converted</option>
        <option value="dormant" ${filters.stageFilter === 'dormant' ? 'selected' : ''}>Dormant</option>
      </select>
      <select class="filter-select" id="personaFilter" onchange="applyFilters()">
        <option value="">All Personas</option>
        <option value="lonely" ${filters.personaFilter === 'lonely' ? 'selected' : ''}>Lonely</option>
        <option value="curious" ${filters.personaFilter === 'curious' ? 'selected' : ''}>Curious</option>
        <option value="privacy" ${filters.personaFilter === 'privacy' ? 'selected' : ''}>Privacy</option>
      </select>
    </div>

    <div class="card">
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Funnel</th>
            <th>Stage</th>
            <th>Persona</th>
            <th>Source</th>
            <th>Subscribed</th>
            <th>Free Msgs</th>
            <th>Joined</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${usersHtml || '<tr><td colspan="10" style="text-align: center; padding: 40px; color: #666;">No contacts found</td></tr>'}
        </tbody>
      </table>
    </div>

    <script>
      function applyFilters() {
        const funnel = document.getElementById('funnelFilter').value;
        const stage = document.getElementById('stageFilter').value;
        const persona = document.getElementById('personaFilter').value;
        const params = new URLSearchParams();
        if (funnel) params.set('funnel', funnel);
        if (stage) params.set('stage', stage);
        if (persona) params.set('persona', persona);
        window.location.href = '/crm?' + params.toString();
      }

      function viewContact(contactId) {
        window.location.href = '/crm/user/' + contactId;
      }
    </script>
  `;

  return wrapPage('Contacts', content, 'contacts');
}

export function renderContactDetailPage(data: {
  contact: any;
  emailHistory: any[];
  pendingEmails: any[];
}): string {
  const { contact, emailHistory, pendingEmails } = data;

  const emailLogsHtml = emailHistory
    .map(
      (log: any) => `
      <tr>
        <td>${log.emailTemplate}</td>
        <td>${escapeHtml(log.subject)}</td>
        <td>${log.sentAt ? new Date(log.sentAt).toLocaleString() : '-'}</td>
        <td>${log.openedAt ? '✓ ' + new Date(log.openedAt).toLocaleString() : '-'}</td>
        <td>${log.clickedAt ? '✓ ' + new Date(log.clickedAt).toLocaleString() : '-'}</td>
      </tr>
    `
    )
    .join('');

  const content = `
    <h1>Contact: ${escapeHtml(contact.email)}</h1>
    <a href="/crm" style="color: #7B2CBF; margin-bottom: 24px; display: inline-block;">← Back to Contacts</a>

    <div class="stats">
      <div class="stat">
        <div class="stat-value">${contact.funnelType || 'direct'}</div>
        <div class="stat-label">Funnel Type</div>
      </div>
      <div class="stat">
        <div class="stat-value">${contact.stage || 'new'}</div>
        <div class="stat-label">Stage</div>
      </div>
      <div class="stat">
        <div class="stat-value">${contact.persona || '-'}</div>
        <div class="stat-label">Persona</div>
      </div>
      <div class="stat">
        <div class="stat-value">${contact.usedFreeMessages || 0}</div>
        <div class="stat-label">Free Messages Used</div>
      </div>
    </div>

    <div class="card">
      <h2>Contact Details</h2>
      <table>
        <tr><td style="width: 200px; color: #9CA3AF;">Email</td><td>${escapeHtml(contact.email)}</td></tr>
        <tr><td style="color: #9CA3AF;">Display Name</td><td>${escapeHtml(contact.displayName)}</td></tr>
        <tr><td style="color: #9CA3AF;">Chat Name</td><td>${escapeHtml(contact.chatName) || '-'}</td></tr>
        <tr><td style="color: #9CA3AF;">Entry Source</td><td>${escapeHtml(contact.entrySource) || '-'}</td></tr>
        <tr><td style="color: #9CA3AF;">Subscription Status</td><td>${contact.subscriptionStatus || 'not_subscribed'}</td></tr>
        <tr><td style="color: #9CA3AF;">Joined</td><td>${contact.createdAt ? new Date(contact.createdAt).toLocaleString() : '-'}</td></tr>
      </table>
    </div>

    ${
      pendingEmails.length > 0
        ? `
      <div class="card">
        <h2>Pending Emails (${pendingEmails.length})</h2>
        <table>
          <tr><th>Template</th><th>Scheduled</th><th></th></tr>
          ${pendingEmails
            .map(
              (e: any) => `
            <tr>
              <td>${e.emailTemplate}</td>
              <td>${new Date(e.scheduledAt).toLocaleString()}</td>
              <td><button class="btn btn-sm btn-secondary" onclick="cancelEmail('${e.id}')">Cancel</button></td>
            </tr>
          `
            )
            .join('')}
        </table>
      </div>
    `
        : ''
    }

    <div class="card">
      <h2>Email History</h2>
      <table>
        <thead>
          <tr><th>Template</th><th>Subject</th><th>Sent</th><th>Opened</th><th>Clicked</th></tr>
        </thead>
        <tbody>
          ${emailLogsHtml || '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #666;">No emails sent yet</td></tr>'}
        </tbody>
      </table>
    </div>

    <div class="card">
      <h2>Actions</h2>
      <button class="btn" onclick="inviteUser('${contact.id}')">Send Invite (W4)</button>
      <button class="btn btn-secondary" onclick="cancelAllEmails('${contact.id}')">Cancel All Pending Emails</button>
      <button class="btn btn-secondary" onclick="updateStage('${contact.id}', 'dormant')">Mark as Dormant</button>
    </div>

    <script>
      async function cancelEmail(id) {
        if (!confirm('Cancel this email?')) return;
        await fetch('/crm/api/cancel-email/' + id, { method: 'POST', credentials: 'include' });
        location.reload();
      }

      async function cancelAllEmails(contactId) {
        if (!confirm('Cancel all pending emails for this contact?')) return;
        await fetch('/crm/api/cancel-all-emails/' + contactId, { method: 'POST', credentials: 'include' });
        location.reload();
      }

      async function inviteUser(contactId) {
        if (!confirm('Send invite email (W4) to this contact?')) return;
        await fetch('/crm/api/invite/' + contactId, { method: 'POST', credentials: 'include' });
        location.reload();
      }

      async function updateStage(contactId, stage) {
        await fetch('/crm/api/update-stage/' + contactId, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage })
        });
        location.reload();
      }
    </script>
  `;

  return wrapPage('Contact Details', content, 'contacts');
}

export function renderEmailQueuePage(data: {
  emailItems: any[];
  stats: any;
}): string {
  const { emailItems, stats } = data;

  const queueHtml = emailItems
    .map(
      (item: any) => `
      <tr>
        <td>${escapeHtml(item.userEmail)}</td>
        <td><strong>${item.emailTemplate}</strong></td>
        <td><span class="badge badge-${item.status}">${item.status}</span></td>
        <td>${item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : '-'}</td>
        <td>${item.sentAt ? new Date(item.sentAt).toLocaleString() : '-'}</td>
        <td>${escapeHtml(item.errorMessage) || '-'}</td>
        <td>
          ${item.status === 'pending' ? `<button class="btn btn-sm btn-secondary" onclick="cancelEmail('${item.id}')">Cancel</button>` : ''}
        </td>
      </tr>
    `
    )
    .join('');

  const content = `
    <h1>Email Queue</h1>

    <div class="stats">
      <div class="stat">
        <div class="stat-value">${stats.pending}</div>
        <div class="stat-label">Pending</div>
      </div>
      <div class="stat">
        <div class="stat-value">${stats.sent}</div>
        <div class="stat-label">Sent</div>
      </div>
      <div class="stat">
        <div class="stat-value">${stats.failed}</div>
        <div class="stat-label">Failed</div>
      </div>
    </div>

    <div style="margin-bottom: 24px;">
      <button class="btn" onclick="processEmails()">Process Pending Emails Now</button>
    </div>

    <div class="card">
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Template</th>
            <th>Status</th>
            <th>Scheduled</th>
            <th>Sent</th>
            <th>Error</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${queueHtml || '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #666;">No emails in queue</td></tr>'}
        </tbody>
      </table>
    </div>

    <script>
      async function processEmails() {
        try {
          const res = await fetch('/crm/api/process-emails', {
            method: 'POST',
            credentials: 'include'
          });
          const data = await res.json();
          alert('Processed: ' + data.sent + ' sent, ' + data.failed + ' failed');
          location.reload();
        } catch (err) {
          alert('Failed to process emails');
        }
      }

      async function cancelEmail(id) {
        if (!confirm('Cancel this email?')) return;
        try {
          const res = await fetch('/crm/api/cancel-email/' + id, {
            method: 'POST',
            credentials: 'include'
          });
          if (res.ok) location.reload();
          else alert('Failed to cancel');
        } catch (err) {
          alert('Failed to cancel email');
        }
      }
    </script>
  `;

  return wrapPage('Email Queue', content, 'emails');
}

export function renderTemplatesPage(data: {
  selectedTemplate: string;
  persona: string;
  preview: any;
  htmlBase64: string;
  templateList: any[];
}): string {
  const { selectedTemplate, persona, preview, htmlBase64, templateList } = data;

  const templateCards = templateList
    .map(
      (t: any) => `
    <a href="/crm/templates?template=${t.id}${t.id === 'W3' ? '&persona=' + persona : ''}"
       class="template-card ${t.id === selectedTemplate ? 'active' : ''}"
       style="text-decoration: none; color: inherit; padding: 16px; background: #1a1a1a; border: 1px solid #333; border-radius: 8px; cursor: pointer; transition: all 0.2s; display: block;">
      <div style="font-weight: 500; margin-bottom: 4px;">${t.name}</div>
      <div style="font-size: 13px; color: #9CA3AF;">${t.delay}</div>
      <div style="font-size: 11px; color: #666; margin-top: 4px; text-transform: uppercase;">${t.sequence}</div>
    </a>
  `
    )
    .join('');

  const content = `
    <h1>Email Templates</h1>

    <div style="display: grid; grid-template-columns: 350px 1fr; gap: 24px;">
      <div>
        <h2>Templates</h2>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${templateCards}
        </div>

        ${
          selectedTemplate === 'W3'
            ? `
          <div style="margin-top: 24px;">
            <h2>Persona Variant</h2>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <a href="/crm/templates?template=W3&persona=lonely"
                 class="btn ${persona === 'lonely' ? '' : 'btn-secondary'}"
                 style="text-align: center;">Lonely</a>
              <a href="/crm/templates?template=W3&persona=curious"
                 class="btn ${persona === 'curious' ? '' : 'btn-secondary'}"
                 style="text-align: center;">Curious</a>
              <a href="/crm/templates?template=W3&persona=privacy"
                 class="btn ${persona === 'privacy' ? '' : 'btn-secondary'}"
                 style="text-align: center;">Privacy</a>
            </div>
          </div>
        `
            : ''
        }
      </div>

      <div>
        <h2>Preview: ${escapeHtml(preview.subject)}</h2>
        <div style="background: #fff; border-radius: 8px; padding: 0; overflow: hidden;">
          <iframe src="data:text/html;base64,${htmlBase64}" style="width: 100%; height: 600px; border: none; border-radius: 8px;"></iframe>
        </div>
      </div>
    </div>
  `;

  return wrapPage('Email Templates', content, 'templates');
}

export function renderFunnelPage(funnelStats: any): string {
  const content = `
    <h1>Funnel View</h1>

    <div class="card">
      <h2>Waitlist Funnel</h2>
      <div class="funnel-flow">
        <div class="funnel-step">
          <div class="funnel-box waitlist">
            <div class="funnel-count">${funnelStats.waitlist.total}</div>
            <div class="funnel-label">Joined Waitlist</div>
          </div>
        </div>
        <div class="funnel-step">
          <div class="funnel-box waitlist">
            <div class="funnel-count">${funnelStats.waitlist.new}</div>
            <div class="funnel-label">Waiting</div>
          </div>
        </div>
        <div class="funnel-step">
          <div class="funnel-box waitlist">
            <div class="funnel-count">${funnelStats.waitlist.invited}</div>
            <div class="funnel-label">Invited</div>
          </div>
        </div>
        <div class="funnel-step">
          <div class="funnel-box waitlist">
            <div class="funnel-count">${funnelStats.waitlist.converted}</div>
            <div class="funnel-label">Converted</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Direct Signup Funnel</h2>
      <div class="funnel-flow">
        <div class="funnel-step">
          <div class="funnel-box direct">
            <div class="funnel-count">${funnelStats.direct.total}</div>
            <div class="funnel-label">Signed Up</div>
          </div>
        </div>
        <div class="funnel-step">
          <div class="funnel-box direct">
            <div class="funnel-count">${funnelStats.direct.new}</div>
            <div class="funnel-label">New (< 3 msgs)</div>
          </div>
        </div>
        <div class="funnel-step">
          <div class="funnel-box direct">
            <div class="funnel-count">${funnelStats.direct.usedFree}</div>
            <div class="funnel-label">Used Free</div>
          </div>
        </div>
        <div class="funnel-step">
          <div class="funnel-box direct">
            <div class="funnel-count">${funnelStats.direct.converted}</div>
            <div class="funnel-label">Converted</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Conversion Rates</h2>
      <table>
        <tr>
          <th>Funnel</th>
          <th>Total</th>
          <th>Converted</th>
          <th>Rate</th>
        </tr>
        <tr>
          <td>Waitlist</td>
          <td>${funnelStats.waitlist.total}</td>
          <td>${funnelStats.waitlist.converted}</td>
          <td>${
            funnelStats.waitlist.total > 0
              ? (
                  (funnelStats.waitlist.converted / funnelStats.waitlist.total) *
                  100
                ).toFixed(1)
              : 0
          }%</td>
        </tr>
        <tr>
          <td>Direct</td>
          <td>${funnelStats.direct.total}</td>
          <td>${funnelStats.direct.converted}</td>
          <td>${
            funnelStats.direct.total > 0
              ? (
                  (funnelStats.direct.converted / funnelStats.direct.total) * 100
                ).toFixed(1)
              : 0
          }%</td>
        </tr>
      </table>
    </div>
  `;

  return wrapPage('Funnel View', content, 'funnel');
}
