/**
 * AlsoSocial website form -> Google Sheets
 * Bind this Apps Script to the "AlsoSocial — Website Form Submissions" spreadsheet.
 * Set Script Property ALSOSOCIAL_WEBHOOK_SECRET to a long random secret.
 * Deploy as a web app: Execute as Me, Who has access: Anyone.
 * Never paste the webhook secret or script URL into your public HTML.
 */
const TAB_NAME = 'Form Submissions';
const VALID_SERVICES = new Set(['Website Design','Landing Pages','Booking Forms','Conversion Optimization','Google Ads','Meta Ads','Lead Generation','Campaign Optimization','Social Media Management','AI Automations','AI Chatbots','AI Voice Assistants','Workflow Automation','Email & SMS Follow ups','A little of everything']);
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    const secret = PropertiesService.getScriptProperties().getProperty('ALSOSOCIAL_WEBHOOK_SECRET');
    if (!secret || secret.length < 32 || data.secret !== secret) return output({ok:false,error:'Unauthorized'});
    const requestId = String(data.requestId || '');
    if (!/^[0-9a-f-]{36}$/i.test(requestId)) return output({ok:false,error:'Invalid submission ID'});
    const name = String(data.name || '').slice(0,100), email = String(data.email || '').slice(0,254);
    const business = String(data.business || '').slice(0,200), service = String(data.service || '').slice(0,100);
    const message = String(data.message || '').slice(0,5000);
    if (!name || !/^\S+@[^\s@]+\.[^\s@]+$/.test(email) || !VALID_SERVICES.has(service) || message.length < 10) return output({ok:false,error:'Invalid fields'});
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(20000)) return output({ok:false,error:'Busy, retry'});
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TAB_NAME);
      if (!sheet) return output({ok:false,error:'Missing sheet tab'});
      const ids = sheet.getRange(1,1,Math.max(sheet.getLastRow(),1),1);
      if (ids.createTextFinder(requestId).matchEntireCell(true).findNext()) return output({ok:true,duplicate:true});
      // Prevent spreadsheet formula injection from user-supplied form fields.
      const safe = v => /^[=+@\-]/.test(v) ? "'" + v : v;
      sheet.appendRow([requestId,new Date(),safe(name),safe(email),safe(business),safe(service),safe(message),'New','AlsoSocial Website','Sent']);
      return output({ok:true});
    } finally { lock.releaseLock(); }
  } catch (_) { return output({ok:false,error:'Failed to save enquiry'}); }
}
function output(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
