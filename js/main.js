/* ==========================================================================
   JR Microcemento Valencia — interfaz y animaciones (vanilla, sin librerias)
   1. Menu movil        5. Titulares por lineas      9. Cursor
   2. Cabecera          6. Contadores               10. Formularios
   3. FAQ               7. Parallax del hero         11. Anclas
   4. Revelados         8. Progreso y volver arriba
   ========================================================================== */
(function () {
  'use strict';

  // ------------------------------------------------------------------
  // CONFIGURACION DEL FORMULARIO
  // Cuando el cliente facilite el endpoint (Formspree / Web3Forms /
  // Cloudflare Worker), pegarlo aqui. Mientras este vacio, el formulario
  // compone un correo con los datos como plan B.
  // FORM-PENDIENTE
  // ------------------------------------------------------------------
  var FORM_ENDPOINT = '';
  var FALLBACK_EMAIL = 'JRmicrocementovalencia@gmail.com';

  var qs = function (s, c) { return (c || document).querySelector(s); };
  var qsa = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ------------------------------------------------------------------
  // 1. Menu movil a pantalla completa
  // ------------------------------------------------------------------
  function initNav() {
    var burger = qs('[data-nav-open]');
    var panel = qs('[data-nav-panel]');
    if (!burger || !panel) return;
    var closeBtn = qs('[data-nav-close]', panel);
    var items = qsa('.mnav-item', panel);

    items.forEach(function (item, i) {
      item.style.animationDelay = 120 + i * 55 + 'ms';
    });

    function open() {
      panel.classList.add('is-open');
      burger.setAttribute('aria-expanded', 'true');
      document.documentElement.style.overflow = 'hidden';
      var first = qs('a, button', panel);
      if (first) first.focus({ preventScroll: true });
    }

    function close() {
      panel.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      document.documentElement.style.overflow = '';
      burger.focus({ preventScroll: true });
    }

    burger.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    qsa('a', panel).forEach(function (a) { a.addEventListener('click', close); });

    // acordeones dentro del menu movil
    qsa('[data-mnav-toggle]', panel).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.mnav-item');
        var open2 = item.classList.contains('is-open');
        items.forEach(function (o) { o.classList.remove('is-open'); });
        if (!open2) item.classList.add('is-open');
        btn.setAttribute('aria-expanded', open2 ? 'false' : 'true');
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) close();
    });
  }

  // ------------------------------------------------------------------
  // 2. Cabecera: compacta al bajar, se esconde al bajar rapido, vuelve al subir
  // ------------------------------------------------------------------
  function initHeader() {
    var header = qs('.site-header');
    if (!header) return;
    var last = window.scrollY;
    var ticking = false;

    function update() {
      var y = window.scrollY;
      header.classList.toggle('is-stuck', y > 30);
      document.body.classList.toggle('is-scrolled', y > 30);
      var overHero = header.classList.contains('site-header--over') && y < window.innerHeight * 0.7;
      if (!overHero && y > 320 && y > last + 6 && !qs('.mobile-nav.is-open')) {
        header.classList.add('is-hidden');
      } else if (y < last - 6 || y < 320) {
        header.classList.remove('is-hidden');
      }
      last = y;
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  // ------------------------------------------------------------------
  // 2 bis. Menus desplegables: no deben cerrarse al cruzar el hueco
  // ------------------------------------------------------------------
  function initMegaMenus() {
    qsa('.nav__item').forEach(function (item) {
      var panel = qs('.mega', item);
      if (!panel) return;
      var link = qs('.nav__link', item);
      var timer = null;

      function open() {
        clearTimeout(timer);
        qsa('.nav__item.is-open').forEach(function (o) { if (o !== item) o.classList.remove('is-open'); });
        item.classList.add('is-open');
        if (link) link.setAttribute('aria-expanded', 'true');
      }

      function close(delay) {
        clearTimeout(timer);
        timer = setTimeout(function () {
          item.classList.remove('is-open');
          if (link) link.setAttribute('aria-expanded', 'false');
        }, delay || 0);
      }

      item.addEventListener('mouseenter', open);
      item.addEventListener('mouseleave', function () { close(260); });
      item.addEventListener('focusin', open);
      item.addEventListener('focusout', function (e) {
        if (!item.contains(e.relatedTarget)) close(120);
      });
      panel.addEventListener('mouseenter', open);

      if (link) {
        link.setAttribute('aria-expanded', 'false');
        link.setAttribute('aria-haspopup', 'true');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      qsa('.nav__item.is-open').forEach(function (o) { o.classList.remove('is-open'); });
    });
  }

  // ------------------------------------------------------------------
  // 3. Acordeon de FAQ (uno abierto a la vez)
  // ------------------------------------------------------------------
  function initFaq() {
    qsa('.faq').forEach(function (faq) {
      var items = qsa('.faq__item', faq);
      items.forEach(function (item) {
        var btn = qs('.faq__q', item);
        if (!btn) return;
        btn.addEventListener('click', function () {
          var isOpen = item.classList.contains('is-open');
          items.forEach(function (o) {
            o.classList.remove('is-open');
            var b = qs('.faq__q', o);
            if (b) b.setAttribute('aria-expanded', 'false');
          });
          if (!isOpen) {
            item.classList.add('is-open');
            btn.setAttribute('aria-expanded', 'true');
          }
        });
      });
    });
  }

  // ------------------------------------------------------------------
  // 4. Revelados al hacer scroll, con retardo escalonado por grupo
  // ------------------------------------------------------------------
  function initReveal() {
    var els = qsa('[data-anim]');
    if (!els.length) return;

    if (REDUCED || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    // retardo segun la posicion dentro del contenedor
    els.forEach(function (el) {
      var group = el.parentElement;
      var sibs = group ? qsa('[data-anim]', group).filter(function (s) { return s.parentElement === group; }) : [];
      var i = sibs.indexOf(el);
      var step = Number(el.dataset.animStep || 90);
      if (i > 0) el.style.transitionDelay = Math.min(i, 6) * step + 'ms';
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });

    els.forEach(function (el) { io.observe(el); });
  }

  // ------------------------------------------------------------------
  // 5. Titulares que suben linea a linea
  // ------------------------------------------------------------------
  // envuelve cada palabra en un span sin romper el marcado interno (<em>, <a>...)
  function wrapWords(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (child) {
      if (child.nodeType === 3) {
        var text = child.nodeValue;
        if (!text.trim()) return;
        var frag = document.createDocumentFragment();
        text.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
          } else {
            var span = document.createElement('span');
            span.className = 'w';
            span.textContent = part;
            frag.appendChild(span);
          }
        });
        child.parentNode.replaceChild(frag, child);
      } else if (child.nodeType === 1 && !child.classList.contains('w')) {
        wrapWords(child);
      }
    });
  }

  function splitLines(el) {
    if (!el.dataset.original) el.dataset.original = el.innerHTML;
    wrapWords(el);

    var words = qsa('.w', el);
    if (!words.length) return;

    // agrupacion por linea segun la posicion vertical real
    var lines = [];
    var top = null;
    words.forEach(function (w) {
      var t = Math.round(w.getBoundingClientRect().top);
      if (top === null || Math.abs(t - top) > 4) { top = t; lines.push([]); }
      lines[lines.length - 1].push(w);
    });

    // cada linea se envuelve en una mascara con desbordamiento oculto
    lines.forEach(function (line) {
      var range = document.createRange();
      range.setStartBefore(line[0]);
      range.setEndAfter(line[line.length - 1]);
      var mask = document.createElement('span');
      var inner = document.createElement('span');
      mask.className = 'line-mask';
      inner.appendChild(range.extractContents());
      mask.appendChild(inner);
      range.insertNode(mask);
    });
  }

  function initSplit() {
    var targets = qsa('[data-split]');
    if (!targets.length) return;
    if (REDUCED || !('IntersectionObserver' in window)) return;

    targets.forEach(function (el) { splitLines(el); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        qsa('.line-mask', e.target).forEach(function (m, i) {
          m.querySelector('span').style.transitionDelay = i * 90 + 'ms';
          m.classList.add('is-in');
        });
        io.unobserve(e.target);
      });
    }, { threshold: 0.15 });

    targets.forEach(function (el) { io.observe(el); });

    // si cambia el ancho, se rehace el troceado por lineas
    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        targets.forEach(function (el) {
          if (el.dataset.original) {
            el.innerHTML = el.dataset.original;
            splitLines(el);
            qsa('.line-mask', el).forEach(function (m) { m.classList.add('is-in'); });
          }
        });
      }, 250);
    });
  }

  // ------------------------------------------------------------------
  // 6. Contadores numericos
  // ------------------------------------------------------------------
  function initCounters() {
    var els = qsa('[data-count]');
    if (!els.length) return;
    if (REDUCED || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.textContent = el.dataset.prefix || '' ; el.textContent += el.dataset.count + (el.dataset.suffix || ''); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var end = parseFloat(el.dataset.count);
        var dec = (el.dataset.count.split('.')[1] || '').length;
        var pre = el.dataset.prefix || '';
        var suf = el.dataset.suffix || '';
        var dur = 1400;
        var t0 = null;
        function step(ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = pre + (end * eased).toFixed(dec) + suf;
          if (p < 1) window.requestAnimationFrame(step);
        }
        window.requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });

    els.forEach(function (el) { io.observe(el); });
  }

  // ------------------------------------------------------------------
  // 7. Parallax suave de la imagen del hero
  // ------------------------------------------------------------------
  function initParallax() {
    var els = qsa('[data-parallax]');
    if (!els.length || REDUCED) return;
    var ticking = false;

    function update() {
      var vh = window.innerHeight;
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var speed = Number(el.dataset.parallax) || 0.12;
        var offset = (r.top + r.height / 2 - vh / 2) * speed;
        el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0) scale(1.1)';
      });
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  // ------------------------------------------------------------------
  // 8. Barra de progreso, volver arriba y boton flotante
  // ------------------------------------------------------------------
  function initScrollUi() {
    var bar = qs('.scroll-progress');
    var top = qs('.to-top');
    var wa = qs('.wa-float');
    if (wa) wa.classList.add('is-in');
    var ticking = false;

    function update() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? window.scrollY / h : 0;
      if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      if (top) top.classList.toggle('is-in', window.scrollY > 700);
      // el botón de WhatsApp está siempre visible: no depende del scroll
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });

    if (top) {
      top.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
      });
    }
    update();
  }

  // ------------------------------------------------------------------
  // 9. Cursor personalizado (solo raton preciso)
  // ------------------------------------------------------------------
  function initCursor() {
    if (REDUCED) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    var dot = document.createElement('div');
    var ring = document.createElement('div');
    dot.className = 'cursor-dot';
    ring.className = 'cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    var mx = 0, my = 0, rx = 0, ry = 0, active = false;

    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!active) { active = true; document.documentElement.classList.add('has-cursor'); }
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
    }, { passive: true });

    (function loop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = 'translate3d(' + rx.toFixed(2) + 'px,' + ry.toFixed(2) + 'px,0)';
      window.requestAnimationFrame(loop);
    })();

    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest('a, button, .svc-card, .post-card, .faq__q, input, textarea, select');
      ring.classList.toggle('is-hover', !!t);
    });

    document.addEventListener('mouseleave', function () {
      document.documentElement.classList.remove('has-cursor');
      active = false;
    });
  }

  // ------------------------------------------------------------------
  // 9 ter. Portada: entrada, palabra rotatoria y vídeo de fondo
  // ------------------------------------------------------------------
  function initHero() {
    var hero = qs('[data-hero]');
    if (!hero) return;

    // la fuente de titulares es propia: se espera a que cargue para no ver el salto
    function live() { hero.classList.add('is-live'); }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { window.requestAnimationFrame(live); });
      setTimeout(live, 1200); // por si tarda demasiado
    } else {
      live();
    }

    // si existe la versión de contorno, se usa la tipografía en lugar del trazo CSS
    var outline = qs('.t-outline', hero);
    if (outline && document.fonts && document.fonts.check) {
      document.fonts.load('1em "SA Triumph Outline"').then(function () {
        if (document.fonts.check('1em "SA Triumph Outline"')) outline.classList.add('has-outline-font');
      }).catch(function () {});
    }

    // vídeo de fondo: se carga tras el primer renderizado y solo si procede
    var bg = qs('[data-hero-video]', hero);

    // en móvil se cambia por la versión vertical: menos peso y sin recorte lateral
    if (bg && bg.dataset.mobileMp4 && window.matchMedia('(max-width: 799px)').matches) {
      qsa('source', bg).forEach(function (s) { bg.removeChild(s); });
      // en esta variante el mp4 pesa menos que el webm, así que va primero
      [['mp4', bg.dataset.mobileMp4], ['webm', bg.dataset.mobileWebm]].forEach(function (pair) {
        if (!pair[1]) return;
        var s = document.createElement('source');
        s.src = pair[1];
        s.type = 'video/' + pair[0];
        bg.appendChild(s);
      });
      if (bg.dataset.mobilePoster) bg.poster = bg.dataset.mobilePoster;
      // sin load() el navegador conserva la fuente que eligió al analizar el HTML
      bg.load();
    }

    if (bg && !REDUCED) {
      var conn = navigator.connection;
      var lowData = conn && (conn.saveData || /2g/.test(conn.effectiveType || ''));
      if (!lowData) {
        var start = function () {
          bg.play().then(function () { bg.classList.add('is-ready'); }).catch(function () {});
        };
        if (document.readyState === 'complete') setTimeout(start, 400);
        else window.addEventListener('load', function () { setTimeout(start, 400); });

        // se pausa cuando la portada sale de pantalla
        if ('IntersectionObserver' in window) {
          new IntersectionObserver(function (es) {
            es.forEach(function (e) {
              if (e.isIntersecting) bg.play().catch(function () {});
              else bg.pause();
            });
          }, { threshold: 0.05 }).observe(hero);
        }
      }
    }
  }

  // palabra que va rotando dentro de una frase
  function initRotator() {
    qsa('[data-rot]').forEach(function (host) {
      var words;
      try { words = JSON.parse(host.dataset.rot); } catch (e) { return; }
      if (!words || !words.length) return;

      // ancho de cada palabra, para que el hueco acompañe en vez de quedarse fijo
      var probe = document.createElement('span');
      probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap';
      probe.className = 'is-in';
      host.appendChild(probe);
      var widths = words.map(function (w) {
        probe.textContent = w;
        return Math.ceil(probe.getBoundingClientRect().width) + 3;
      });
      host.removeChild(probe);

      var current = document.createElement('span');
      current.textContent = words[0];
      current.className = 'is-in';
      host.appendChild(current);
      host.style.width = widths[0] + 'px';

      if (REDUCED || words.length < 2) return;

      var i = 0;
      setInterval(function () {
        i = (i + 1) % words.length;

        var next = document.createElement('span');
        next.textContent = words[i];
        host.appendChild(next);
        host.style.width = widths[i] + 'px';

        // se guarda la palabra saliente ANTES de mover el puntero:
        // si se lee current dentro del rAF ya apunta a la nueva y se
        // marcaria como saliente a si misma, dejando el hueco vacio
        var prev = current;
        current = next;

        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () {
            next.classList.add('is-in');
            prev.classList.remove('is-in');
            prev.classList.add('is-out');
          });
        });

        setTimeout(function () {
          if (prev.parentNode) prev.parentNode.removeChild(prev);
        }, 700);
      }, 3200);
    });
  }

  // ------------------------------------------------------------------
  // 9 bis. Vídeos de obra: se cargan y reproducen solo cuando se ven
  // ------------------------------------------------------------------
  function initVideos() {
    var vids = qsa('video[data-video]');
    if (!vids.length) return;

    var saveData = navigator.connection && navigator.connection.saveData;
    var lowData = saveData || (navigator.connection && /2g/.test(navigator.connection.effectiveType || ''));

    // con movimiento reducido o ahorro de datos se queda la imagen fija
    if (REDUCED || lowData) {
      qsa('[data-video-toggle]').forEach(function (b) { b.style.display = 'none'; });
      return;
    }

    vids.forEach(function (v) {
      var wrap = v.closest('.v-frame');
      var btn = wrap ? qs('[data-video-toggle]', wrap) : null;
      var manual = false; // el usuario ha pausado a mano

      v.addEventListener('playing', function () {
        v.classList.add('is-ready');
        if (btn) btn.classList.add('is-playing');
      });
      v.addEventListener('pause', function () {
        if (btn) btn.classList.remove('is-playing');
      });

      if (btn) {
        btn.addEventListener('click', function () {
          if (v.paused) { manual = false; v.play().catch(function () {}); }
          else { manual = true; v.pause(); }
        });
      }

      if (!('IntersectionObserver' in window)) return;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            if (!manual) v.play().catch(function () {});
          } else if (!v.paused) {
            v.pause();
          }
        });
      }, { threshold: 0.35 });
      io.observe(v);
    });

    // al cambiar de pestaña se pausa todo
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) vids.forEach(function (v) { v.pause(); });
    });
  }

  // ------------------------------------------------------------------
  // 10. Marquesina en bucle
  // ------------------------------------------------------------------
  function initMarquee() {
    qsa('.marquee__track').forEach(function (track) {
      track.innerHTML += track.innerHTML;
    });
  }

  // ------------------------------------------------------------------
  // 11. Validacion y envio del formulario
  // ------------------------------------------------------------------
  function initForms() {
    qsa('form[data-form]').forEach(function (form) {
      var status = qs('.form-status', form);

      function setError(field, msg) {
        var wrap = field.closest('.form-field') || field.closest('.form-check').parentElement;
        var box = wrap ? qs('.form-error', wrap) : null;
        field.setAttribute('aria-invalid', msg ? 'true' : 'false');
        if (box) box.textContent = msg || '';
      }

      function validate() {
        var ok = true;
        qsa('[required]', form).forEach(function (field) {
          var value = (field.value || '').trim();
          var msg = '';
          if (field.type === 'checkbox') {
            if (!field.checked) msg = 'Necesitamos tu consentimiento para poder responderte.';
          } else if (!value) {
            msg = 'Este campo es obligatorio.';
          } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value)) {
            msg = 'Revisa el formato del correo.';
          } else if (field.type === 'tel' && value.replace(/\D/g, '').length < 9) {
            msg = 'Introduce un teléfono de 9 dígitos.';
          }
          if (msg) ok = false;
          setError(field, msg);
        });
        return ok;
      }

      qsa('[required]', form).forEach(function (field) {
        field.addEventListener('blur', function () {
          if (field.getAttribute('aria-invalid') === 'true') validate();
        });
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!validate()) {
          var bad = qs('[aria-invalid="true"]', form);
          if (bad) bad.focus();
          return;
        }

        var data = new FormData(form);
        var btn = qs('button[type="submit"]', form);

        function show(msg, ok) {
          if (!status) return;
          status.textContent = msg;
          status.classList.add('is-visible');
          status.classList.toggle('is-ok', !!ok);
          status.classList.toggle('is-error', !ok);
        }

        if (!FORM_ENDPOINT) {
          var lines = [];
          data.forEach(function (value, key) {
            if (key !== 'privacidad' && key !== '_gotcha') lines.push(key + ': ' + value);
          });
          window.location.href =
            'mailto:' + FALLBACK_EMAIL +
            '?subject=' + encodeURIComponent('Solicitud de presupuesto de microcemento') +
            '&body=' + encodeURIComponent(lines.join('\n'));
          show('Abrimos tu gestor de correo con la solicitud lista para enviar. Si lo prefieres, escríbenos por WhatsApp.', true);
          return;
        }

        if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = 'Enviando...'; }

        fetch(FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
          .then(function (res) {
            if (!res.ok) throw new Error('bad response');
            form.reset();
            show('Solicitud enviada. Te contestamos con el presupuesto en menos de 24 h laborables.', true);
          })
          .catch(function () {
            show('No hemos podido enviar el formulario. Llámanos al 613 87 41 28 o escríbenos por WhatsApp.', false);
          })
          .then(function () {
            if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || 'Enviar'; }
          });
      });
    });
  }

  // ------------------------------------------------------------------
  // 12. Scroll suave a anclas internas
  // ------------------------------------------------------------------
  function initAnchors() {
    qsa('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (!id || id === '#') return;
        var target = document.getElementById(id.slice(1));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initHeader();
    initMegaMenus();
    initFaq();
    initMarquee();
    initSplit();
    initReveal();
    initCounters();
    initParallax();
    initScrollUi();
    initCursor();
    initHero();
    initRotator();
    initVideos();
    initForms();
    initAnchors();
  });
})();
