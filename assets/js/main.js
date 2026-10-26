/* ERA Corp: shared lead capture and attribution. */
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
      const msg=['YÊU CẦU TƯ VẤN ERA CORP','Họ tên: '+d.name,'Điện thoại: '+phone,'Dịch vụ: '+service,'Khu vực: '+d.area,'Loại công trình: '+(d.property_type||'Chưa xác định'),'Hạng mục: '+(d.detail||'Chưa xác định'),'Diện tích: '+(d.size||'Chưa rõ'),'Hiện trạng: '+(d.message||'Chưa mô tả')].join('\n');
      if(button)button.disabled=true;
      const endpoint=window.ERA_LEADS_ENDPOINT;
      let confirmed=false;
      if(endpoint){
        if(feedback)feedback.textContent='Đang gửi yêu cầu, Anh/chị vui lòng đợi...';
        try{
          const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload),redirect:'follow'});
          const data=await response.json();
          if(!response.ok||data.ok!==true)throw Error('Unconfirmed submission');
          confirmed=true;
          window.dataLayer=window.dataLayer||[];
          window.dataLayer.push({event:'form_submit_success',lead_id:data.lead_id||'',service,source:last.attribution_source});
          if(feedback)feedback.textContent='ERA đã nhận được yêu cầu. Chúng tôi sẽ liên hệ Anh/chị sớm!';
          if(handoff)handoff.hidden=true;
          if(output)output.hidden=true;
          form.reset();
        }catch(err){if(feedback)feedback.textContent='Chưa xác nhận được việc gửi tự động. Anh/chị vui lòng gửi nội dung qua Zalo bên dưới.'}
      }else if(feedback)feedback.textContent='Hệ thống đang hoàn thiện kết nối. Anh/chị vui lòng gửi yêu cầu qua Zalo bên dưới.';
      if(!confirmed){
        if(handoff){handoff.hidden=false;const t=handoff.querySelector('[data-handoff-text]');if(t)t.value=msg}
        if(output){output.textContent=msg;output.hidden=false;output.classList.add('active','is-visible')}
        if(copy){copy.hidden=false;copy.classList.add('active','is-visible')}
        window.dataLayer=window.dataLayer||[];
        window.dataLayer.push({event:'lead_handoff_ready',service});
        (handoff||output)?.scrollIntoView({behavior:'smooth',block:'nearest'});
      }
      if(button)button.disabled=false;
    });
    copy?.addEventListener('click',async()=>{
      const msg=handoff?.querySelector('[data-handoff-text]')?.value||output?.textContent||'';
      try{await navigator.clipboard.writeText(msg);copy.textContent='Đã sao chép'}catch{if(output){const range=document.createRange();range.selectNodeContents(output);const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range)}else{const ta=handoff?.querySelector('[data-handoff-text]');ta?.focus();ta?.select()}copy.textContent='Hãy sao chép phần đã chọn'}
    });
  });
})();
(function(){const toggle=document.querySelector('.menu-toggle');const menu=document.getElementById('era-navigation');if(toggle&&menu){toggle.addEventListener('click',()=>{const open=menu.classList.toggle('is-open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Đóng menu':'Mở menu');toggle.textContent=open?'✕':'☰'});menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');toggle.textContent='☰'}))}document.querySelectorAll('[data-contact]').forEach(a=>a.addEventListener('click',()=>{window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:'contact_click',contact_method:a.dataset.contact})}))})();
