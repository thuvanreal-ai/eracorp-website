/* ERA Corp: shared lead capture and attribution. */
window.ERA_LEADS_ENDPOINT = "https://script.google.com/macros/s/AKfycby_u4l400WyYk6R6_3_a1eNyYezaY0JLdaOvW31W6HqFHmW5sNuuT4Ov2FxbkEeI4i_Vg/exec";
(function(){
  const KEY='era_attribution_v1';
  const qs=new URLSearchParams(location.search);
  const ref=document.referrer||'';
  const host=(()=>{try{return new URL(ref).hostname.toLowerCase()}catch{return ''}})();
  const source=(qs.get('utm_source')||'').toLowerCase();
  const medium=(qs.get('utm_medium')||'').toLowerCase();
  const paid=/^(cpc|ppc|paid|paid_social|paidsearch|paid_search|display)$/.test(medium);
  function channel(){
    if(qs.get('gclid')||qs.get('gbraid')||qs.get('wbraid'))return 'Google Ads';
    if(source.includes('google'))return paid?'Google Ads':'Google Organic';
    if(source.includes('facebook')||source==='fb'||source.includes('instagram')||source==='ig')return paid?'Facebook Ads':'Facebook Organic';
    if(source.includes('zalo'))return 'Zalo';
    if(source.includes('tiktok'))return paid?'TikTok Ads':'TikTok Organic';
    if(host.includes('google.'))return 'Google Organic';
    if(host.includes('facebook.')||host.includes('instagram.'))return 'Facebook Organic';
    if(host.includes('zalo.'))return 'Zalo';
    if(!host&&!source&&!medium)return 'Direct';
    return source||host||'Chưa xác định';
  }
  const tagged=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','fbclid','gbraid','wbraid'].some(k=>qs.has(k));
  const external=host&&host!==location.hostname;
  let stored={};
  try{stored=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{}
  const touch={attribution_source:channel(),utm_source:qs.get('utm_source')||'',utm_medium:qs.get('utm_medium')||'',utm_campaign:qs.get('utm_campaign')||'',utm_content:qs.get('utm_content')||'',utm_term:qs.get('utm_term')||'',gclid:qs.get('gclid')||'',fbclid:qs.get('fbclid')||'',referrer:ref,first_page:location.pathname+location.search,attribution_time:new Date().toISOString()};
  if(!stored.first){stored.first=touch;stored.last=touch}
  else if(tagged||external){stored.last=touch}
  try{localStorage.setItem(KEY,JSON.stringify(stored))}catch{}
  document.querySelectorAll('[data-lead-form]').forEach(form=>{
    const feedback=form.querySelector('[data-form-feedback]')||form.querySelector('[data-lead-feedback]');
    const button=form.querySelector('[type=submit]');
    const handoff=form.querySelector('[data-form-handoff]');
    const output=form.querySelector('[data-lead-output]');
    const copy=form.querySelector('[data-copy-lead]');
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      if(!form.reportValidity())return;
      const fd=new FormData(form);
      const selected=fd.getAll('services').concat(fd.getAll('work'));
      const service=selected.length?selected.join(' | '):(form.dataset.service||'');
      const err=form.querySelector('[data-service-error]');
      if(form.querySelector('.service-picks')&&!selected.length){if(err)err.hidden=false;form.querySelector('.service-picks').scrollIntoView();return}
      if(err)err.hidden=true;
      const d=Object.fromEntries(fd.entries());
      const phone=String(d.phone||'').replace(/[.\s-]/g,'');
      if(!/^0[0-9]{9}$/.test(phone)){const el=form.querySelector('[name=phone]');el.setCustomValidity('Nhập 10 chữ số bắt đầu bằng 0.');form.reportValidity();el.setCustomValidity('');return}
      const last=stored.last||touch,first=stored.first||touch;
      const payload={...d,phone,consent:'yes',services:service,service,attribution_source:last.attribution_source,first_touch_source:first.attribution_source,utm_source:last.utm_source,utm_medium:last.utm_medium,utm_campaign:last.utm_campaign,utm_content:last.utm_content,utm_term:last.utm_term,gclid:last.gclid,fbclid:last.fbclid,referrer:first.referrer,first_page:first.first_page,landing_page:location.pathname,page_url:location.href,submitted_at:new Date().toISOString()};
      if(!window.ERA_LEADS_ENDPOINT){
        if(feedback)feedback.textContent='Hệ thống đang bảo trì. Anh/chị vui lòng thử lại sau.';
        return;
      }
      if(button){button.disabled=true;button.textContent='Đang gửi yêu cầu...';}
      if(feedback)feedback.textContent='Đang chuyển yêu cầu đến ERA...';
      const requestId='era-'+Date.now()+'-'+Math.random().toString(36).slice(2);
      payload.request_id=requestId;
      const frame=document.createElement('iframe');
      frame.name='era-lead-'+requestId;
      frame.title='Gửi yêu cầu ERA';
      frame.style.display='none';
      document.body.appendChild(frame);
      const transport=document.createElement('form');
      transport.method='POST';
      transport.action=window.ERA_LEADS_ENDPOINT;
      transport.target=frame.name;
      transport.style.display='none';
      const field=document.createElement('input');
      field.type='hidden';field.name='payload';field.value=JSON.stringify(payload);
      transport.appendChild(field);
      document.body.appendChild(transport);
      let finished=false;
      const originalLabel=button?.textContent||'Gửi yêu cầu tư vấn miễn phí';
      function cleanup(){
        window.removeEventListener('message',onMessage);
        clearTimeout(timeout);
        clearTimeout(quickNotice);
        transport.remove();
        setTimeout(()=>frame.remove(),1500);
        if(button){button.disabled=false;button.textContent='Gửi yêu cầu tư vấn miễn phí';}
      }
      function showSuccess(){
        if(document.getElementById('era-success-overlay'))return;
        const style=document.createElement('style');
        style.textContent='#era-success-overlay{position:fixed;inset:0;background:rgba(12,28,47,.67);z-index:99999;display:grid;place-items:center;padding:20px}#era-success-dialog{position:relative;background:#fff;border-radius:18px;padding:38px 28px 30px;max-width:460px;width:100%;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,.25);font-family:Arial,sans-serif;color:#16304d}#era-success-dialog h2{font-size:24px;line-height:1.3;margin:14px 0}#era-success-dialog p{font-size:16px;line-height:1.65;color:#475569;margin:0 0 24px}#era-success-dialog .era-success-check{width:66px;height:66px;border-radius:50%;background:#e8f7ee;color:#17834c;display:grid;place-items:center;margin:auto;font-size:36px}#era-success-dialog .era-success-home{display:block;background:#f36b21;color:white;text-decoration:none;border-radius:10px;padding:15px;font-weight:700}#era-success-dialog .era-success-close{position:absolute;right:14px;top:12px;border:0;background:transparent;font-size:28px;cursor:pointer;color:#64748b;line-height:1;padding:5px}#era-success-dialog .era-success-dismiss{margin-top:12px;background:transparent;border:0;color:#475569;text-decoration:underline;cursor:pointer;padding:8px}';
        document.head.appendChild(style);
        const overlay=document.createElement('div');overlay.id='era-success-overlay';
        overlay.innerHTML='<div id="era-success-dialog" role="dialog" aria-modal="true" aria-labelledby="era-success-title"><button class="era-success-close" aria-label="Đóng thông báo" type="button">×</button><div class="era-success-check" aria-hidden="true">✓</div><h2 id="era-success-title">Gửi thông tin thành công!</h2><p>ERA đã nhận được yêu cầu tư vấn của Anh/chị. Đội ngũ ERA sẽ liên hệ lại trong thời gian sớm nhất.</p><a class="era-success-home" href="/">Quay lại trang chủ</a><button class="era-success-dismiss" type="button">Đóng thông báo</button></div>';
        const home=overlay.querySelector('.era-success-home');
        home.href=location.hostname.endsWith('github.io')?'/eracorp-website/':'/';
        const close=()=>{overlay.remove();style.remove();document.removeEventListener('keydown',onKey)};
        const onKey=e=>{if(e.key==='Escape')close()};
        overlay.querySelectorAll('.era-success-close,.era-success-dismiss').forEach(x=>x.addEventListener('click',close));
        document.addEventListener('keydown',onKey);
        document.body.appendChild(overlay);
        overlay.querySelector('.era-success-close').focus();
      }
      function onMessage(event){
        if(!/^https:\/\/(?:script\.google\.com|script\.googleusercontent\.com|[a-z0-9-]+\.googleusercontent\.com)$/.test(event.origin))return;
        let data=event.data;
        try{if(typeof data==='string')data=JSON.parse(data)}catch{return}
        if(!data||data.type!=='ERA_LEAD_RESULT'||data.request_id!==requestId||finished)return;
        finished=true;cleanup();
        if(data.ok===true){
          window.dataLayer=window.dataLayer||[];
          window.dataLayer.push({event:'form_submit_success',lead_id:data.lead_id||'',service,source:last.attribution_source});
          form.reset();
          if(feedback)feedback.textContent='';
          showSuccess();
        }else if(feedback)feedback.textContent='Chưa thể tiếp nhận yêu cầu. Anh/chị vui lòng kiểm tra thông tin và thử lại.';
      }
      window.addEventListener('message',onMessage);
      const timeout=setTimeout(()=>{
        if(finished)return;
        finished=true;cleanup();
        if(feedback)feedback.textContent='Chưa xác nhận được kết quả gửi. Anh/chị vui lòng đợi ít phút và kiểm tra với ERA trước khi gửi lại để tránh trùng thông tin.';
      },12000);
      const quickNotice=setTimeout(()=>{if(!finished&&feedback)feedback.textContent='Yêu cầu đã được chuyển đi. Hệ thống đang xác nhận tiếp nhận; Anh/chị không cần bấm gửi lại.';},2500);
      try{transport.submit()}catch(err){
        if(!finished){finished=true;cleanup();if(feedback)feedback.textContent='Không thể gửi yêu cầu lúc này. Anh/chị vui lòng thử lại sau.';}
      }
    });

  });
})();
(function(){const toggle=document.querySelector('.menu-toggle');const menu=document.getElementById('era-navigation');if(toggle&&menu){toggle.addEventListener('click',()=>{const open=menu.classList.toggle('is-open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Đóng menu':'Mở menu');toggle.textContent=open?'✕':'☰'});menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');toggle.textContent='☰'}))}document.querySelectorAll('[data-contact]').forEach(a=>a.addEventListener('click',()=>{window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:'contact_click',contact_method:a.dataset.contact})}))})();
