/* =========================================================
   Portfólio — interações
   Cursor, navegação, reveals, filtros dinâmicos, formulário
   ========================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- véu de transição entre páginas ---------- */
  function ready() { root.classList.add("ready"); }
  if (document.readyState === "complete") ready();
  else window.addEventListener("load", ready);
  setTimeout(ready, 1400); // segurança

  window.addEventListener("pageshow", function (e) {
    if (e.persisted) document.body.classList.remove("leaving");
  });

  /* ---------- barra de progresso + topbar ---------- */
  var progress = $(".progress");
  function onScroll() {
    var y = window.scrollY || 0;
    document.body.classList.toggle("scrolled", y > 18);
    if (progress) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? Math.min(y / h, 1) * 100 : 0) + "%";
    }
    spyActive();
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- cursor personalizado ---------- */
  if (fine && !reduced && $(".cursor")) {
    var cur = $(".cursor"), dot = $(".cursor-dot");
    var tx = 0, ty = 0, cx = 0, cy = 0, shown = false;
    document.addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!shown) { shown = true; cx = tx; cy = ty; document.body.classList.add("cursor-on"); }
      dot.style.transform = "translate3d(" + tx + "px," + ty + "px,0)";
    });
    (function loop() {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      cur.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
      requestAnimationFrame(loop);
    })();
    var HOT = "a, button, .app, .seg-btn, .switch, input, textarea, select, label";
    document.addEventListener("pointerover", function (e) {
      if (e.target.closest && e.target.closest(HOT)) document.body.classList.add("cursor-hot");
    });
    document.addEventListener("pointerout", function (e) {
      if (e.target.closest && e.target.closest(HOT)) document.body.classList.remove("cursor-hot");
    });
    document.addEventListener("mouseleave", function () { document.body.classList.remove("cursor-on"); });
    document.addEventListener("mouseenter", function () { if (shown) document.body.classList.add("cursor-on"); });
  }

  /* ---------- spotlight + magnetismo nos botões ---------- */
  $$("a.btn, button.btn, .ico-btn, .card, .soft-card").forEach(function (el) {
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
      el.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
    });
    if (el.matches(".btn, .ico-btn") && fine && !reduced) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        el.style.transform = "translate(" + dx * 7 + "px," + (dy * 6 - 3) + "px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    }
  });

  /* ---------- revela ao rolar ---------- */
  var revealables = $$(".rv, .rv-x, .rv-s");
  if ("IntersectionObserver" in window && !document.body.classList.contains("calm")) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        io.unobserve(en.target);
        if (en.target.hasAttribute("data-count")) countUp(en.target);
        var bars = en.target.querySelectorAll(".bar > i[data-w]");
        bars.forEach(function (b) { b.style.width = b.dataset.w + "%"; });
        var dots = en.target.querySelectorAll(".dots i[data-on]");
        dots.forEach(function (d, i) {
          setTimeout(function () { d.classList.add("on"); }, 90 * i);
        });
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    revealables.forEach(function (el, i) {
      if (!el.style.getPropertyValue("--d")) el.style.setProperty("--d", (i % 6) * 70 + "ms");
      io.observe(el);
    });
  } else {
    revealables.forEach(function (el) { el.classList.add("in"); });
    $$(".bar > i[data-w]").forEach(function (b) { b.style.width = b.dataset.w + "%"; });
    $$(".dots i[data-on]").forEach(function (d) { d.classList.add("on"); });
    $$("[data-count]").forEach(countUp);
  }

  function countUp(el) {
    var target = parseFloat(el.dataset.count);
    var dec = (el.dataset.dec | 0);
    var suffix = el.dataset.suffix || "";
    if (reduced) { el.textContent = target.toFixed(dec) + suffix; return; }
    var start = performance.now(), dur = 1500;
    (function step(now) {
      var p = Math.min((now - start) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * e).toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }

  /* ---------- navegação: pílula deslizante ---------- */
  var navLinks = $$(".nav-link");
  var pill = $(".nav-pill");
  function movePill(target) {
    if (!pill || !target) return;
    pill.style.width = target.offsetWidth + "px";
    pill.style.transform = "translateX(" + target.offsetLeft + "px)";
    pill.classList.add("on");
  }
  function currentLink() {
    var here = location.pathname.split("/").pop() || "index.html";
    return navLinks.filter(function (a) {
      return a.getAttribute("href") === here;
    })[0] || null;
  }
  var active = currentLink();
  if (active) active.setAttribute("aria-current", "page");
  function recenter() { movePill(currentLink()); }
  window.addEventListener("load", recenter);
  window.addEventListener("resize", recenter);
  setTimeout(recenter, 60);
  navLinks.forEach(function (a) {
    a.addEventListener("pointerenter", function () { movePill(a); });
    a.addEventListener("focus", function () { movePill(a); });
  });
  var navBox = $(".nav-links");
  if (navBox) navBox.addEventListener("pointerleave", recenter);

  /* ---------- navegação lateral (âncoras das páginas) ---------- */
  var sideLinks = $$(".side-nav a");
  var sections = sideLinks.map(function (a) { return document.getElementById(a.hash.slice(1)); }).filter(Boolean);
  function spyActive() {
    if (!sections.length) return;
    var y = window.scrollY + 190;
    var idx = 0;
    sections.forEach(function (s, i) { if (s.offsetTop <= y) idx = i; });
    sideLinks.forEach(function (a, i) { a.classList.toggle("on", i === idx); });
  }
  spyActive();

  /* ---------- pastas da home ---------- */
  var apps = $$(".app");
  if (apps.length && fine) {
    apps.forEach(function (app) {
      app.addEventListener("pointerenter", function () { document.body.classList.add("hovering-app"); });
      app.addEventListener("pointerleave", function () { document.body.classList.remove("hovering-app"); });
      app.addEventListener("focus", function () { document.body.classList.add("hovering-app"); });
      app.addEventListener("blur", function () { document.body.classList.remove("hovering-app"); });
    });
  }
  // declive 3D nas pastas
  if (apps.length && fine && !reduced) {
    apps.forEach(function (app) {
      var f = $(".folder", app);
      if (!f) return;
      app.addEventListener("pointermove", function (e) {
        var r = f.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        f.style.transform = "perspective(700px) rotateY(" + dx * 12 + "deg) rotateX(" + (-dy * 10) + "deg) translateY(-8px)";
      });
      app.addEventListener("pointerleave", function () { f.style.transform = ""; });
    });
  }

  /* ---------- segmented control dinâmico ---------- */
  $$(".seg").forEach(function (seg) {
    var thumb = $(".seg-thumb", seg);
    var btns = $$(".seg-btn", seg);
    function place(btn) {
      if (!thumb || !btn) return;
      thumb.style.width = btn.offsetWidth + "px";
      thumb.style.transform = "translateX(" + btn.offsetLeft + "px)";
      thumb.classList.add("on");
    }
    var startBtn = btns.filter(function (b) { return b.getAttribute("aria-selected") === "true"; })[0] || btns[0];
    requestAnimationFrame(function () { place(startBtn); });
    window.addEventListener("resize", function () {
      place(btns.filter(function (b) { return b.getAttribute("aria-selected") === "true"; })[0]);
    });
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        btns.forEach(function (b) { b.setAttribute("aria-selected", String(b === btn)); });
        place(btn);
        var group = seg.dataset.seg;
        var cat = btn.dataset.cat;
        var items = $$("[data-cat-group='" + group + "']");
        var shown = 0;
        items.forEach(function (it) {
          var ok = cat === "todos" || it.dataset.cat === cat;
          it.hidden = !ok;
          it.classList.remove("proj-in");
          if (ok) { shown++; void it.offsetWidth; it.classList.add("proj-in"); }
        });
        var empty = $("[data-empty='" + group + "']");
        if (empty) empty.classList.toggle("show", shown === 0);
      });
    });
  });

  /* ---------- acordeão ---------- */
  $$(".acc-item").forEach(function (item) {
    var q = $(".acc-q", item), a = $(".acc-a", item);
    if (!q || !a) return;
    q.setAttribute("aria-expanded", "false");
    q.addEventListener("click", function () {
      var open = item.classList.toggle("open");
      q.setAttribute("aria-expanded", String(open));
      a.style.maxHeight = open ? a.scrollHeight + "px" : "0px";
      $$(".acc-item.open").forEach(function (other) {
        if (other === item) return;
        other.classList.remove("open");
        var oq = $(".acc-q", other), oa = $(".acc-a", other);
        if (oq) oq.setAttribute("aria-expanded", "false");
        if (oa) oa.style.maxHeight = "0px";
      });
    });
  });

  /* ---------- switches ---------- */
  $$(".switch").forEach(function (sw) {
    sw.setAttribute("role", "switch");
    sw.setAttribute("tabindex", "0");
    function toggle() {
      var next = sw.getAttribute("aria-checked") !== "true";
      sw.setAttribute("aria-checked", String(next));
      if (sw.dataset.action === "calm") {
        document.body.classList.toggle("calm", next);
        try { localStorage.setItem("calm", next ? "1" : "0"); } catch (e) {}
      }
    }
    sw.addEventListener("click", toggle);
    sw.addEventListener("keydown", function (e) {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(); }
    });
  });
  try {
    if (localStorage.getItem("calm") === "1") {
      document.body.classList.add("calm");
      $$(".switch[data-action='calm']").forEach(function (s) { s.setAttribute("aria-checked", "true"); });
    }
  } catch (e) {}

  /* ---------- modal de projeto ---------- */
  var modal = $(".modal");
  if (modal) {
    var mCard = $(".modal-card", modal);
    var lastFocus = null;
    function openModal(data) {
      lastFocus = document.activeElement;
      $(".modal-title", modal).textContent = data.title;
      $(".modal-tags", modal).innerHTML = data.tags.map(function (t) {
        return "<span class='tag'>" + t + "</span>";
      }).join("");
      $(".modal-desc", modal).textContent = data.desc;
      $(".modal-role", modal).textContent = data.role;
      $(".modal-year", modal).textContent = data.year;
      $(".modal-stack", modal).innerHTML = data.stack.map(function (s) { return "<li>" + s + "</li>"; }).join("");
      $(".modal-points", modal).innerHTML = (data.points || []).map(function (p) { return "<li>" + p + "</li>"; }).join("");
      var link = $(".modal-link", modal);
      if (data.href) { link.href = data.href; link.style.display = ""; }
      else link.style.display = "none";
      modal.classList.add("open");
      document.body.style.overflow = "hidden";
      $(".modal-close", modal).focus();
    }
    function closeModal() {
      modal.classList.remove("open");
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    }
    $$("[data-project]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var card = btn.closest("[data-project-card]");
        try { openModal(JSON.parse(card.querySelector("script[type='application/json']").textContent)); }
        catch (e) { console.warn("projeto inválido", e); }
      });
    });
    $(".modal-close", modal).addEventListener("click", closeModal);
    $(".modal-bg", modal).addEventListener("click", closeModal);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
    });
    if (mCard) {
      mCard.addEventListener("pointermove", function (e) {
        var r = mCard.getBoundingClientRect();
        mCard.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
        mCard.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
      });
    }
  }

  /* ---------- botão copiar ---------- */
  $$("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var txt = btn.dataset.copy;
      var done = function () {
        var label = btn.querySelector("[data-label]") || btn;
        var old = label.textContent;
        label.textContent = "Copiado ✓";
        btn.classList.add("done");
        setTimeout(function () { label.textContent = old; btn.classList.remove("done"); }, 2200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(done).catch(fallback);
      } else fallback();
      function fallback() {
        var t = document.createElement("textarea");
        t.value = txt; t.style.position = "fixed"; t.style.opacity = "0";
        document.body.appendChild(t); t.select();
        try { document.execCommand("copy"); done(); } catch (e) {}
        document.body.removeChild(t);
      }
    });
  });

  /* ---------- formulário ---------- */
  var form = $("[data-form]");
  if (form) {
    $$(".field input, .field textarea, .field select").forEach(function (inp) {
      var sync = function () { inp.parentElement.classList.toggle("filled", !!inp.value); };
      inp.addEventListener("input", function () {
        sync();
        inp.parentElement.classList.remove("bad");
      });
      inp.addEventListener("blur", sync);
      sync();
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      $$(".field", form).forEach(function (f) {
        var inp = $("input, textarea, select", f);
        if (!inp || !inp.required) return;
        var valid = inp.checkValidity() && inp.value.trim() !== "";
        f.classList.toggle("bad", !valid);
        if (!valid) ok = false;
      });
      if (!ok) { var bad = $(".field.bad", form); if (bad) $("input, textarea", bad).focus(); return; }

      var btn = $("[type='submit']", form);
      var label = $("[data-label]", btn);
      var old = label.textContent;
      btn.disabled = true;
      label.textContent = "Enviando…";
      var spin = document.createElement("span");
      spin.className = "spin";
      btn.appendChild(spin);

      setTimeout(function () {
        btn.removeChild(spin);
        label.textContent = old;
        btn.disabled = false;

        // monta o e-mail real a partir do formulário
        var nome = (form.querySelector("#nome") || {}).value || "";
        var mail = (form.querySelector("#email") || {}).value || "";
        var ass = (form.querySelector("#assunto") || {}).value || "Mensagem do portfólio";
        var msg = (form.querySelector("#mensagem") || {}).value || "";
        var body = msg + "\n\n---\nDe: " + nome + " (" + mail + ")";
        var href = "mailto:gabrie.reis2009@gmail.com?subject=" +
          encodeURIComponent("[Portfólio] " + ass + " — " + nome) +
          "&body=" + encodeURIComponent(body);
        try { window.location.href = href; } catch (e) {}

        form.reset();
        $$(".field", form).forEach(function (f) { f.classList.remove("filled", "bad"); });
        var ok2 = $(".form-ok");
        if (ok2) { ok2.classList.add("show"); setTimeout(function () { ok2.classList.remove("show"); }, 9000); }
      }, 900);
    });
  }

  /* ---------- menu flutuante (dock) ---------- */
  var dock = $(".dock");
  if (dock) {
    var dockBtn = $(".dock-btn", dock), panel = $(".dock-panel", dock);
    // cascata
    $$("a", panel).forEach(function (a, i) { a.style.setProperty("--i", i); });
    function setDock(open) {
      dock.classList.toggle("open", open);
      dockBtn.setAttribute("aria-expanded", String(open));
      panel.setAttribute("aria-hidden", String(!open));
    }
    dockBtn.addEventListener("click", function (e) { e.stopPropagation(); setDock(!dock.classList.contains("open")); });
    document.addEventListener("click", function (e) { if (!dock.contains(e.target)) setDock(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setDock(false); });
  }

  /* ---------- transição entre páginas ---------- */
  if (!reduced) {
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a) return;
      var href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#" || a.target === "_blank" || a.hasAttribute("download")) return;
      if (/^(mailto:|tel:|https?:\/\/)/i.test(href)) {
        if (href.indexOf(location.host) === -1 && /^https?:/i.test(href)) return;
        if (/^(mailto:|tel:)/i.test(href)) return;
      }
      if (a.href && a.host !== location.host) return;
      var path = a.pathname.split("/").pop() || "index.html";
      if (path === location.pathname.split("/").pop() && a.hash) return;
      e.preventDefault();
      document.body.classList.add("leaving");
      setTimeout(function () { location.href = a.origin + a.pathname + a.search + a.hash; }, 340);
    });
  }

  onScroll();
})();
