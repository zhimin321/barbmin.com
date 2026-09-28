/* Enhance the four linked sections into keyboard-accessible tabs. */
(() => {
  const nav = document.querySelector('.tc-tabs');
  if (!nav) return;
  const tabs = [...nav.querySelectorAll('a')];
  const panels = tabs.map(tab => document.querySelector(tab.hash));
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
    });
  }
  function fromHash() {
    const index = tabs.findIndex(tab => tab.hash === location.hash);
    select(index < 0 ? 0 : index);
  }
  function activate(index) {
    if (location.hash !== tabs[index].hash) history.pushState(null, '', tabs[index].hash);
    select(index);
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      activate(index);
    });
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (event.key === ' ') next = index;
      if (next === undefined) return;
      event.preventDefault();
      activate(next);
      tabs[next].focus({ preventScroll: true });
    });
  });
  addEventListener('hashchange', fromHash);
  addEventListener('popstate', fromHash);
  fromHash();
})();

/* On phones, retain native image navigation and browser zoom for this page only. */
(() => {
  const phone = matchMedia('(max-width: 767px)');
  document.querySelectorAll('.tc-screenshot .shot-open').forEach(link => {
    link.addEventListener('click', event => {
      if (phone.matches) event.stopImmediatePropagation();
    }, { capture: true });
  });
})();
