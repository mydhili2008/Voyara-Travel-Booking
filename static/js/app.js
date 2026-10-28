(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cards = $$(".destination-card");
  const toast = $("#toast");
  let toastTimer;

  function notify(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
  }

  // Page progress, compact header, and back-to-top control.
  const progressBar = $("#progressBar");
  const header = $(".site-header");
  const backToTop = $("#backToTop");
  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? (window.scrollY / max) * 100 : 0;
    progressBar.style.width = `${progress}%`;
    header.classList.toggle("scrolled", window.scrollY > 24);
    backToTop.classList.toggle("visible", window.scrollY > 650);
    if (!reduceMotion) {
      $$("[data-parallax]").forEach(el => {
        const rect = el.parentElement.getBoundingClientRect();
        const speed = Number(el.dataset.parallax || 0.15);
        const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * speed;
        el.style.transform = `translate3d(0, ${offset}px, 0) scale(1.08)`;
      });
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();
  backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

  // Reveal-on-scroll animation with a graceful fallback.
  if ("IntersectionObserver" in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    $$(".reveal").forEach((el, index) => {
      el.style.transitionDelay = `${Math.min(index % 4, 3) * 65}ms`;
      revealObserver.observe(el);
    });
  } else {
    $$(".reveal").forEach(el => el.classList.add("is-visible"));
  }

  // Mobile navigation.
  const menuToggle = $("#menuToggle");
  const nav = $(".desktop-nav");
  menuToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  });
  $$(".desktop-nav a").forEach(link => link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }));

  // Destination filters, search, and sorting.
  let activeFilter = "all";
  let activeDestination = "all";
  const styleSelect = $("#searchStyle");
  function applyFilters() {
    const style = styleSelect.value;
    let visible = 0;
    cards.forEach(card => {
      const styles = card.dataset.style.split(" ");
      const placeMatch = activeDestination === "all" || card.dataset.place === activeDestination;
      const filterMatch = activeFilter === "all" || styles.includes(activeFilter);
      const styleMatch = style === "all" || styles.includes(style);
      const show = placeMatch && filterMatch && styleMatch;
      card.classList.toggle("hidden", !show);
      if (show) visible++;
    });
    $("#emptyState").hidden = visible > 0;
  }
  $$(".filter-chip").forEach(button => button.addEventListener("click", () => {
    $$(".filter-chip").forEach(chip => chip.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    activeDestination = "all";
    $("#searchDestination").value = "all";
    applyFilters();
  }));
  styleSelect.addEventListener("change", applyFilters);
  $("#searchForm").addEventListener("submit", event => {
    event.preventDefault();
    activeDestination = $("#searchDestination").value;
    activeFilter = "all";
    $$(".filter-chip").forEach(chip => chip.classList.toggle("active", chip.dataset.filter === "all"));
    applyFilters();
    if ($("#searchDate").value) $("#tripDate").value = $("#searchDate").value;
    document.querySelector("#destinations").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    const match = activeDestination === "all" ? "Showing all considered places." : `Showing journeys for ${activeDestination}.`;
    notify(match);
  });
  $("#sortDestinations").addEventListener("change", event => {
    const mode = event.target.value;
    const grid = $("#destinationGrid");
    const sorted = [...cards].sort((a, b) => {
      if (mode === "price-low") return Number(a.dataset.price) - Number(b.dataset.price);
      if (mode === "price-high") return Number(b.dataset.price) - Number(a.dataset.price);
      if (mode === "rating") return Number(b.dataset.rating) - Number(a.dataset.rating);
      return Number(a.querySelector(".image-index").textContent.split("/")[0]) - Number(b.querySelector(".image-index").textContent.split("/")[0]);
    });
    sorted.forEach(card => grid.appendChild(card));
  });
  $$("[data-place-link]").forEach(link => link.addEventListener("click", () => {
    const place = link.dataset.placeLink;
    const destination = $('select[name="destination"]');
    if ([...destination.options].some(option => option.value === place || option.text === place)) destination.value = place;
  }));
  $$("[data-experience]").forEach(link => link.addEventListener("click", () => {
    const filter = link.dataset.experience;
    activeFilter = filter;
    activeDestination = "all";
    $$(".filter-chip").forEach(chip => chip.classList.toggle("active", chip.dataset.filter === filter));
    $("#searchDestination").value = "all";
    styleSelect.value = "all";
    applyFilters();
  }));

  // Saved destinations are stored locally in the visitor's browser.
  const STORAGE_KEY = "voyara-saved-places-v1";
  const destinationInfo = Object.fromEntries(cards.map(card => [
    card.dataset.place,
    {
      name: card.dataset.place,
      price: card.querySelector(".destination-meta span:last-child").textContent,
      image: $("img", card.querySelector(".destination-image")).src,
      rating: card.dataset.rating
    }
  ]));
  function getSaved() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]").filter(name => destinationInfo[name]); }
    catch { return []; }
  }
  function setSaved(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(list)]));
    renderSaved();
  }
  function renderSaved() {
    const saved = getSaved();
    $("#savedCount").textContent = saved.length;
    $$(".save-button").forEach(button => {
      const active = saved.includes(button.dataset.save);
      button.classList.toggle("saved", active);
      button.textContent = active ? "♥" : "♡";
      button.setAttribute("aria-pressed", String(active));
    });
    const list = $("#savedList");
    if (!saved.length) {
      list.innerHTML = '<p class="saved-empty">Your saved places will find a home here. Tap the heart on a destination to keep it close.</p>';
      return;
    }
    list.innerHTML = saved.map(name => {
      const item = destinationInfo[name];
      return `<article class="saved-item"><img src="${item.image}" alt=""><div><h3>${item.name}</h3><p>${item.price} · ★ ${item.rating}</p></div><button type="button" data-remove-saved="${item.name}" aria-label="Remove ${item.name}">×</button></article>`;
    }).join("");
    $$("[data-remove-saved]", list).forEach(button => button.addEventListener("click", () => {
      setSaved(getSaved().filter(name => name !== button.dataset.removeSaved));
      notify(`${button.dataset.removeSaved} removed from saved places.`);
    }));
  }
  $$(".save-button").forEach(button => button.addEventListener("click", () => {
    const place = button.dataset.save;
    const saved = getSaved();
    const exists = saved.includes(place);
    setSaved(exists ? saved.filter(name => name !== place) : [...saved, place]);
    notify(exists ? `${place} removed from your shortlist.` : `${place} saved for later.`);
  }));
  const drawer = $("#savedDrawer");
  function openDrawer() {
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("drawer-open");
    $("#closeDrawer").focus();
  }
  function closeDrawer() {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("drawer-open");
    $("#savedTrigger").focus();
  }
  $("#savedTrigger").addEventListener("click", openDrawer);
  $("#closeDrawer").addEventListener("click", closeDrawer);
  $("#drawerBackdrop").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", event => { if (event.key === "Escape" && drawer.classList.contains("open")) closeDrawer(); });
  $("#drawerPlan").addEventListener("click", closeDrawer);
  renderSaved();

  // Date minimums: don't let visitors choose a date in the past.
  const today = new Date();
  const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  $("#searchDate").min = localToday;
  $("#tripDate").min = localToday;

  // Python/Flask endpoint stores trip enquiries in SQLite.
  $("#tripForm").addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = $(".form-submit", form);
    const status = $("#formStatus");
    const payload = Object.fromEntries(new FormData(form).entries());
    button.disabled = true;
    button.style.opacity = ".65";
    status.textContent = "Sending your trip idea…";
    try {
      const response = await fetch("/api/enquiry", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Please check the form and try again.");
      status.textContent = `${result.message} Reference: ${result.reference}`;
      form.reset();
      notify("Your trip idea has been received.");
    } catch (error) {
      status.textContent = error.message || "Could not send your request. Please try again.";
    } finally {
      button.disabled = false;
      button.style.opacity = "1";
    }
  });

  // Newsletter endpoint stores unique email addresses in SQLite.
  $("#newsletterForm").addEventListener("submit", async event => {
    event.preventDefault();
    const email = $("#newsletterEmail").value.trim();
    const status = $("#newsletterStatus");
    status.textContent = "Adding you to the list…";
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Please check your email.");
      status.textContent = result.message;
      event.currentTarget.reset();
    } catch (error) {
      status.textContent = error.message || "Could not subscribe right now.";
    }
  });
})();