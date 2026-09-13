/* Original screenshots stay linked directly when JavaScript is unavailable. */
(() => {
  const links = document.querySelectorAll('.shot-open');
  if (!links.length || typeof HTMLDialogElement === 'undefined') return;
  const dialog = document.createElement('dialog');
  dialog.className = 'image-dialog'; dialog.setAttribute('aria-label', 'Full software screenshot');
  dialog.innerHTML = '<div class="image-toolbar"><a target="_blank" rel="noopener noreferrer">Open original image ↗</a><button type="button" autofocus>Close image ×</button></div><img alt="">';
  document.body.append(dialog);
  let trigger;
  links.forEach(link => link.addEventListener('click', e => {
    e.preventDefault(); trigger=link;
    const img=dialog.querySelector('img'); img.src=link.href; img.alt=link.querySelector('img').alt;
    dialog.querySelector('a').href=link.href; dialog.showModal(); document.body.style.overflow='hidden';
  }));
  dialog.querySelector('button').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=> {if(e.target===dialog) {const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom) dialog.close();}});
  dialog.addEventListener('close',()=> {document.body.style.overflow='';trigger?.focus();});
})();
