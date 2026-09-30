/* Linked sections remain readable without JavaScript. */
(() => {
  const nav = document.querySelector('.ps-tabs');
  if (!nav) return;
  const tabs = [...nav.querySelectorAll('a')];
  const panels = tabs.map(tab => document.querySelector(tab.hash));
  const steps = [...document.querySelectorAll('.ps-steps a')];
  const chapters = steps.map(link => document.querySelector(link.hash));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  nav.setAttribute('role', 'tablist');
  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panels[index].id);
    panels[index].setAttribute('role', 'tabpanel');
    panels[index].setAttribute('aria-labelledby', tab.id);
    panels[index].tabIndex = 0;
  });
  function select(index) {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
      if (i !== index) panels[i].querySelectorAll('video').forEach(video => video.pause());
    });
    syncStep();
  }
  function mark(index) {
    steps.forEach((link, i) => {
      if (i === index) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    });
  }
  function syncStep() {
    if (panels[0].hidden) return;
    let active = 0;
    chapters.forEach((section, i) => {
      if (section.getBoundingClientRect().top <= 150) active = i;
    });
    mark(active);
  }
  function fromHash(scroll = true) {
    select(location.hash === '#news-pkg' ? 1 : 0);
    const target = chapters.find(section => '#' + section.id === location.hash);
    if (target && scroll) requestAnimationFrame(() => target.scrollIntoView({ behavior:'instant', block:'start' }));
  }
  function activate(index) {
    if (location.hash !== tabs[index].hash) history.pushState(null, '', tabs[index].hash);
    select(index);
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); activate(index);
    });
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (event.key === ' ') next = index;
      if (next === undefined) return;
      event.preventDefault(); activate(next); tabs[next].focus({ preventScroll:true });
    });
  });
  steps.forEach((link, index) => link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (location.hash !== link.hash) history.pushState(null, '', link.hash);
    chapters[index].focus({ preventScroll:true });
    chapters[index].scrollIntoView({ behavior:reduced.matches ? 'instant' : 'smooth', block:'start' });
    mark(index);
  }));
  let scheduled = false;
  addEventListener('scroll', () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { syncStep(); scheduled = false; });
  }, { passive:true });
  addEventListener('resize', syncStep);
  addEventListener('hashchange', () => fromHash());
  addEventListener('popstate', () => fromHash());
  const toggle = document.querySelector('#ps-script-toggle');
  const preview = document.querySelector('#ps-full-script');
  toggle.hidden = false; preview.hidden = true;
  toggle.addEventListener('click', () => {
    preview.hidden = !preview.hidden;
    toggle.setAttribute('aria-expanded', String(!preview.hidden));
    toggle.textContent = preview.hidden ? 'View script example' : 'Hide script example';
  });
  document.querySelectorAll('#shorts details').forEach(detail => detail.addEventListener('toggle', () => {
    if (!detail.open) detail.querySelectorAll('video').forEach(video => video.pause());
  }));
  document.querySelectorAll('.ps-player').forEach(player => {
    const video = player.querySelector('video');
    const button = player.querySelector('.ps-play');
    const status = player.querySelector('.ps-play-status');
    video.controls = false;
    button.hidden = false;
    button.setAttribute('aria-label', 'Play: ' + video.getAttribute('aria-label'));
    button.addEventListener('click', async () => {
      button.hidden = true;
      status.hidden = true;
      video.controls = true;
      video.tabIndex = 0;
      video.focus({ preventScroll:true });
      try { await video.play(); }
      catch {
        button.hidden = false;
        status.hidden = false;
        status.textContent = 'Playback could not start. Please try again or open the recording at full size.';
        button.focus({ preventScroll:true });
      }
    });
  });
  fromHash();
})();
