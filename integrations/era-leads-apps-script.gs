/** ERA Corp lead receiver. Deploy as Web App (Execute as Me, Anyone). */
const SPREADSHEET_ID = '1MQzfUY8IYALAcW7DYULRdGcd_FSWCvrLMkH7I1og4MQ';
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const d = JSON.parse(e.postData.contents || '{}');
    const phone = String(d.phone || '').replace(/[.\s-]/g, '');
    if (!/^0\d{9}$/.test(phone) || !String(d.name||'').trim() || !String(d.area||'').trim() || d.consent !== 'yes')
      return respond({ok:false,error:'invalid_input'});
    if (d.website) return respond({ok:false,error:'spam'});
    lock.waitLock(20000);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const leads = ss.getSheetByName('KHÁCH HÀNG');
    const marketing = ss.getSheetByName('DỮ LIỆU MARKETING');
    if (!leads || !marketing) throw Error('Missing destination tabs');
    const safe = v => {
      const s = String(v == null ? '' : v).slice(0,1500);
      return /^[=+@-]/.test(s) ? "'" + s : s;
    };
    const id = Utilities.getUuid();
    const source = safe(d.attribution_source || 'Chưa xác định');
    const first = safe(d.first_touch_source || source);
    const now = new Date();
    const details = [d.message,d.detail,d.size ? 'Diện tích: '+d.size : ''].filter(Boolean).join(' | ');
    const service = d.services || d.service || d.detail || '';
    // One row per lead in each tab, same submission order and shared ID in technical tab.
    leads.appendRow([now,safe(d.name),"'" + phone,safe(service),safe(d.area),safe(details),source,'Mới','','','','','',id]);
    marketing.appendRow([id,now,"'" + phone,first,source,safe(d.utm_source),safe(d.utm_medium),
      safe(d.utm_campaign),safe(d.utm_content),safe(d.utm_term),safe(d.gclid),
      safe(d.fbclid),safe(d.first_page),safe(d.landing_page),safe(d.referrer),
      safe(d.property_type),safe(d.size),safe(d.detail),'Có']);
    SpreadsheetApp.flush();
    return respond({ok:true,lead_id:id});
  } catch (err) {
    console.error(err);
    return respond({ok:false,error:'server_error'});
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}
function respond(v) {
  return ContentService.createTextOutput(JSON.stringify(v)).setMimeType(ContentService.MimeType.JSON);
}
