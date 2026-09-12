/* Shared Cloud B navigation, contact dialog and complete-text copying. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const nav = $('#nav'), menu = $('#mobile-menu'), burger = $('#burger'), modal = $('#modal');
  if ($('#year')) $('#year').textContent = new Date().getFullYear();
  let activeLayer = null, returnTo = null;
  const focusable = el => [...el.querySelectorAll('a[href],button,textarea,[tabindex="0"]')].filter(x => x.getClientRects().length);
  function syncInert() {
    for (const el of document.body.children) el.inert = !!activeLayer && el !== activeLayer && !(activeLayer === menu && el === nav);
    if(nav) for(const el of nav.children) el.inert = activeLayer === menu && el !== burger;
    document.body.style.overflow = activeLayer ? 'hidden' : '';
  }
  function closeLayer(restore = true) {
    if (!activeLayer) return;
    activeLayer.classList.remove('open');
    if (activeLayer === menu) {
      burger.classList.remove('open'); nav.classList.remove('menu-open');
      burger.setAttribute('aria-expanded','false'); burger.setAttribute('aria-label','Open menu');
    }
    activeLayer = null; syncInert();
    if(restore && returnTo?.isConnected) returnTo.focus();
  }
  function openLayer(layer, trigger) {
    closeLayer(false); returnTo = trigger; activeLayer = layer; layer.classList.add('open');
    if(layer === menu) {
      burger.classList.add('open'); nav.classList.add('menu-open');
      burger.setAttribute('aria-expanded','true'); burger.setAttribute('aria-label','Close menu');
    }
    syncInert(); focusable(layer)[0]?.focus();
  }
  burger?.addEventListener('click',()=> activeLayer === menu ? closeLayer() : openLayer(menu,burger));
  menu?.addEventListener('click',e=> { if(e.target.closest('a') && !e.target.closest('[data-contact]')) closeLayer(false); });
  document.querySelectorAll('[data-contact]').forEach(el=>el.addEventListener('click',e=> {
    if(!modal) return;
    e.preventDefault(); const trigger = activeLayer === menu ? burger : el; openLayer(modal,trigger);
  }));
  $('#modal-close')?.addEventListener('click',()=>closeLayer());
  modal?.addEventListener('click',e=> {if(e.target===modal) closeLayer();});
  document.addEventListener('keydown',e=> {
    if(!activeLayer) return;
    if(e.key==='Escape') {e.preventDefault();closeLayer();}
    if(e.key==='Tab') {
      const targets=focusable(activeLayer); if(activeLayer===menu) targets.push(burger);
      const first=targets[0],last=targets.at(-1);
      if(e.shiftKey && document.activeElement===first) {e.preventDefault();last.focus();}
      else if(!e.shiftKey && document.activeElement===last) {e.preventDefault();first.focus();}
    }
  });
  const wide=matchMedia('(min-width: 860px)');
  wide.addEventListener('change',()=> {if(wide.matches && activeLayer===menu) {closeLayer(false);nav.querySelector('.logo').focus();}});
  const onScroll=()=>nav?.classList.toggle('is-stuck',scrollY>20);
  addEventListener('scroll',onScroll,{passive:true}); onScroll();
  async function copy(text, button) {
    const label=button.querySelector('span') || button;
    const original=button.dataset.originalLabel || label.textContent; button.dataset.originalLabel=original;
    let ok=false;
    try {await navigator.clipboard.writeText(text);ok=true;} catch {
      const previous=document.activeElement, ta=document.createElement('textarea');
      ta.value=text; ta.style.cssText='position:fixed;left:0;top:0;opacity:0';
      (activeLayer || document.body).append(ta); ta.select();
      try {ok=document.execCommand('copy');} catch {} ta.remove(); previous?.focus();
    }
    label.textContent=ok?'Copied!':'Select text to copy';
    let status=$('#copy-status');
    if(!status) {status=document.createElement('p');status.id='copy-status';status.className='sr-only';status.setAttribute('role','status');document.body.append(status);}
    status.textContent=ok?'Copied the complete text.':'Copy unavailable. Please select the text and copy manually.';
    clearTimeout(button._copyTimer); button._copyTimer=setTimeout(()=>{label.textContent=original;},2000);
  }
  document.querySelectorAll('[data-copy-email]').forEach(button=>button.addEventListener('click',()=>copy('zhiminzhangcn@gmail.com',button)));
  document.querySelectorAll('[data-copy-prompt]').forEach(button=>button.addEventListener('click',()=>copy(button.closest('.prompt-block').querySelector('.prompt-text').textContent,button)));
})();
