/* Hash anchors remain usable without JS; enhancement selects one reading panel. */
(() => {
  const ids = ['coach','folder','cue','tc'];
  const panels = [...document.querySelectorAll('.lab-panel')];
  let selected = 'coach';
  function select() {
    const hash=location.hash.slice(1);
    if(ids.includes(hash)) selected=hash;
    else if(hash!=='main') selected='coach';
    const production=selected!=='coach';
    panels.forEach(panel=>panel.hidden=panel.id!==selected);
    document.querySelector('.lab-subcategories').hidden=!production;
    document.querySelector('.production-intro').hidden=!production;
    document.querySelectorAll('.lab-categories a').forEach(a=>{
      if(a.dataset.category===(production?'production':'coach')) a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
    });
    document.querySelectorAll('.lab-subcategories a').forEach(a=>{
      if(a.hash==='#'+selected) a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
    });
  }
  document.addEventListener('click',e=> {
    const a=e.target.closest('a[href^="#"]');
    if(a?.hash==='#main' && a.closest('.lab-context')) {
      e.preventDefault();
      document.querySelector('.lab-categories').scrollIntoView({block:'start'});
      document.querySelector('.lab-categories a[aria-current]').focus({preventScroll:true});
      return;
    }
    if(!a || !ids.includes(a.hash.slice(1))) return;
    e.preventDefault();
    if(location.hash!==a.hash) history.pushState(null,'',a.hash);
    select(); document.querySelector('.lab-categories').scrollIntoView({block:'start'});
    if(a.closest('.lab-shortcuts')) document.querySelector('.lab-categories a[aria-current]').focus({preventScroll:true});
  });
  addEventListener('hashchange',select); addEventListener('popstate',select); select();
})();
