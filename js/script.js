/* Pradhan Appliance Service — static interactions with a Google Sheets review backend. */
document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const phoneNumber = "917978997413";
  const reviewsApiUrl = "https://script.google.com/macros/s/AKfycbyngSsoEsCAeexfKGCq4X7jQwQ2HQvlKLg4P3jwr3-9_bEPQ6GQ16yPEZW6OAxxyUC9Zg/exec";
  const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeout);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      window.clearTimeout(timer);
    }
  };

  /* Mobile navigation */
  const navToggle = $("#nav-toggle");
  const mainNav = $("#main-nav");
  const header = $("#site-header");
  const mobileBottomBar = $(".mobile-bottom-bar");
  const closeNav = () => {
    mainNav?.classList.remove("open");
    navToggle?.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
  };
  navToggle?.addEventListener("click", () => {
    const open = mainNav.classList.toggle("open");
    navToggle.classList.toggle("open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    if (open) {
      header?.classList.remove("nav-hidden");
      mobileBottomBar?.classList.remove("is-visible");
    }
  });
  $$(".nav-link").forEach((link) => link.addEventListener("click", closeNav));
  document.addEventListener("click", (event) => {
    if (!mainNav?.classList.contains("open")) return;
    if (!mainNav.contains(event.target) && !navToggle?.contains(event.target)) closeNav();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mainNav?.classList.contains("open")) {
      closeNav();
      navToggle?.focus();
    }
  });

  /* Highlight the section currently in view. */
  const navSections = $$("main section[id]");
  const navLinks = $$(".nav-link");
  const updateActiveNav = () => {
    const current = navSections.reduce((active, section) => {
      return section.getBoundingClientRect().top <= 150 ? section.id : active;
    }, "top");
    navLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${current}`));
  };
  window.addEventListener("scroll", updateActiveNav, { passive: true });
  updateActiveNav();
  const updateHeader = () => header?.classList.toggle("compact", window.scrollY > 20);
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();
  let previousScrollPosition = window.scrollY;
  const scrollDeadZone = 8;
  const updateScrollChrome = () => {
    const currentScrollPosition = window.scrollY;
    if (currentScrollPosition <= 10) {
      header?.classList.remove("nav-hidden");
      mobileBottomBar?.classList.remove("is-visible");
      previousScrollPosition = currentScrollPosition;
      return;
    }
    if (mainNav?.classList.contains("open")) {
      header?.classList.remove("nav-hidden");
      mobileBottomBar?.classList.remove("is-visible");
      previousScrollPosition = currentScrollPosition;
      return;
    }
    const scrollDelta = currentScrollPosition - previousScrollPosition;
    if (Math.abs(scrollDelta) < scrollDeadZone) return;
    if (scrollDelta > 0) {
      header?.classList.add("nav-hidden");
      mobileBottomBar?.classList.add("is-visible");
    } else {
      header?.classList.remove("nav-hidden");
      mobileBottomBar?.classList.remove("is-visible");
    }
    previousScrollPosition = currentScrollPosition;
  };
  window.addEventListener("scroll", updateScrollChrome, { passive: true });
  updateScrollChrome();

  /* Reveal major sections once, with a small stagger for their children. */
  const revealGroups = [".trust-grid", ".services-grid", ".why-us-inner", ".benefits-grid", ".steps", ".reviews", ".booking-inner", ".faq-inner", ".cta-strip-inner"];
  revealGroups.forEach((selector) => $(selector)?.classList.add("reveal-stagger"));
  const processSteps = $$(".steps li");
  const startProcessSequence = () => {
    const process = $(".steps");
    if (process?.dataset.sequenceStarted === "true") return;
    if (process) process.dataset.sequenceStarted = "true";
    processSteps.forEach((step) => step.classList.remove("active"));
    processSteps.forEach((step, index) => window.setTimeout(() => {
      step.classList.add("active");
      process?.style.setProperty("--process-progress", `${Math.min(100, (index + 1) * 25)}%`);
    }, index * 450));
  };
  const revealElement = (element) => {
    if (element.classList.contains("is-visible")) return;
    element.classList.add("is-visible");
    if (element.matches(".steps")) startProcessSequence();
  };
  const revealInitialViewport = () => {
    $$(".reveal, .reveal-stagger").forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight * 1.15 && rect.bottom > 0) revealElement(element);
    });
  };
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      revealElement(entry.target);
      revealObserver.unobserve(entry.target);
    }), { threshold: 0.14 });
    $$(".reveal, .reveal-stagger").forEach((element) => revealObserver.observe(element));
    revealInitialViewport();
    window.setTimeout(revealInitialViewport, 700);
  } else {
    $$(".reveal, .reveal-stagger").forEach((element) => element.classList.add("is-visible"));
    startProcessSequence();
  }
  $("#current-year").textContent = new Date().getFullYear();

  /* Hero image carousel: fade/scale, autoplay, controls and touch swipe. */
  const heroSlider = $("#hero-slider");
  const heroSlides = $$(".hero-slide", heroSlider);
  const heroDots = $("#hero-slider-dots");
  const heroPrevious = $("#hero-slider-prev");
  const heroNext = $("#hero-slider-next");
  let heroIndex = 0;
  let heroTimer;
  let heroTouchStart;
  const paintHeroDots = () => {
    if (!heroDots) return;
    heroDots.innerHTML = "";
    heroSlides.forEach((slide, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = `hero-slider-dot${index === heroIndex ? " is-active" : ""}`;
      dot.setAttribute("aria-label", `Show hero image ${index + 1}`);
      dot.setAttribute("aria-current", index === heroIndex ? "true" : "false");
      dot.addEventListener("click", () => {
        setHeroSlide(index);
        restartHeroAutoplay();
      });
      heroDots.appendChild(dot);
    });
  };
  const setHeroSlide = (nextIndex) => {
    if (!heroSlides.length) return;
    heroIndex = (nextIndex + heroSlides.length) % heroSlides.length;
    heroSlides.forEach((slide, index) => slide.classList.toggle("is-active", index === heroIndex));
    paintHeroDots();
  };
  const restartHeroAutoplay = () => {
    window.clearInterval(heroTimer);
    if (heroSlides.length > 1 && !document.hidden) heroTimer = window.setInterval(() => setHeroSlide(heroIndex + 1), 4700);
  };
  heroPrevious?.addEventListener("click", () => { setHeroSlide(heroIndex - 1); restartHeroAutoplay(); });
  heroNext?.addEventListener("click", () => { setHeroSlide(heroIndex + 1); restartHeroAutoplay(); });
  heroSlider?.addEventListener("mouseenter", () => window.clearInterval(heroTimer));
  heroSlider?.addEventListener("mouseleave", restartHeroAutoplay);
  heroSlider?.addEventListener("focusin", () => window.clearInterval(heroTimer));
  heroSlider?.addEventListener("focusout", restartHeroAutoplay);
  heroSlider?.addEventListener("touchstart", (event) => {
    heroTouchStart = event.changedTouches[0].clientX;
    window.clearInterval(heroTimer);
  }, { passive: true });
  heroSlider?.addEventListener("touchend", (event) => {
    if (heroTouchStart === undefined) return;
    const distance = event.changedTouches[0].clientX - heroTouchStart;
    if (Math.abs(distance) > 45) setHeroSlide(heroIndex + (distance < 0 ? 1 : -1));
    heroTouchStart = undefined;
    restartHeroAutoplay();
  }, { passive: true });
  heroSlider?.addEventListener("touchcancel", () => {
    heroTouchStart = undefined;
    restartHeroAutoplay();
  }, { passive: true });
  setHeroSlide(0);
  restartHeroAutoplay();

  /* Prefill the booking form when a service card is chosen. */
  const applianceSelect = $("#appliance");
  $$(".service-book").forEach((button) => {
    button.addEventListener("click", () => {
      applianceSelect.value = button.dataset.service;
      $("#book")?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => $("#full-name")?.focus(), 500);
    });
  });
  const dateInput = $("#preferred-date");
  if (dateInput) {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split("T")[0];
    dateInput.min = localDate;
  }

  /* Booking form: validates locally, then hands the request to WhatsApp. */
  const bookingForm = $("#book-form");
  const bookingNote = $("#form-note");
  const showError = (input, message) => {
    const error = $(`[data-error-for="${input.name}"]`);
    input.classList.toggle("invalid", Boolean(message));
    if (error) error.textContent = message || "";
  };
  const validateBooking = () => {
    let valid = true;
    const name = $("#full-name");
    const phone = $("#phone");
    const appliance = $("#appliance");
    const location = $("#location");
    if (!name.value.trim()) { showError(name, "Please enter your name."); valid = false; } else showError(name, "");
    if (!/^(?:\+91[\s-]?)?[6-9]\d{9}$/.test(phone.value.replace(/\s/g, ""))) { showError(phone, "Enter a valid 10-digit mobile number."); valid = false; } else showError(phone, "");
    if (!appliance.value) { showError(appliance, "Choose an appliance."); valid = false; } else showError(appliance, "");
    if (!location.value) { showError(location, "Choose your service area."); valid = false; } else showError(location, "");
    return valid;
  };
  bookingForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    bookingNote.className = "form-note";
    bookingNote.textContent = "";
    if (!validateBooking()) {
      bookingNote.textContent = "Please check the highlighted fields.";
      $("#book-form .invalid")?.focus();
      return;
    }
    const submit = $("#booking-submit");
    const data = new FormData(bookingForm);
    const message = [
      "Hello Pradhan Appliance Service, I would like to book a service.",
      `Name: ${data.get("full-name")}`,
      `Phone: ${data.get("phone")}`,
      `Appliance: ${data.get("appliance")}`,
      `Location: ${data.get("location")}`,
      data.get("preferred-date") ? `Preferred date: ${data.get("preferred-date")}` : "",
      data.get("preferred-time") ? `Preferred time: ${data.get("preferred-time")}` : "",
      data.get("problem") ? `Problem: ${data.get("problem")}` : ""
    ].filter(Boolean).join("\n");
    submit.disabled = true;
    submit.innerHTML = "Preparing WhatsApp request…";
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
    window.setTimeout(() => {
      bookingForm.reset();
      submit.disabled = false;
      submit.innerHTML = 'Send booking request <span aria-hidden="true">→</span>';
      bookingNote.className = "form-note success";
      bookingNote.textContent = "Your details are ready in WhatsApp. Send the message to complete your request.";
    }, 650);
  });

  /* Animate FAQ expansion and collapse consistently on touch and pointer devices. */
  $$(".faq-list details").forEach((detail) => {
    const summary = $("summary", detail);
    const content = $("p", detail);
    if (!summary || !content) return;
    summary.addEventListener("click", (event) => {
      event.preventDefault();
      if (detail.dataset.animating === "true") return;
      detail.dataset.animating = "true";
      const opening = !detail.open;
      if (opening) {
        detail.open = true;
        content.style.height = "0px";
        content.style.opacity = "0";
        content.style.transform = "translate3d(0, -4px, 0)";
        requestAnimationFrame(() => requestAnimationFrame(() => {
          content.style.height = `${content.scrollHeight}px`;
          content.style.opacity = "1";
          content.style.transform = "translate3d(0, 0, 0)";
        }));
      } else {
        content.style.height = `${content.offsetHeight}px`;
        requestAnimationFrame(() => {
          content.style.height = "0px";
          content.style.opacity = "0";
          content.style.transform = "translate3d(0, -4px, 0)";
        });
      }
      let finished = false;
      let finishTimer;
      const finish = (transitionEvent) => {
        if (transitionEvent.propertyName !== "height") return;
        if (finished) return;
        finished = true;
        window.clearTimeout(finishTimer);
        content.removeEventListener("transitionend", finish);
        if (!opening) detail.open = false;
        content.style.height = "";
        content.style.opacity = "";
        content.style.transform = "";
        delete detail.dataset.animating;
      };
      content.addEventListener("transitionend", finish);
      finishTimer = window.setTimeout(() => finish({ propertyName: "height" }), 360);
    });
  });

  /* Reviews come only from published rows in the Google Sheet. */
  let reviews = [];
  const reviewsTrack = $("#reviews-track");
  const controls = $("#carousel-controls");
  const dots = $("#carousel-dots");
  let slideIndex = 0;
  let autoSlide;
  const getVisible = () => window.innerWidth <= 600 ? 1 : window.innerWidth <= 820 ? 2 : 3;
  const renderStars = (rating) => `<span class="review-stars" aria-label="${rating} out of 5 stars">${"★".repeat(rating)}${"☆".repeat(5 - rating)}</span>`;
  const formatReviewDate = (date) => {
    if (!date) return "Recently";
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? String(date) : new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(parsed);
  };
  const renderReviewCard = (review) => `<article class="review-card">${renderStars(review.rating)}<blockquote>“${escapeHtml(review.review)}”</blockquote><div class="review-author"><strong>${escapeHtml(review.name)}</strong><time>${escapeHtml(formatReviewDate(review.date))}</time></div></article>`;
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  const showReviewState = (title, message) => {
    reviewsTrack.innerHTML = `<div class="reviews-empty"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(message)}</span></div>`;
    controls.hidden = true;
  };
  const renderReviews = () => {
    if (!reviews.length) {
      showReviewState("No published reviews yet", "Be the first to share your experience.");
      return;
    }
    controls.hidden = false;
    reviewsTrack.innerHTML = reviews.map(renderReviewCard).join("");
  };
  const normalizeReviews = (payload) => {
    const rows = Array.isArray(payload) ? payload : Array.isArray(payload.reviews) ? payload.reviews : Array.isArray(payload.data) ? payload.data : [];
    return rows.map((review, index) => ({
      id: review.id || `review-${index}`,
      name: review.name ?? review.Name ?? "",
      rating: Math.round(Number(review.rating ?? review.Rating)),
      review: review.review ?? review.Review ?? "",
      date: review.date ?? review.Date ?? ""
    })).filter((review) => review.name && review.review && review.rating >= 1 && review.rating <= 5);
  };
  const maxIndex = () => Math.max(0, reviews.length - getVisible());
  let dotsSignature = "";
  const paintDots = () => {
    const total = Math.max(1, maxIndex() + 1);
    const signature = `${total}:${getVisible()}`;
    if (dotsSignature !== signature) {
      dots.innerHTML = "";
      for (let i = 0; i < total; i += 1) {
        const dot = document.createElement("button");
        dot.className = "carousel-dot";
        dot.type = "button";
        dot.setAttribute("aria-label", `Show review group ${i + 1}`);
        dot.addEventListener("click", () => { slideIndex = i; updateCarousel(); restartAutoSlide(); });
        dots.appendChild(dot);
      }
      dotsSignature = signature;
    }
    $$(".carousel-dot", dots).forEach((dot, index) => dot.classList.toggle("active", index === slideIndex));
  };
  const updateCarousel = () => {
    if (!reviews.length) {
      return;
    }
    controls.hidden = false;
    slideIndex = Math.min(slideIndex, maxIndex());
    const gap = 18;
    const cardWidth = (reviewsTrack.parentElement.clientWidth - gap * (getVisible() - 1)) / getVisible();
    reviewsTrack.style.transform = `translate3d(-${slideIndex * (cardWidth + gap)}px, 0, 0)`;
    paintDots();
  };
  const restartAutoSlide = () => {
    window.clearInterval(autoSlide);
    if (reviews.length > getVisible() && !document.hidden) autoSlide = window.setInterval(() => {
      slideIndex = slideIndex >= maxIndex() ? 0 : slideIndex + 1;
      updateCarousel();
    }, 6200);
  };
  $("#reviews-prev")?.addEventListener("click", () => { slideIndex = slideIndex <= 0 ? maxIndex() : slideIndex - 1; updateCarousel(); restartAutoSlide(); });
  $("#reviews-next")?.addEventListener("click", () => { slideIndex = slideIndex >= maxIndex() ? 0 : slideIndex + 1; updateCarousel(); restartAutoSlide(); });
  $("#reviews-carousel")?.addEventListener("mouseenter", () => window.clearInterval(autoSlide));
  $("#reviews-carousel")?.addEventListener("mouseleave", restartAutoSlide);
  let touchStart;
  $("#reviews-carousel")?.addEventListener("touchstart", (event) => { touchStart = event.changedTouches[0].clientX; window.clearInterval(autoSlide); }, { passive: true });
  $("#reviews-carousel")?.addEventListener("touchend", (event) => {
    if (touchStart === undefined) return;
    const distance = event.changedTouches[0].clientX - touchStart;
    if (Math.abs(distance) > 45) slideIndex = distance < 0 ? Math.min(maxIndex(), slideIndex + 1) : Math.max(0, slideIndex - 1);
    updateCarousel(); restartAutoSlide(); touchStart = undefined;
  }, { passive: true });
  $("#reviews-carousel")?.addEventListener("touchcancel", () => {
    touchStart = undefined;
    restartAutoSlide();
  }, { passive: true });
  let resizeFrame;
  window.addEventListener("resize", () => {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(() => { updateCarousel(); restartAutoSlide(); });
  }, { passive: true });
  showReviewState("Loading reviews", "Please wait while we fetch the latest customer experiences.");
  const loadReviews = async () => {
    try {
      const response = await fetchWithTimeout(reviewsApiUrl, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Review request failed with ${response.status}`);
      const payload = await response.json();
      reviews = normalizeReviews(payload);
      dotsSignature = "";
      slideIndex = 0;
      renderReviews();
      updateCarousel();
      restartAutoSlide();
    } catch (error) {
      reviews = [];
      showReviewState("Reviews are temporarily unavailable", "Please try again shortly.");
    }
  };
  loadReviews();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.clearInterval(heroTimer);
      window.clearInterval(autoSlide);
    } else {
      restartHeroAutoplay();
      restartAutoSlide();
    }
  });

  /* Accessible modals. Fixed-body locking avoids the scroll jump caused by iOS Safari
     when overflow is changed on the document while the address bar is moving. */
  let lockedScrollY = 0;
  let lastModalTrigger;
  const openModal = (modal) => {
    if (!modal) return;
    if (modal.__closeTimer) window.clearTimeout(modal.__closeTimer);
    lastModalTrigger = document.activeElement;
    if (!document.body.classList.contains("modal-open")) {
      lockedScrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${lockedScrollY}px`;
      document.body.style.width = "100%";
    }
    modal.classList.remove("is-closing");
    modal.hidden = false;
    document.body.classList.add("modal-open");
    $(".modal-close", modal)?.focus();
  };
  const closeModal = (modal) => {
    if (!modal || modal.hidden || modal.classList.contains("is-closing")) return;
    modal.classList.add("is-closing");
    const finishClose = () => {
      modal.hidden = true;
      modal.classList.remove("is-closing");
      const anotherModalOpen = $$(".modal:not([hidden]), .lightbox:not([hidden])").some((element) => element !== modal && !element.classList.contains("is-closing"));
      if (!anotherModalOpen) {
        document.body.classList.remove("modal-open");
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, lockedScrollY);
        lastModalTrigger?.focus?.();
      }
    };
    const closeDuration = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 0 : 220;
    modal.__closeTimer = window.setTimeout(finishClose, closeDuration);
  };
  const reviewModal = $("#review-modal");
  const allReviewsModal = $("#all-reviews-modal");
  const galleryLightbox = $("#gallery-lightbox");
  $("#write-review")?.addEventListener("click", () => openModal(reviewModal));
  $$("[data-open-review]").forEach((button) => button.addEventListener("click", () => openModal(reviewModal)));
  $$("[data-close-modal]").forEach((button) => button.addEventListener("click", () => closeModal(button.closest(".modal, .lightbox"))));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") $$(".modal:not([hidden]), .lightbox:not([hidden])").forEach(closeModal);
  });
  const allReviewsList = $("#all-reviews-list");
  $("#view-all-reviews")?.addEventListener("click", () => {
    allReviewsList.innerHTML = reviews.length ? reviews.map((review) => `<article class="all-review">${renderStars(review.rating)}<blockquote>“${escapeHtml(review.review)}”</blockquote><strong>${escapeHtml(review.name)}</strong><time>${escapeHtml(formatReviewDate(review.date))}</time></article>`).join("") : "<p>No reviews yet. Be the first to share your experience.</p>";
    openModal(allReviewsModal);
  });

  /* Local gallery lightbox. Keeping the images local removes a common source of
     blank frames and delayed layout changes on mobile Safari. */
  const lightboxImage = $("#lightbox-image");
  const lightboxTitle = $("#lightbox-title");
  $$(".gallery-item").forEach((item) => item.addEventListener("click", () => {
    if (!lightboxImage || !galleryLightbox) return;
    lightboxImage.src = item.dataset.gallerySrc;
    lightboxImage.alt = item.dataset.galleryAlt || "";
    lightboxTitle.textContent = item.dataset.galleryAlt || "";
    openModal(galleryLightbox);
  }));

  /* Review form and clickable star rating. */
  const reviewForm = $("#review-form");
  let selectedRating = 0;
  const paintRating = () => $$(".star-picker button").forEach((button) => {
    const active = Number(button.dataset.rating) <= selectedRating;
    button.classList.toggle("active", active);
    button.setAttribute("aria-checked", String(active));
  });
  $$(".star-picker button").forEach((button) => button.addEventListener("click", () => {
    selectedRating = Number(button.dataset.rating);
    paintRating();
  }));
  const reviewError = (field, message) => { const el = $(`[data-review-error="${field}"]`); if (el) el.textContent = message || ""; };
  reviewForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(reviewForm);
    let valid = true;
    if (!String(formData.get("name")).trim()) { reviewError("name", "Please enter your name."); valid = false; } else reviewError("name", "");
    if (!selectedRating) { reviewError("rating", "Choose a rating."); valid = false; } else reviewError("rating", "");
    const reviewText = String(formData.get("review") || "").trim();
    if (!reviewText) { reviewError("review", "Please write a review."); valid = false; } else if (reviewText.length > 1000) { reviewError("review", "Please keep your review under 1000 characters."); valid = false; } else reviewError("review", "");
    const note = $("#review-note");
    if (!valid) { note.textContent = "Please complete the highlighted fields."; return; }
    const submit = $("button[type=submit]", reviewForm);
    submit.disabled = true;
    submit.textContent = "Submitting…";
    note.className = "form-note";
    note.textContent = "";
    try {
      const response = await fetchWithTimeout(reviewsApiUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ name: String(formData.get("name")).trim(), rating: selectedRating, review: reviewText })
      });
      if (!response.ok) throw new Error(`Review submission failed with ${response.status}`);
      note.className = "form-note success";
      note.textContent = "Thank you for your review! Your review has been submitted and is awaiting approval.";
      reviewForm.reset();
      selectedRating = 0;
      paintRating();
      window.setTimeout(() => closeModal(reviewModal), 1800);
    } catch (error) {
      note.textContent = "We couldn't submit your review right now. Please try again shortly.";
    } finally {
      submit.disabled = false;
      submit.innerHTML = 'Submit Review <span>→</span>';
    }
  });

});