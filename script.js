(function () {
  'use strict';

  const HEARTS = ['❤️', '💕', '💗', '💖', '💓', '💝', '🩷', '💘'];
  const HEART_COUNT = 95;
  const YES_GROWTH_RATE = 0.03;
  const YES_GROWTH_ACCEL = 0.2;
  const YES_FADE_NO_AT_SCALE = 2.2;
  const NO_FADE_RATE = 0.35;
  const NO_FLEE_DISTANCE = 140;
  const NO_FLEE_DISTANCE_FIRST = 180;
  const YES_NEAR_DISTANCE_FIRST = 110;
  const NO_GLIDE_MIN = 50;
  const NO_GLIDE_MAX = 120;
  const NO_GLIDE_COOLDOWN_MS = 400;
  const VIEWPORT_PAD = 20;
  const NO_INITIAL_GAP = 24;

  const root = document.documentElement;
  const askView = document.getElementById('ask-view');
  const startView = document.getElementById('start-view');
  const galleryView = document.getElementById('gallery-view');
  const passwordInput = document.getElementById('password-input');
  const submitPassword = document.getElementById('submit-password');
  const btnYes = document.getElementById('btn-yes');
  const btnNo = document.getElementById('btn-no');
  const heartRain = document.getElementById('heart-rain');
  const slides = document.querySelectorAll('.gallery-slides .slide');
  const galleryPrev = document.getElementById('gallery-prev');
  const galleryNext = document.getElementById('gallery-next');
  const galleryDots = document.getElementById('gallery-dots');

  let yesScale = 1;
  let growthInterval = null;
  let currentSlide = 0;
  let answered = false;
  let noLastGlideTime = 0;
  let growthStarted = false;
  let noHasGlidedOnce = false;

  function setNoPositionPx(leftPx, topPx) {
    root.style.setProperty('--no-left', leftPx + 'px');
    root.style.setProperty('--no-top', topPx + 'px');
  }

  function rectsOverlap(a, b) {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  }

  function initNoButtonPosition() {
    btnNo.classList.add('no-button--floating');
    var noRect = btnNo.getBoundingClientRect();
    setNoPositionPx(window.innerWidth - noRect.width - VIEWPORT_PAD, VIEWPORT_PAD);
    root.style.setProperty('--yes-margin-right', (noRect.width + NO_INITIAL_GAP) + 'px');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          var yesRect = btnYes.getBoundingClientRect();
          noRect = btnNo.getBoundingClientRect();
          var left = yesRect.right + NO_INITIAL_GAP;
          var top = yesRect.top + (yesRect.height - noRect.height) / 2;
          setNoPositionPx(left, top);
        });
      });
    });
  }

  function setYesScale(scale) {
    yesScale = scale;
    root.style.setProperty('--yes-scale', String(yesScale));
    if (yesScale >= YES_FADE_NO_AT_SCALE) {
      var noOpacity = Math.max(0, 1 - (yesScale - YES_FADE_NO_AT_SCALE) * NO_FADE_RATE);
      root.style.setProperty('--no-opacity', String(noOpacity));
    } else {
      root.style.setProperty('--no-opacity', '1');
    }
  }

  function startYesGrowth() {
    if (growthInterval) return;
    growthInterval = setInterval(function () {
      var rate = YES_GROWTH_RATE * (1 + (yesScale - 1) * YES_GROWTH_ACCEL);
      setYesScale(yesScale + rate);
    }, 100);
  }

  function stopYesGrowth() {
    if (growthInterval) {
      clearInterval(growthInterval);
      growthInterval = null;
    }
  }

  function getNoRect() {
    return btnNo.getBoundingClientRect();
  }

  function glideNoAwayFrom(mouseX, mouseY) {
    var noRect = getNoRect();
    var noCenterX = noRect.left + noRect.width / 2;
    var noCenterY = noRect.top + noRect.height / 2;
    var dx = noCenterX - mouseX;
    var dy = noCenterY - mouseY;
    var dist = Math.hypot(dx, dy);
    if (dist < 1) dist = 1;
    var angleAway = Math.atan2(dy, dx);
    var angleSpread = (Math.PI / 2);
    var angle = angleAway + (Math.random() - 0.5) * 2 * angleSpread;
    var glideDist = NO_GLIDE_MIN + Math.random() * (NO_GLIDE_MAX - NO_GLIDE_MIN);
    var newLeft = noRect.left + Math.cos(angle) * glideDist;
    var newTop = noRect.top + Math.sin(angle) * glideDist;
    var noW = noRect.width;
    var noH = noRect.height;
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    newLeft = Math.max(VIEWPORT_PAD, Math.min(vw - noW - VIEWPORT_PAD, newLeft));
    newTop = Math.max(VIEWPORT_PAD, Math.min(vh - noH - VIEWPORT_PAD, newTop));
    var yesRect = btnYes.getBoundingClientRect();
    var noRectNew = { left: newLeft, top: newTop, right: newLeft + noW, bottom: newTop + noH };
    var tries = 0;
    var maxTries = 8;
    while (rectsOverlap(noRectNew, yesRect) && tries < maxTries) {
      angle += (Math.random() > 0.5 ? 1 : -1) * (Math.PI / 3);
      glideDist = NO_GLIDE_MIN + Math.random() * (NO_GLIDE_MAX - NO_GLIDE_MIN) * 0.7;
      newLeft = noRect.left + Math.cos(angle) * glideDist;
      newTop = noRect.top + Math.sin(angle) * glideDist;
      newLeft = Math.max(VIEWPORT_PAD, Math.min(vw - noW - VIEWPORT_PAD, newLeft));
      newTop = Math.max(VIEWPORT_PAD, Math.min(vh - noH - VIEWPORT_PAD, newTop));
      noRectNew = { left: newLeft, top: newTop, right: newLeft + noW, bottom: newTop + noH };
      tries++;
    }
    if (!rectsOverlap(noRectNew, yesRect)) {
      setNoPositionPx(newLeft, newTop);
      return true;
    }
    return false;
  }

  function handleMouseMove(e) {
    if (answered) return;
    if (!btnNo.classList.contains('no-button--floating')) return;
    var noRect = getNoRect();
    var noCenterX = noRect.left + noRect.width / 2;
    var noCenterY = noRect.top + noRect.height / 2;
    var distToNo = Math.hypot(e.clientX - noCenterX, e.clientY - noCenterY);
    var inRange;
    if (noHasGlidedOnce) {
      inRange = distToNo < NO_FLEE_DISTANCE;
    } else {
      var yesRect = btnYes.getBoundingClientRect();
      var yesCenterX = yesRect.left + yesRect.width / 2;
      var yesCenterY = yesRect.top + yesRect.height / 2;
      var distToYes = Math.hypot(e.clientX - yesCenterX, e.clientY - yesCenterY);
      inRange = distToNo < NO_FLEE_DISTANCE_FIRST || distToYes < YES_NEAR_DISTANCE_FIRST;
    }
    if (inRange) {
      if (!growthStarted) {
        growthStarted = true;
        startYesGrowth();
      }
      var now = Date.now();
      if (now - noLastGlideTime >= NO_GLIDE_COOLDOWN_MS) {
        noLastGlideTime = now;
        if (glideNoAwayFrom(e.clientX, e.clientY)) {
          noHasGlidedOnce = true;
        }
      }
    }
  }

  function startHeartRain() {
    heartRain.classList.add('is-active');
    heartRain.innerHTML = '';
    for (let i = 0; i < HEART_COUNT; i++) {
      const wrapper = document.createElement('span');
      wrapper.className = 'heart-wrapper';
      wrapper.style.left = Math.random() * 100 + '%';
      const el = document.createElement('span');
      el.className = 'heart';
      el.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
      el.style.animationDuration = (2 + Math.random() * 4) + 's';
      el.style.animationDelay = Math.random() * 2 + 's';
      wrapper.appendChild(el);
      heartRain.appendChild(wrapper);
    }
    setTimeout(function () {
      heartRain.classList.remove('is-active');
    }, 4000);
  }

  function handleSubmitPassword() {
    const password = passwordInput.value;
    if (password === 'ilovecorn') {
      showAskView();
      startView.classList.remove('view--active');
    } else {
      alert('Invalid password');
    }
  }

  function showAskView() {
    askView.classList.add('view--active');
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', function (e) {
      if (e.touches.length) handleMouseMove(e.touches[0]);
    });
  }

  function showGallery() {
    answered = true;
    stopYesGrowth();
    startHeartRain();
    askView.classList.remove('view--active');
    setTimeout(function () {
      galleryView.classList.add('view--active');
      updateGallerySlide();
    }, 3000);
  }



  var gallerySlidesEl = document.querySelector('.gallery-slides');
  var slideCount = slides.length;

  function updateGallerySlide(noTransition) {
    var offset = -currentSlide * 100;
    if (noTransition) {
      gallerySlidesEl.style.transition = 'none';
    }
    gallerySlidesEl.style.transform = 'translateX(' + offset + '%)';
    var dots = galleryDots.querySelectorAll('button');
    dots.forEach(function (dot, i) {
      dot.setAttribute('aria-selected', i === currentSlide ? 'true' : 'false');
    });
    if (noTransition) {
      gallerySlidesEl.offsetHeight;
      gallerySlidesEl.style.transition = '';
    }
  }

  function onWrapTransitionEnd(e) {
    if (e && e.propertyName !== 'transform') return;
    gallerySlidesEl.removeEventListener('transitionend', onWrapTransitionEnd);
    gallerySlidesEl.style.transition = 'none';
    gallerySlidesEl.style.transform = 'translateX(' + (-currentSlide * 100) + '%)';
    if (wrapClone) {
      wrapClone.parentNode.removeChild(wrapClone);
      wrapClone = null;
    }
    gallerySlidesEl.offsetHeight;
    gallerySlidesEl.style.transition = '';
    updateGallerySlide(true);
  }

  var wrapClone = null;

  function goToSlide(index) {
    var prevSlide = currentSlide;
    var newSlide = ((index % slideCount) + slideCount) % slideCount;
    var wrapNext = (prevSlide === slideCount - 1 && newSlide === 0);
    var wrapPrev = (prevSlide === 0 && newSlide === slideCount - 1);

    if (wrapNext) {
      wrapClone = slides[0].cloneNode(true);
      gallerySlidesEl.appendChild(wrapClone);
      currentSlide = newSlide;
      var dots = galleryDots.querySelectorAll('button');
      dots.forEach(function (dot, i) { dot.setAttribute('aria-selected', i === currentSlide ? 'true' : 'false'); });
      gallerySlidesEl.addEventListener('transitionend', onWrapTransitionEnd);
      gallerySlidesEl.style.transform = 'translateX(-' + (slideCount * 100) + '%)';
      return;
    }

    if (wrapPrev) {
      wrapClone = slides[slideCount - 1].cloneNode(true);
      gallerySlidesEl.insertBefore(wrapClone, gallerySlidesEl.firstChild);
      gallerySlidesEl.style.transition = 'none';
      gallerySlidesEl.style.transform = 'translateX(-100%)';
      gallerySlidesEl.offsetHeight;
      currentSlide = newSlide;
      var dots = galleryDots.querySelectorAll('button');
      dots.forEach(function (dot, i) { dot.setAttribute('aria-selected', i === currentSlide ? 'true' : 'false'); });
      gallerySlidesEl.style.transition = '';
      gallerySlidesEl.addEventListener('transitionend', onWrapTransitionEnd);
      gallerySlidesEl.style.transform = 'translateX(0%)';
      return;
    }

    currentSlide = newSlide;
    updateGallerySlide(false);
  }

  submitPassword.addEventListener('click', handleSubmitPassword);

  btnYes.addEventListener('click', function () {
    if (answered) return;
    showGallery();
  });

  initNoButtonPosition();

  galleryPrev.addEventListener('click', function () {
    goToSlide(currentSlide - 1);
  });
  galleryNext.addEventListener('click', function () {
    goToSlide(currentSlide + 1);
  });

  slides.forEach(function (_, i) {
    const dot = document.createElement('button');
    dot.setAttribute('type', 'button');
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', 'Slide ' + (i + 1));
    dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    dot.addEventListener('click', function () {
      goToSlide(i);
    });
    galleryDots.appendChild(dot);
  });
})();
