/**
 * ERA Corp lead receiver — Google Apps Script Web App.
 * Deploy: Execute as Me; Who has access: Anyone.
 * Spreadsheet: ERA CORP - LEAD KHÁCH HÀNG / LEAD ERA CORP.
 */
const SPREADSHEET_ID = '1MQzfUY8IYALAcW7DYULRdGcd_FSWCvrLMkH7I1og4MQ';
const SHEET_NAME = 'LEAD ERA CORP';
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const d = JSON.parse(e.postData.contents || '{}');
    const phone = String(d.phone || '').replace(/[.\s-]/g, '');
    if (!/^0\d{9}$/.test(phone)) return response_({ok:false,error:'invalid_phone'});
    if (!String(d.name||'').trim() || !String(d.area||'').trim() || d.consent !== 'yes')
      return response_({ok:false,error:'missing_required'});
    if (d.website) return response_({ok:false,error:'spam'});
    lock.waitLock(15000);
    const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sh) throw Error('Missing tab: ' + SHEET_NAME);
    const id = Utilities.getUuid();
    const safe = v => {
      const s = String(v == null ? '' : v).slice(0,1500);
      return /^[=+@\-]/.test(s) ? "'" + s : s;
    };
    sh.appendRow([
      new Date(), id, safe(d.name), "'" + phone, safe(d.services||d.service),
      safe(d.property_type), safe(d.area), safe(d.size), safe(d.detail),
      safe(d.message), safe(d.landing_page), safe(d.page_url),
      safe(d.utm_source), safe(d.utm_medium), safe(d.utm_campaign),
      safe(d.utm_content), safe(d.utm_term), safe(d.gclid),
      'Mới', '', '', '', 'Có'
    ]);
    SpreadsheetApp.flush();
    return response_({ok:true,lead_id:id});
  } catch(err) {
    console.error(err);
    return response_({ok:false,error:'server_error'});
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}
function response_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
